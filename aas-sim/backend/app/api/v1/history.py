"""History and export API endpoints"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.core.state import get_state
from datetime import datetime
from typing import Optional
import json
import io
import csv

router = APIRouter()

@router.get("")
async def get_history(limit: Optional[int] = 50):
    """GET run history with pagination"""
    state = get_state()
    
    history_dict = state.get_run_history()
    history_list = list(history_dict.values())
    
    # Sort by start time, most recent first
    history_list.sort(key=lambda x: x.get("startedAt", ""), reverse=True)
    
    if limit:
        history_list = history_list[:limit]
    
    return {
        "history": history_list,
        "total": len(history_dict),
        "showing": len(history_list)
    }

@router.get("/{run_id}")
async def get_run_details(run_id: str):
    """GET specific run details"""
    state = get_state()
    
    run_data = state.get_run_history(run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    
    return run_data

@router.get("/export/json")
async def export_history_json(limit: Optional[int] = None):
    """Export run history as JSON"""
    state = get_state()
    
    history_dict = state.get_run_history()
    history_list = list(history_dict.values())
    history_list.sort(key=lambda x: x.get("startedAt", ""), reverse=True)
    
    if limit:
        history_list = history_list[:limit]
    
    export_data = {
        "exportTime": datetime.now().isoformat(),
        "totalRuns": len(history_dict),
        "exportedRuns": len(history_list),
        "history": history_list
    }
    
    json_str = json.dumps(export_data, indent=2)
    
    return StreamingResponse(
        io.StringIO(json_str),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=aas_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"}
    )

@router.get("/export/csv")
async def export_history_csv(limit: Optional[int] = None):
    """Export run history as CSV"""
    state = get_state()
    
    history_dict = state.get_run_history()
    history_list = list(history_dict.values())
    history_list.sort(key=lambda x: x.get("startedAt", ""), reverse=True)
    
    if limit:
        history_list = history_list[:limit]
    
    # Create CSV content
    output = io.StringIO()
    fieldnames = [
        'runId', 'site', 'startedAt', 'endedAt', 'status', 
        'jobsProcessed', 'agvBilledMeters', 'agvCostEUR', 
        'engraverEnergyKWh', 'engraverCO2g', 'engraverCostEUR', 
        'combinedCostEUR', 'error'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for run in history_list:
        row = {
            'runId': run.get('runId', ''),
            'site': run.get('site', ''),
            'startedAt': run.get('startedAt', ''),
            'endedAt': run.get('endedAt', ''),
            'status': run.get('status', ''),
            'jobsProcessed': '|'.join(run.get('jobsProcessed', [])),
            'error': run.get('error', '')
        }
        
        # Add cycle summary data if available
        summary = run.get('cycleSummary')
        if summary:
            row.update({
                'agvBilledMeters': summary.get('agvBilledMeters', 0),
                'agvCostEUR': summary.get('agvCostEUR', 0),
                'engraverEnergyKWh': summary.get('engraverEnergyKWh', 0),
                'engraverCO2g': summary.get('engraverCO2g', 0),
                'engraverCostEUR': summary.get('engraverCostEUR', 0),
                'combinedCostEUR': summary.get('combinedCostEUR', 0),
            })
        
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aas_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.delete("")
async def clear_history():
    """DELETE clear all run history"""
    state = get_state()
    
    history_dict = state.get_run_history()
    cleared_count = len(history_dict)
    
    # Clear history
    with state._lock:
        state.run_history.clear()
    
    return {
        "message": f"History cleared, {cleared_count} runs removed",
        "totalRuns": 0
    }

@router.get("/summary/stats")
async def get_history_stats():
    """GET summary statistics from history"""
    state = get_state()
    
    history_dict = state.get_run_history()
    history_list = list(history_dict.values())
    
    if not history_list:
        return {
            "totalRuns": 0,
            "completedRuns": 0,
            "errorRuns": 0,
            "totalJobs": 0,
            "totalEnergyKWh": 0,
            "totalCO2g": 0,
            "totalCostEUR": 0,
            "avgCostPerRun": 0
        }
    
    completed_runs = [r for r in history_list if r.get('status') == 'completed']
    error_runs = [r for r in history_list if r.get('status') == 'error']
    
    total_jobs = sum(len(r.get('jobsProcessed', [])) for r in completed_runs)
    total_energy = sum(r.get('cycleSummary', {}).get('engraverEnergyKWh', 0) for r in completed_runs)
    total_co2 = sum(r.get('cycleSummary', {}).get('engraverCO2g', 0) for r in completed_runs)
    total_cost = sum(r.get('cycleSummary', {}).get('combinedCostEUR', 0) for r in completed_runs)
    
    return {
        "totalRuns": len(history_list),
        "completedRuns": len(completed_runs),
        "errorRuns": len(error_runs),
        "totalJobs": total_jobs,
        "totalEnergyKWh": round(total_energy, 6),
        "totalCO2g": round(total_co2, 6),
        "totalCostEUR": round(total_cost, 6),
        "avgCostPerRun": round(total_cost / len(completed_runs), 6) if completed_runs else 0
    }