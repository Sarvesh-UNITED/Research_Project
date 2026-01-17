"""Queue management API endpoints"""
from fastapi import APIRouter, HTTPException
from app.core.state import get_state
from app.core.orchestrator import EngraveJob
from app.models import EnqueueJobRequest

router = APIRouter()

@router.post("/enqueue")
async def enqueue_job(request: EnqueueJobRequest):
    """POST enqueue a new job"""
    state = get_state()
    
    # Validate site exists in coordinates
    if request.site not in state.coords:
        raise HTTPException(status_code=400, detail=f"Invalid site '{request.site}'. Available sites: {list(state.coords.keys())}")
    
    job = EngraveJob(
        orderNo=request.orderNo,
        laserText=request.laserText,
        site=request.site
    )
    
    state.orchestrator.enqueue_job(job)
    
    return {
        "message": "Job enqueued successfully",
        "orderNo": request.orderNo,
        "site": request.site,
        "queueLength": len(state.orchestrator.queue)
    }

@router.get("")
async def get_queue():
    """GET current queue status"""
    state = get_state()
    
    queue_jobs = state.orchestrator.get_queue_jobs()
    
    return {
        "queue": queue_jobs,
        "length": len(queue_jobs)
    }

@router.delete("/{order_no}")
async def remove_job_from_queue(order_no: str):
    """DELETE remove a job from queue"""
    state = get_state()
    
    removed = state.orchestrator.remove_job(order_no)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Job '{order_no}' not found in queue")
    
    return {
        "message": f"Job {order_no} removed from queue",
        "queueLength": len(state.orchestrator.queue)
    }

@router.delete("")
async def clear_queue():
    """DELETE clear entire queue"""
    state = get_state()
    
    cleared_count = state.orchestrator.clear_queue()
    
    return {
        "message": f"Queue cleared, {cleared_count} jobs removed",
        "queueLength": 0
    }