"""Configuration management API endpoints"""
from fastapi import APIRouter
from app.core.state import get_state
from app.models import ConfigUpdateRequest
from app.core.rules import DEFAULT_CONFIG, DEFAULT_COORDS

router = APIRouter()

@router.get("")
async def get_config():
    """GET current configuration"""
    state = get_state()
    return {
        "config": state.config,
        "coords": state.coords
    }

@router.patch("")
async def update_config(request: ConfigUpdateRequest):
    """PATCH update configuration"""
    state = get_state()
    
    # Build updates dict from request
    updates = {}
    if request.currency is not None:
        updates["currency"] = request.currency
    if request.engraver is not None:
        updates["engraver"] = request.engraver.dict(exclude_unset=True)
    if request.agv is not None:
        updates["agv"] = request.agv.dict(exclude_unset=True)
    if request.progress_step is not None:
        updates["progress_step"] = request.progress_step
    if request.poll_interval_s is not None:
        updates["poll_interval_s"] = request.poll_interval_s
    
    updated_config = state.update_config(updates)
    
    return {
        "message": "Configuration updated successfully",
        "config": updated_config,
        "coords": state.coords
    }

@router.get("/coords")
async def get_coordinates():
    """GET coordinate system"""
    state = get_state()
    return state.coords

@router.patch("/coords")
async def update_coordinates(coords: dict):
    """PATCH update coordinate system"""
    state = get_state()
    
    updated_coords = state.update_coords(coords)
    
    return {
        "message": "Coordinates updated successfully",
        "coords": updated_coords
    }

@router.post("/reset")
async def reset_config():
    """POST reset configuration to defaults"""
    state = get_state()
    
    # Reset to defaults
    state.update_config(DEFAULT_CONFIG)
    state.update_coords(DEFAULT_COORDS)
    
    return {
        "message": "Configuration reset to defaults",
        "config": state.config,
        "coords": state.coords
    }

@router.get("/defaults")
async def get_defaults():
    """GET default configuration values"""
    return {
        "config": DEFAULT_CONFIG,
        "coords": DEFAULT_COORDS
    }