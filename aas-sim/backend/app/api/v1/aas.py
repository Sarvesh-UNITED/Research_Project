"""AAS API endpoints for device data access"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.core.state import get_state

router = APIRouter()

@router.get("/{device}/operational/status")
async def get_operational_status(device: str):
    """GET operational status for a device"""
    state = get_state()
    device_data = state.get_device(device)
    if not device_data:
        raise HTTPException(status_code=404, detail=f"Device '{device}' not found")
    
    return device_data["operationalData"]["status"]

@router.get("/{device}/operational/order")
async def get_operational_order(device: str):
    """GET operational order for a device"""
    state = get_state()
    device_data = state.get_device(device)
    if not device_data:
        raise HTTPException(status_code=404, detail=f"Device '{device}' not found")
    
    return device_data["operationalData"]["order"]

@router.get("/{device}/operational/pose")
async def get_operational_pose(device: str):
    """GET operational pose for a device"""
    state = get_state()
    device_data = state.get_device(device)
    if not device_data:
        raise HTTPException(status_code=404, detail=f"Device '{device}' not found")
    
    return device_data["operationalData"]["pose"]

@router.get("/{device}/billing")
async def get_billing_data(device: str):
    """GET billing data for a device"""
    state = get_state()
    device_data = state.get_device(device)
    if not device_data:
        raise HTTPException(status_code=404, detail=f"Device '{device}' not found")
    
    return device_data["usageBilling"]

@router.get("/combined-billing")
async def get_combined_billing():
    """GET combined billing data - prioritizes user jobs over scenarios"""
    state = get_state()
    
    engraver = state.get_device("engraver")
    agv = state.get_device("agv")
    
    if not engraver or not agv:
        raise HTTPException(status_code=500, detail="Device data not available")
    
    # Get cumulative billing data
    cumulative = state.get_cumulative_billing()
    user_billing = cumulative["user_jobs"]
    scenario_billing = cumulative["scenario_jobs"]
    
    # Use user billing if there are user jobs, otherwise use scenario billing
    if user_billing["jobs_processed"]:
        # Show user job billing
        return {
            "engraver": {
                "orderRef": f"USER-JOBS ({len(user_billing['jobs_processed'])} jobs)",
                "energy_kWh": round(user_billing["engraver_energy_kWh"], 6),
                "co2_g": round(user_billing["engraver_co2_g"], 6),
                "cost_eur": round(user_billing["engraver_cost_eur"], 6),
            },
            "agv": {
                "distance_m": round(user_billing["agv_distance_m"], 6),
                "cost_eur": round(user_billing["agv_cost_eur"], 6),
                "orderRef": f"USER-JOBS ({len(user_billing['jobs_processed'])} jobs)",
            },
            "combined_cost_eur": round(user_billing["total_cost_eur"], 6),
            "currency": "EUR",
            "billing_source": "user_jobs",
            "jobs_processed": user_billing["jobs_processed"],
            "last_updated": user_billing["last_updated"]
        }
    elif scenario_billing["jobs_processed"]:
        # Show scenario billing
        return {
            "engraver": {
                "orderRef": f"SCENARIO-JOBS ({len(scenario_billing['jobs_processed'])} jobs)",
                "energy_kWh": round(scenario_billing["engraver_energy_kWh"], 6),
                "co2_g": round(scenario_billing["engraver_co2_g"], 6),
                "cost_eur": round(scenario_billing["engraver_cost_eur"], 6),
            },
            "agv": {
                "distance_m": round(scenario_billing["agv_distance_m"], 6),
                "cost_eur": round(scenario_billing["agv_cost_eur"], 6),
                "orderRef": f"SCENARIO-JOBS ({len(scenario_billing['jobs_processed'])} jobs)",
            },
            "combined_cost_eur": round(scenario_billing["total_cost_eur"], 6),
            "currency": "EUR",
            "billing_source": "scenario_jobs", 
            "jobs_processed": scenario_billing["jobs_processed"],
            "last_updated": scenario_billing["last_updated"]
        }
    else:
        # Fallback to current cycle data if no cumulative data
        engraver_cost = engraver["usageBilling"]["usageCost"]
        agv_cost = agv["usageBilling"]["usageCost"]
        
        return {
            "engraver": {
                "orderRef": engraver["usageBilling"]["orderRef"],
                "energy_kWh": engraver["usageBilling"]["energyConsumed"],
                "co2_g": engraver["usageBilling"]["carbonEmissions"],
                "cost_eur": engraver_cost,
            },
            "agv": {
                "distance_m": agv["usageBilling"]["distanceTraveled"],
                "cost_eur": agv_cost,
                "orderRef": agv["usageBilling"]["orderRef"],
            },
            "combined_cost_eur": round(engraver_cost + agv_cost, 6),
            "currency": "EUR",
            "billing_source": "current_cycle",
            "jobs_processed": [],
            "last_updated": None
        }

@router.get("/individual-jobs")
async def get_individual_jobs(source: Optional[str] = None):
    """GET individual job details for billing breakdown"""
    state = get_state()
    
    individual_jobs = state.get_individual_jobs(source)
    
    # Calculate totals
    total_energy = sum(job.get("energy_kWh", 0) for job in individual_jobs)
    total_co2 = sum(job.get("co2_g", 0) for job in individual_jobs)
    total_engraver_cost = sum(job.get("cost_eur", 0) for job in individual_jobs)
    total_agv_distance = sum(job.get("agv_distance_share", 0) for job in individual_jobs)
    total_agv_cost = sum(job.get("agv_cost_share", 0) for job in individual_jobs)
    
    return {
        "jobs": individual_jobs,
        "summary": {
            "total_jobs": len(individual_jobs),
            "total_letters": sum(job.get("letters", 0) for job in individual_jobs),
            "total_energy_kWh": round(total_energy, 6),
            "total_co2_g": round(total_co2, 6),
            "total_engraver_cost_eur": round(total_engraver_cost, 6),
            "total_agv_distance_m": round(total_agv_distance, 6),
            "total_agv_cost_eur": round(total_agv_cost, 6),
            "grand_total_eur": round(total_engraver_cost + total_agv_cost, 6)
        },
        "last_updated": individual_jobs[-1]["timestamp"] if individual_jobs else None
    }

@router.post("/reset-user-billing") 
async def reset_user_billing():
    """Reset cumulative user job billing"""
    state = get_state()
    state.reset_user_billing()
    
    return {
        "success": True,
        "message": "User job billing reset successfully"
    }

@router.get("/devices")
async def get_all_devices():
    """GET all device data"""
    state = get_state()
    
    return {
        "engraver": state.get_device("engraver"),
        "agv": state.get_device("agv")
    }