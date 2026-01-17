"""Composer API endpoints - Simple aliases to existing orchestrator functionality"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from app.core.orchestrator import EngraveJob, run_engrave_job, run_cycle_for_site
from app.core.state import get_state
from datetime import datetime
import uuid

router = APIRouter(prefix="/composer", tags=["composer"])

def generate_order_number(prefix: str = "C") -> str:
    """Generate unique order number with timestamp"""
    timestamp = datetime.now().strftime("%m%d%H%M")  # MMDDHHMM
    return f"{prefix}-{timestamp}"

class DirectJobRequest(BaseModel):
    laserText: str = Field(..., min_length=1, max_length=50, description="Text to engrave")
    site: Literal["JOB_POS1", "JOB_POS2"] = Field(default="JOB_POS1", description="Target site")

class BatchJobItem(BaseModel):
    laserText: str = Field(..., min_length=1, max_length=50, description="Text to engrave")

class BatchJobRequest(BaseModel):
    jobs: List[BatchJobItem] = Field(..., min_items=1, max_items=5, description="Jobs for batch")
    site: Literal["JOB_POS1", "JOB_POS2"] = Field(default="JOB_POS1", description="Target site for all jobs")

def run_composer_job_background(state, jobs: List[EngraveJob], site: str, run_id: str, source: str, mode: str):
    """Run composer job in background with progress tracking"""
    try:
        # Add run to history for tracking
        run_entry = {
            "runId": run_id,
            "site": site,
            "startedAt": datetime.now().isoformat(),
            "endedAt": None,
            "status": "running",
            "jobsProcessed": [],
            "cycleSummary": None,
            "configSnapshot": state.config.copy(),
            "error": None,
            "source": source,
            "mode": mode
        }
        state.add_run_history(run_entry)
        
        # Add jobs to queue (do not clear existing queue)
        for job in jobs:
            state.orchestrator.enqueue_job(job)
        
        # Acquire cycle lock to prevent concurrent cycles
        with state.get_cycle_lock():
            # Run the actual cycle
            summary = run_cycle_for_site(state.orchestrator, site, max_jobs_in_cycle=len(jobs))
            
            # Add source metadata
            summary["source"] = source
            summary["mode"] = mode
            
            if "error" in summary:
                # No jobs found or error
                run_entry.update({
                    "status": "error",
                    "endedAt": datetime.now().isoformat(),
                    "error": summary["error"]
                })
            else:
                # Successful cycle
                run_entry.update({
                    "status": "completed",
                    "endedAt": summary["endedAt"],
                    "jobsProcessed": summary["jobsProcessed"],
                    "cycleSummary": summary
                })
                
                # Update cumulative billing for user jobs
                engraver_billing = state.engraver["usageBilling"]
                agv_billing = state.agv["usageBilling"]
                state.update_cumulative_billing(
                    source, 
                    engraver_billing, 
                    agv_billing, 
                    summary["jobsProcessed"]
                )
                
                # Store individual job details
                if "individualJobs" in summary:
                    for job_detail in summary["individualJobs"]:
                        state.add_individual_job({
                            **job_detail,
                            "source": source,
                            "site": site,
                            "run_id": run_id,
                            "agv_distance_share": round(summary.get("agvBilledMeters", 0) / len(summary["individualJobs"]) if summary.get("individualJobs") else 0, 6),
                            "agv_cost_share": round(summary.get("agvCostEUR", 0) / len(summary["individualJobs"]) if summary.get("individualJobs") else 0, 6)
                        })
        
        state.update_run_history(run_id, run_entry)
        
    except Exception as e:
        run_entry.update({
            "status": "error",
            "endedAt": datetime.now().isoformat(),
            "error": str(e)
        })
        state.update_run_history(run_id, run_entry)

@router.post("/direct")
async def run_direct_job(request: DirectJobRequest, background_tasks: BackgroundTasks):
    """Run a single job directly at specified site with real-time tracking"""
    try:
        state = get_state()
        
        # Generate unique order number and run ID
        order_no = generate_order_number("D")  # D for Direct
        run_id = f"direct_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{order_no}"
        
        # Create job
        job = EngraveJob(order_no, request.laserText, request.site)
        
        # Start background task for real-time tracking
        background_tasks.add_task(
            run_composer_job_background, 
            state, 
            [job], 
            request.site, 
            run_id, 
            "direct", 
            "individual"
        )
        
        return {
            "success": True,
            "message": f"Direct job {order_no} started successfully",
            "runId": run_id,
            "orderNo": order_no,
            "site": request.site,
            "tracking_url": f"/api/v1/cycle/status/{run_id}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start direct job: {str(e)}")

@router.post("/batch")
async def run_batch_jobs(request: BatchJobRequest, background_tasks: BackgroundTasks):
    """Run multiple jobs as a batch at the same site with real-time tracking"""
    try:
        state = get_state()
        
        # Generate unique order numbers for each job and run ID
        order_numbers = []
        jobs = []
        
        for i, job_req in enumerate(request.jobs):
            order_no = generate_order_number("B") + f"{i+1:02d}"  # B for Batch with sequence
            order_numbers.append(order_no)
            job = EngraveJob(order_no, job_req.laserText, request.site)
            jobs.append(job)
        
        run_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(jobs)}jobs"
        
        # Start background task for real-time tracking
        background_tasks.add_task(
            run_composer_job_background, 
            state, 
            jobs, 
            request.site, 
            run_id, 
            "batch", 
            "batch"
        )
        
        return {
            "success": True,
            "message": f"Batch of {len(request.jobs)} jobs started successfully",
            "runId": run_id,
            "orderNumbers": order_numbers,
            "site": request.site,
            "jobCount": len(request.jobs),
            "tracking_url": f"/api/v1/cycle/status/{run_id}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start batch jobs: {str(e)}")

@router.post("/scenario1")
async def run_scenario1():
    """Alias for scenario 1 - Multiple jobs at same site → one billed round-trip"""
    try:
        state = get_state()
        from app.core.orchestrator import run_scenario_1
        
        result = run_scenario_1(state.orchestrator)
        
        # Add source metadata
        result["source"] = "scenario"
        result["mode"] = "batch"
        result["scenario"] = 1
        result["description"] = "Batch Processing - Multiple jobs at same site"
        
        # Update cumulative billing for scenario jobs
        engraver_billing = state.engraver["usageBilling"]
        agv_billing = state.agv["usageBilling"]
        state.update_cumulative_billing(
            "scenario", 
            engraver_billing, 
            agv_billing, 
            result["jobsProcessed"]
        )
        
        return {
            "success": True,
            "message": "Scenario 1 (Batch Processing) completed successfully",
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute scenario 1: {str(e)}")

@router.post("/scenario2") 
async def run_scenario2():
    """Alias for scenario 2 - Jobs at two different sites → two billed round-trips"""
    try:
        state = get_state()
        from app.core.orchestrator import run_scenario_2
        
        results = run_scenario_2(state.orchestrator)
        
        # Add source metadata to each result
        for i, result in enumerate(results):
            result["source"] = "scenario"
            result["mode"] = "individual"
            result["scenario"] = 2
            result["description"] = f"Individual Processing - Site {i+1}"
        
        # Update cumulative billing for scenario jobs (sum both cycles)
        total_jobs_processed = []
        for result in results:
            total_jobs_processed.extend(result["jobsProcessed"])
        
        engraver_billing = state.engraver["usageBilling"]
        agv_billing = state.agv["usageBilling"]
        state.update_cumulative_billing(
            "scenario", 
            engraver_billing, 
            agv_billing, 
            total_jobs_processed
        )
            
        return {
            "success": True,
            "message": "Scenario 2 (Individual Processing) completed successfully", 
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute scenario 2: {str(e)}")

@router.get("/validate-order/{order_no}")
async def validate_order_number(order_no: str):
    """Validate order number format"""
    import re
    pattern = r"^[A-Z]-\d{4}$"
    is_valid = bool(re.match(pattern, order_no))
    
    return {
        "orderNo": order_no,
        "valid": is_valid,
        "format": "X-NNNN (e.g., E-1001)",
        "message": "Valid order number" if is_valid else "Invalid format. Use X-NNNN (e.g., E-1001)"
    }