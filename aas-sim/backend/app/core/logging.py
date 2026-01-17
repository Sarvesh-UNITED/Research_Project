import logging
import sys
from typing import Any, Dict

# Configure logging format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

def setup_logging(log_level: str = "INFO") -> None:
    """Setup global logging configuration"""
    
    # Create logger
    logger = logging.getLogger("aas_sim")
    logger.setLevel(log_level)
    
    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    logger.addHandler(handler)
    
    # Set third-party loggers to warning to reduce noise
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the application prefix"""
    return logging.getLogger(f"aas_sim.{name}")
