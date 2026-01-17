import json
import os
import threading
from typing import Dict, Any

DB_FILE = "simulation_state.json"
_db_lock = threading.Lock()

def load_db() -> Dict[str, Any]:
    """Load state from JSON file"""
    with _db_lock:
        if not os.path.exists(DB_FILE):
            return {}
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading DB: {e}")
            return {}

def save_db(data: Dict[str, Any]):
    """Save state to JSON file"""
    with _db_lock:
        try:
            # Write to temp file then rename for atomic write
            temp_file = f"{DB_FILE}.tmp"
            with open(temp_file, "w") as f:
                json.dump(data, f, indent=2)
            os.replace(temp_file, DB_FILE)
        except Exception as e:
            print(f"Error saving DB: {e}")
