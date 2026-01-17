"""In-memory state management for AAS simulation with JSON persistence"""
import threading
import copy
from datetime import datetime, timezone
from collections import deque
from typing import Dict, List, Optional, Any
from app.core.rules import DEFAULT_CONFIG, DEFAULT_COORDS
from app.core.orchestrator import Orchestrator
from app.core.database import load_db, save_db

def now_iso() -> str:
    """Get current ISO8601 timestamp"""
    return datetime.now(timezone.utc).isoformat()

def make_engraver(device_id: str = "engraver-001") -> Dict[str, Any]:
    """Create initial engraver device state"""
    return {
        "deviceId": device_id,
        "deviceType": "Engraver",
        "operationalData": {
            "status": {
                "productionProgress": 0,
                "operationMode": "Idle",
                "heartbeatCounter": 0,
                "heartbeatTimestamp": now_iso()
            },
            "order": {
                "orderNo": "",
                "orderType": "LaserEngraving",
                "laserText": None,
                "transportRequired": False,
                "orderState": "Created",
                "lastChangeAt": now_iso()
            },
            "pose": {"posX": 0.0, "posY": 0.0, "orientation": 0.0}
        },
        "usageBilling": {
            "currency": "EUR",
            "billingStatus": "Open",
            "orderRef": None,
            "lastBilledAt": None,
            "lastUpdated": now_iso(),
            "energyConsumed": 0.0,
            "emissionFactor": DEFAULT_CONFIG["engraver"]["emissionFactor_g_per_kWh"],
            "carbonEmissions": 0.0,
            "costPerEnergyUnit": DEFAULT_CONFIG["engraver"]["costPerEnergyUnit_EUR_per_kWh"],
            "usageCost": 0.0
        }
    }

def make_agv(device_id: str = "agv-001") -> Dict[str, Any]:
    """Create initial AGV device state"""
    return {
        "deviceId": device_id,
        "deviceType": "AGV",
        "operationalData": {
            "status": {
                "productionProgress": 0,
                "operationMode": "Idle",
                "heartbeatCounter": 0,
                "heartbeatTimestamp": now_iso()
            },
            "order": {
                "orderNo": "",
                "orderType": "Transport",
                "laserText": None,
                "transportRequired": True,
                "orderState": "Created",
                "lastChangeAt": now_iso()
            },
            "pose": {"posX": 0.0, "posY": 0.0, "orientation": 0.0}
        },
        "usageBilling": {
            "currency": "EUR",
            "billingStatus": "Open",
            "orderRef": None,
            "lastBilledAt": None,
            "lastUpdated": now_iso(),
            "distanceTraveled": 0.0,
            "costPerMeter": DEFAULT_CONFIG["agv"]["costPerMeter_EUR"],
            "usageCost": 0.0
        }
    }

class SimulationState:
    """Thread-safe singleton state for the simulation with JSON Persistence"""
    
    def __init__(self):
        self._lock = threading.Lock()
        self.init_from_db()
    
    def init_from_db(self):
        """Initialize state from database or defaults"""
        with self._lock:
            self.config = copy.deepcopy(DEFAULT_CONFIG)
            self.coords = copy.deepcopy(DEFAULT_COORDS)
            self._cycle_lock = threading.Lock()
            
            db_data = load_db()
            
            # Load Devices
            devices = db_data.get("devices", {})
            self.engraver = devices.get("engraver", make_engraver())
            self.agv = devices.get("agv", make_agv())
            
            # Load Billing
            billing = db_data.get("billing", {})
            current_time = now_iso()
            
            default_billing = {
                "engraver_energy_kWh": 0.0, "engraver_co2_g": 0.0, "engraver_cost_eur": 0.0,
                "agv_distance_m": 0.0, "agv_cost_eur": 0.0, "total_cost_eur": 0.0,
                "jobs_processed": [], "last_updated": current_time
            }
            
            self.cumulative_billing = {
                "user_jobs": billing.get("user_jobs", copy.deepcopy(default_billing)),
                "scenario_jobs": billing.get("scenario_jobs", copy.deepcopy(default_billing))
            }
            
            # Load Jobs
            self.individual_jobs = db_data.get("jobs", [])
            
            # Load History
            self.run_history = db_data.get("history", {})
            
            # Initialize Orchestrator
            self.orchestrator = Orchestrator(self.engraver, self.agv, self.config, self.coords)
            
            # Save initial state if DB was empty
            if not db_data:
                self._persist()

    def _persist(self):
        """Save current state to JSON"""
        data = {
            "devices": {
                "engraver": self.engraver,
                "agv": self.agv
            },
            "billing": self.cumulative_billing,
            "jobs": self.individual_jobs,
            "history": self.run_history
        }
        save_db(data)

    def reset_to_defaults(self):
        """Reset all state to defaults"""
        with self._lock:
            self.config = copy.deepcopy(DEFAULT_CONFIG)
            self.coords = copy.deepcopy(DEFAULT_COORDS)
            self.engraver = make_engraver()
            self.agv = make_agv()
            self.run_history = {}
            self.orchestrator = Orchestrator(self.engraver, self.agv, self.config, self.coords)
            self._cycle_lock = threading.Lock()
            
            current_time = now_iso()
            self.cumulative_billing = {
                "user_jobs": {
                    "engraver_energy_kWh": 0.0, "engraver_co2_g": 0.0, "engraver_cost_eur": 0.0,
                    "agv_distance_m": 0.0, "agv_cost_eur": 0.0, "total_cost_eur": 0.0,
                    "jobs_processed": [], "last_updated": current_time
                },
                "scenario_jobs": {
                    "engraver_energy_kWh": 0.0, "engraver_co2_g": 0.0, "engraver_cost_eur": 0.0,
                    "agv_distance_m": 0.0, "agv_cost_eur": 0.0, "total_cost_eur": 0.0,
                    "jobs_processed": [], "last_updated": current_time
                }
            }
            self.individual_jobs = []
            
            self._persist()
    
    def get_device(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Get device by ID"""
        with self._lock:
            if device_id == self.engraver["deviceId"] or device_id == "engraver":
                return copy.deepcopy(self.engraver)
            elif device_id == self.agv["deviceId"] or device_id == "agv":
                return copy.deepcopy(self.agv)
            return None
    
    def update_config(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update configuration"""
        with self._lock:
            if "currency" in updates and updates["currency"]:
                self.config["currency"] = updates["currency"]
            
            if "engraver" in updates and updates["engraver"]:
                for key, value in updates["engraver"].items():
                    if value is not None and key in self.config["engraver"]:
                        self.config["engraver"][key] = value
            
            if "agv" in updates and updates["agv"]:
                for key, value in updates["agv"].items():
                    if value is not None and key in self.config["agv"]:
                        self.config["agv"][key] = value
            
            if "progress_step" in updates and updates["progress_step"] is not None:
                self.config["progress_step"] = updates["progress_step"]
            
            if "poll_interval_s" in updates and updates["poll_interval_s"] is not None:
                self.config["poll_interval_s"] = updates["poll_interval_s"]
            
            # Update device billing rates
            self.engraver["usageBilling"]["emissionFactor"] = self.config["engraver"]["emissionFactor_g_per_kWh"]
            self.engraver["usageBilling"]["costPerEnergyUnit"] = self.config["engraver"]["costPerEnergyUnit_EUR_per_kWh"]
            self.agv["usageBilling"]["costPerMeter"] = self.config["agv"]["costPerMeter_EUR"]
            
            self._persist()
            return copy.deepcopy(self.config)
    
    def update_coords(self, coords_updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update coordinate system"""
        with self._lock:
            for key, value in coords_updates.items():
                if isinstance(value, (list, tuple)) and len(value) == 2:
                    self.coords[key] = tuple(value)
            return copy.deepcopy(self.coords)
    
    def add_run_history(self, run_data: Dict[str, Any]) -> None:
        """Add run to history"""
        with self._lock:
            self.run_history[run_data["runId"]] = copy.deepcopy(run_data)
            self._persist()
    
    def update_run_history(self, run_id: str, run_data: Dict[str, Any]) -> None:
        """Update existing run in history"""
        with self._lock:
            if run_id in self.run_history:
                self.run_history[run_id].update(run_data)
                self._persist()
    
    def get_run_history(self, run_id: Optional[str] = None) -> Any:
        """Get run history"""
        with self._lock:
            if run_id:
                return copy.deepcopy(self.run_history.get(run_id))
            return copy.deepcopy(self.run_history)
    
    def get_cycle_lock(self):
        """Get lock for cycle operations"""
        return self._cycle_lock
    
    def update_cumulative_billing(self, job_source: str, engraver_data: Dict[str, Any], agv_data: Dict[str, Any], jobs_processed: List[str]) -> None:
        """Update cumulative billing"""
        with self._lock:
            billing_type = "user_jobs" if job_source in ["direct", "batch"] else "scenario_jobs"
            billing = self.cumulative_billing[billing_type]
            
            billing["engraver_energy_kWh"] += engraver_data.get("energyConsumed", 0.0)
            billing["engraver_co2_g"] += engraver_data.get("carbonEmissions", 0.0)
            billing["engraver_cost_eur"] += engraver_data.get("usageCost", 0.0)
            billing["agv_distance_m"] += agv_data.get("distanceTraveled", 0.0)
            billing["agv_cost_eur"] += agv_data.get("usageCost", 0.0)
            billing["total_cost_eur"] = billing["engraver_cost_eur"] + billing["agv_cost_eur"]
            billing["jobs_processed"].extend(jobs_processed)
            billing["last_updated"] = now_iso()
            
            self._persist()
    
    def get_cumulative_billing(self) -> Dict[str, Any]:
        """Get cumulative billing data"""
        with self._lock:
            return copy.deepcopy(self.cumulative_billing)
    
    def reset_user_billing(self) -> None:
        """Reset only user job billing"""
        with self._lock:
            self.cumulative_billing["user_jobs"] = {
                "engraver_energy_kWh": 0.0,
                "engraver_co2_g": 0.0,
                "engraver_cost_eur": 0.0,
                "agv_distance_m": 0.0,
                "agv_cost_eur": 0.0,
                "total_cost_eur": 0.0,
                "jobs_processed": [],
                "last_updated": now_iso()
            }
            self.cumulative_billing["scenario_jobs"] = {
                "engraver_energy_kWh": 0.0,
                "engraver_co2_g": 0.0,
                "engraver_cost_eur": 0.0,
                "agv_distance_m": 0.0,
                "agv_cost_eur": 0.0,
                "total_cost_eur": 0.0,
                "jobs_processed": [],
                "last_updated": now_iso()
            }
            
            # Clear ALL individual jobs
            self.individual_jobs = []
            
            # Reset device billing state
            self.engraver["usageBilling"]["energyConsumed"] = 0.0
            self.engraver["usageBilling"]["carbonEmissions"] = 0.0
            self.engraver["usageBilling"]["usageCost"] = 0.0
            self.engraver["usageBilling"]["distanceTraveled"] = 0.0 # Not used but for consistency
            
            self.agv["usageBilling"]["distanceTraveled"] = 0.0
            self.agv["usageBilling"]["usageCost"] = 0.0
            
            self._persist()
    
    def add_individual_job(self, job_details: Dict[str, Any]) -> None:
        """Add individual job details"""
        with self._lock:
            self.individual_jobs.append({
                **job_details,
                "timestamp": now_iso()
            })
            self._persist()
    
    def get_individual_jobs(self, job_source: str = None) -> List[Dict[str, Any]]:
        """Get individual job details"""
        with self._lock:
            if job_source:
                return copy.deepcopy([job for job in self.individual_jobs if job.get("source") == job_source])
            return copy.deepcopy(self.individual_jobs)
    
    def clear_individual_jobs(self) -> None:
        """Clear all individual job details"""
        with self._lock:
            self.individual_jobs.clear()
            self._persist()
    
    # Helper for testing to force save
    def _save_device(self, device_data: Dict[str, Any]):
        """Helper to save device (updates in-memory ref is already done by caller usually, but we ensure persist)"""
        # In this JSON implementation, we just persist everything
        self._persist()

# Global singleton instance
_state_instance: Optional[SimulationState] = None
_state_lock = threading.Lock()

def get_state() -> SimulationState:
    """Get the global simulation state instance"""
    global _state_instance
    if _state_instance is None:
        with _state_lock:
            if _state_instance is None:
                _state_instance = SimulationState()
    return _state_instance

def reset_state():
    """Reset the global state (for testing)"""
    global _state_instance
    with _state_lock:
        if _state_instance is not None:
            _state_instance.reset_to_defaults()