"""Server-Sent Events for real-time updates"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.core.state import get_state
import json
import asyncio
from datetime import datetime

router = APIRouter()

async def event_generator():
    """Generate Server-Sent Events for real-time updates"""
    while True:
        try:
            state = get_state()
            
            # Create comprehensive event data
            event_data = {
                "timestamp": datetime.now().isoformat(),
                "devices": {
                    "engraver": {
                        "status": state.engraver["operationalData"]["status"],
                        "order": state.engraver["operationalData"]["order"],
                        "pose": state.engraver["operationalData"]["pose"],
                        "billing": state.engraver["usageBilling"]
                    },
                    "agv": {
                        "status": state.agv["operationalData"]["status"], 
                        "order": state.agv["operationalData"]["order"],
                        "pose": state.agv["operationalData"]["pose"],
                        "billing": state.agv["usageBilling"]
                    }
                },
                "queue": {
                    "length": len(state.orchestrator.queue),
                    "jobs": state.orchestrator.get_queue_jobs()[:10]  # First 10 jobs
                },
                "orchestrator": {
                    "billing_window_active": state.orchestrator.billing_window_active
                },
                "combined_billing": {
                    "engraver_cost": state.engraver["usageBilling"]["usageCost"],
                    "agv_cost": state.agv["usageBilling"]["usageCost"],
                    "total_cost": round(
                        state.engraver["usageBilling"]["usageCost"] + 
                        state.agv["usageBilling"]["usageCost"], 6
                    )
                }
            }
            
            yield f"data: {json.dumps(event_data)}\n\n"
            await asyncio.sleep(1)  # Send updates every second
            
        except Exception as e:
            error_data = {
                "timestamp": datetime.now().isoformat(),
                "error": str(e),
                "type": "stream_error"
            }
            yield f"data: {json.dumps(error_data)}\n\n"
            await asyncio.sleep(5)  # Wait longer on error

@router.get("/events")
async def stream_events():
    """GET Server-Sent Events stream for real-time updates"""
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.get("/events/test")
async def test_sse():
    """Test SSE endpoint connectivity"""
    return {
        "message": "SSE endpoint is available",
        "endpoint": "/api/v1/events",
        "timestamp": datetime.now().isoformat()
    }