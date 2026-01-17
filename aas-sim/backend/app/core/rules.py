"""Core business rules and constants for AAS simulation"""
import os
import yaml

def load_config():
    """Load configuration from yaml file"""
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config.yaml")
    try:
        with open(config_path, "r") as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading config.yaml: {e}. Using defaults.")
        return {
            "currency": "EUR",
            "engraver": {
                "emissionFactor_g_per_kWh": 360.0,
                "costPerEnergyUnit_EUR_per_kWh": 0.40,
                "baseIdle_kWh": 0.02,
                "k_laser_kWh_per_sec_at_power1": 0.002,
                "default_powerPreset": "Standard",
                "seconds_per_letter": 0.5
            },
            "agv": {
                "costPerMeter_EUR": 0.02,
                "speed_m_per_s": 0.5
            },
            "progress_step": 5,
            "poll_interval_s": 0.05,
            "coords": {
                "HOME": (0.0, 0.0),
                "ENGRAVER_DOCK": (5.0, 0.0),
                "JOB_POS1": (12.0, 8.0),
                "JOB_POS2": (15.0, -6.0),
            }
        }

_loaded_config = load_config()

# Default configuration
DEFAULT_CONFIG = {k: v for k, v in _loaded_config.items() if k != "coords"}

# Default coordinates
# Convert lists to tuples for coords
DEFAULT_COORDS = {k: tuple(v) for k, v in _loaded_config.get("coords", {}).items()}

# Validation constants
VALID_OPERATION_MODES = ["Idle", "Running", "Error"]
VALID_ORDER_TYPES = ["LaserEngraving", "Transport"]
VALID_ORDER_STATES = ["Created", "InProcess", "Done", "Error"]
VALID_BILLING_STATUSES = ["Open", "Billed", "Waived"]

# Scenario definitions
SCENARIO_1_JOBS = [
    {"orderNo": "E-1001", "laserText": "HELLO", "site": "JOB_POS1"},
    {"orderNo": "E-1002", "laserText": "WORLD", "site": "JOB_POS1"},
    {"orderNo": "E-1003", "laserText": "TEST", "site": "JOB_POS1"}
]

SCENARIO_2_JOBS = [
    {"orderNo": "E-2001", "laserText": "SMART", "site": "JOB_POS1"},
    {"orderNo": "E-2002", "laserText": "FACTORY", "site": "JOB_POS2"}
]