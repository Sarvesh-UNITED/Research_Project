"""FastAPI main application"""
import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import aas, queue, cycle, config, history, sse
from app.api import composer
from app.core.logging import setup_logging, get_logger

# Load environment variables
load_dotenv()

# Setup logging
setup_logging(os.getenv("LOG_LEVEL", "INFO"))
logger = get_logger("main")

app = FastAPI(
    title="AAS Simulation API",
    description="Asset Administration Shell simulation for Smart Factory usage-based billing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

# CORS middleware for frontend
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(aas.router, prefix="/api/v1/aas", tags=["AAS"])
app.include_router(queue.router, prefix="/api/v1/queue", tags=["Queue"])
app.include_router(cycle.router, prefix="/api/v1/cycle", tags=["Cycle"])
app.include_router(config.router, prefix="/api/v1/config", tags=["Configuration"])
app.include_router(history.router, prefix="/api/v1/history", tags=["History"])
app.include_router(sse.router, prefix="/api/v1", tags=["Events"])
app.include_router(composer.router, prefix="/api/v1", tags=["Composer"])

@app.get("/")
async def root():
    """Root endpoint"""
    logger.info("Root endpoint accessed")
    return {
        "message": "AAS Simulation API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "devices": "/api/v1/aas/devices",
            "queue": "/api/v1/queue",
            "run_cycle": "/api/v1/cycle/run",
            "configuration": "/api/v1/config",
            "history": "/api/v1/history",
            "events_sse": "/api/v1/events"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from app.core.state import get_state
    
    state = get_state()
    
    return {
        "status": "healthy",
        "timestamp": "2025-01-21T10:00:00Z",
        "devices": {
            "engraver": state.engraver["operationalData"]["status"]["operationMode"],
            "agv": state.agv["operationalData"]["status"]["operationMode"]
        },
        "queue_length": len(state.orchestrator.queue)
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)