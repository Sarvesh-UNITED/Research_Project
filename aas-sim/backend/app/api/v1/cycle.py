"""Cycle execution API endpoints"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from app.core.state import get_state
from app.core.orchestrator import run_cycle_for_site, run_scenario_1, run_scenario_2
from app.models import CycleSummaryResponse
from datetime import datetime
import threading
from typing import Optional

router = APIRouter()

def run_cycle_background(state, site: str, max_jobs: Optional[int], run_id: str):
    """Run cycle in background thread"""
    try:
        # Add run to history
        run_entry = {
            "runId": run_id,
            "site": site,
            "startedAt": datetime.now().isoformat(),
            "endedAt": None,
            "status": "running",
            "jobsProcessed": [],
            "cycleSummary": None,
            "configSnapshot": state.config.copy(),
            "error": None
        }
        state.add_run_history(run_entry)
        
        # Acquire cycle lock to prevent concurrent cycles
        with state.get_cycle_lock():
            # Run the actual cycle
            summary = run_cycle_for_site(state.orchestrator, site, max_jobs)
            
            if "error" in summary:
                # No jobs found
                run_entry.update({
                    "status": "no_jobs",
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
        
        state.update_run_history(run_id, run_entry)
        
    except Exception as e:
        run_entry.update({
            "status": "error",
            "endedAt": datetime.now().isoformat(),
            "error": str(e)
        })
        state.update_run_history(run_id, run_entry)

@router.post("/run")
async def run_cycle(
    background_tasks: BackgroundTasks,
    site: str = Query(default="JOB_POS1", description="Site to run cycle for"),
    maxJobs: Optional[str] = Query(default="all", description="Maximum jobs to process or 'all'")
):
    """POST run a cycle for a specific site"""
    state = get_state()
    
    # Validate site
    if site not in state.coords:
        raise HTTPException(status_code=400, detail=f"Invalid site '{site}'. Available: {list(state.coords.keys())}")
    
    # Check if there are jobs for the site
    site_jobs = [j for j in state.orchestrator.get_queue_jobs() if j["site"] == site]
    if not site_jobs:
        raise HTTPException(status_code=400, detail=f"No jobs in queue for site {site}")
    
    # Parse maxJobs
    max_jobs_int = None if maxJobs == "all" else int(maxJobs) if maxJobs.isdigit() else None
    
    # Generate run ID
    run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{site}"
    
    # Start background task
    background_tasks.add_task(run_cycle_background, state, site, max_jobs_int, run_id)
    
    return {
        "message": f"Cycle started for site {site}",
        "runId": run_id,
        "site": site,
        "estimatedJobs": min(len(site_jobs), max_jobs_int or len(site_jobs))
    }

@router.get("/status/{run_id}")
async def get_cycle_status(run_id: str):
    """GET status of a specific cycle run"""
    state = get_state()
    
    run_history = state.get_run_history(run_id)
    if not run_history:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    
    return run_history

@router.get("/status")
async def get_current_status():
    """GET current cycle/orchestrator status"""
    state = get_state()
    
    return {
        "engraver_mode": state.engraver["operationalData"]["status"]["operationMode"],
        "agv_mode": state.agv["operationalData"]["status"]["operationMode"],
        "engraver_progress": state.engraver["operationalData"]["status"]["productionProgress"],
        "agv_progress": state.agv["operationalData"]["status"]["productionProgress"],
        "queue_length": len(state.orchestrator.queue),
        "billing_window_active": state.orchestrator.billing_window_active,
        "agv_pose": state.agv["operationalData"]["pose"]
    }

@router.post("/scenario1")
async def run_scenario_1_endpoint(background_tasks: BackgroundTasks):
    """Run Scenario 1: Multiple jobs at same site"""
    state = get_state()
    run_id = f"scenario1_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def scenario1_background():
        try:
            run_entry = {
                "runId": run_id,
                "site": "JOB_POS1",
                "startedAt": datetime.now().isoformat(),
                "endedAt": None,
                "status": "running",
                "jobsProcessed": [],
                "cycleSummary": None,
                "configSnapshot": state.config.copy(),
                "error": None
            }
            state.add_run_history(run_entry)
            
            with state.get_cycle_lock():
                summary = run_scenario_1(state.orchestrator)
                
                run_entry.update({
                    "status": "completed",
                    "endedAt": summary["endedAt"],
                    "jobsProcessed": summary["jobsProcessed"],
                    "cycleSummary": summary
                })
                
                # Extract individual job details for billing page
                if "individualJobs" in summary:
                    for job_detail in summary["individualJobs"]:
                        state.add_individual_job({
                            **job_detail,
                            "source": "scenario",
                            "agv_distance_share": round(summary.get("agvBilledMeters", 0) / len(summary["individualJobs"]) if summary.get("individualJobs") else 0, 6),
                            "agv_cost_share": round(summary.get("agvCostEUR", 0) / len(summary["individualJobs"]) if summary.get("individualJobs") else 0, 6)
                        })
                    
                    # Update cumulative billing for scenario jobs
                    engraver_billing = state.get_device("engraver")["usageBilling"]
                    agv_billing = state.get_device("agv")["usageBilling"]
                    
                    state.update_cumulative_billing(
                        "scenario", 
                        engraver_billing, 
                        agv_billing, 
                        summary["jobsProcessed"]
                    )
            
            state.update_run_history(run_id, run_entry)
            
        except Exception as e:
            run_entry.update({
                "status": "error",
                "endedAt": datetime.now().isoformat(),
                "error": str(e)
            })
            state.update_run_history(run_id, run_entry)
    
    background_tasks.add_task(scenario1_background)
    
    return {
        "message": "Scenario 1 started: Multiple jobs at same site",
        "runId": run_id,
        "expectedJobs": ["E-1001", "E-1002", "E-1003"]
    }

@router.post("/scenario2")
async def run_scenario_2_endpoint(background_tasks: BackgroundTasks):
    """Run Scenario 2: Jobs at two different sites"""
    state = get_state()
    run_id = f"scenario2_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def scenario2_background():
        try:
            run_entry = {
                "runId": run_id,
                "site": "MULTI",
                "startedAt": datetime.now().isoformat(),
                "endedAt": None,
                "status": "running",
                "jobsProcessed": [],
                "cycleSummary": None,
                "configSnapshot": state.config.copy(),
                "error": None
            }
            state.add_run_history(run_entry)
            
            with state.get_cycle_lock():
                summaries = run_scenario_2(state.orchestrator)
                
                # Combine summaries for two cycles
                combined_summary = {
                    "site": "MULTI",
                    "cycles": summaries,
                    "jobsProcessed": [job for summary in summaries for job in summary["jobsProcessed"]],
                    "agvBilledMeters": sum(s["agvBilledMeters"] for s in summaries),
                    "agvCostEUR": sum(s["agvCostEUR"] for s in summaries),
                    "engraverEnergyKWh": sum(s["engraverEnergyKWh"] for s in summaries),
                    "engraverCO2g": sum(s["engraverCO2g"] for s in summaries),
                    "engraverCostEUR": sum(s["engraverCostEUR"] for s in summaries),
                    "combinedCostEUR": sum(s["combinedCostEUR"] for s in summaries),
                    "orderRef": "SCENARIO2",
                    "startedAt": summaries[0]["startedAt"],
                    "endedAt": summaries[-1]["endedAt"]
                }
                
                run_entry.update({
                    "status": "completed",
                    "endedAt": combined_summary["endedAt"],
                    "jobsProcessed": combined_summary["jobsProcessed"],
                    "cycleSummary": combined_summary
                })
                
                # Extract individual job details for billing page from both cycles
                for cycle_summary in summaries:
                    if "individualJobs" in cycle_summary:
                        for job_detail in cycle_summary["individualJobs"]:
                            state.add_individual_job({
                                **job_detail,
                                "source": "scenario",
                                "agv_distance_share": round(cycle_summary.get("agvBilledMeters", 0) / len(cycle_summary["individualJobs"]) if cycle_summary.get("individualJobs") else 0, 6),
                                "agv_cost_share": round(cycle_summary.get("agvCostEUR", 0) / len(cycle_summary["individualJobs"]) if cycle_summary.get("individualJobs") else 0, 6)
                            })
                
                # Update cumulative billing for scenario jobs
                engraver_billing = state.get_device("engraver")["usageBilling"]
                agv_billing = state.get_device("agv")["usageBilling"]
                
                state.update_cumulative_billing(
                    "scenario", 
                    engraver_billing, 
                    agv_billing, 
                    combined_summary["jobsProcessed"]
                )
            
            state.update_run_history(run_id, run_entry)
            
        except Exception as e:
            run_entry.update({
                "status": "error",
                "endedAt": datetime.now().isoformat(),
                "error": str(e)
            })
            state.update_run_history(run_id, run_entry)
    
    background_tasks.add_task(scenario2_background)
    
    return {
        "message": "Scenario 2 started: Jobs at two different sites",
        "runId": run_id,
        "expectedJobs": ["E-2001", "E-2002"],
        "expectedCycles": 2
    }