"""Tests for billing logic and persistence"""
import pytest
import os
import json
from app.core.state import SimulationState, make_engraver, make_agv, reset_state, get_state
from app.core.orchestrator import run_engrave_job

# Mock config for testing
TEST_CONFIG = {
    "currency": "EUR",
    "engraver": {
        "emissionFactor_g_per_kWh": 500.0,
        "costPerEnergyUnit_EUR_per_kWh": 0.50,
        "baseIdle_kWh": 0.1,
        "k_laser_kWh_per_sec_at_power1": 0.01,
        "default_powerPreset": "Standard",
        "seconds_per_letter": 1.0
    },
    "agv": {
        "costPerMeter_EUR": 0.10,
        "speed_m_per_s": 1.0
    },
    "progress_step": 100, # Finish in one step
    "poll_interval_s": 0.0
}

def test_engraver_billing_calculation():
    """Test energy and cost calculation for engraver"""
    device = make_engraver()
    # Set billing rates from test config
    device["usageBilling"]["emissionFactor"] = TEST_CONFIG["engraver"]["emissionFactor_g_per_kWh"]
    device["usageBilling"]["costPerEnergyUnit"] = TEST_CONFIG["engraver"]["costPerEnergyUnit_EUR_per_kWh"]
    
    result = run_engrave_job(device, "TEST-001", "A", TEST_CONFIG)
    
    assert result["energy_kWh"] == 0.11
    assert result["cost_eur"] == 0.055
    assert result["co2_g"] == 55.0
    
    # Check device state update
    assert device["usageBilling"]["energyConsumed"] == 0.11
    assert device["usageBilling"]["usageCost"] == 0.055

def test_persistence():
    """Test that state is saved to JSON and reloaded"""
    # 1. Reset state (clears DB file)
    reset_state()
    state = get_state()
    
    # 2. Modify state
    state.engraver["operationalData"]["status"]["productionProgress"] = 50
    state._save_device(state.engraver) # Force save
    
    # 3. Verify JSON file content
    assert os.path.exists("simulation_state.json")
    with open("simulation_state.json", "r") as f:
        data = json.load(f)
        assert data["devices"]["engraver"]["operationalData"]["status"]["productionProgress"] == 50
    
    # 4. Create NEW state instance (simulating restart)
    new_state = SimulationState()
    assert new_state.engraver["operationalData"]["status"]["productionProgress"] == 50

def test_cumulative_billing_persistence():
    """Test that cumulative billing is persisted"""
    reset_state()
    state = get_state()
    
    # Update billing
    engraver_data = {"energyConsumed": 10.0, "carbonEmissions": 100.0, "usageCost": 5.0}
    agv_data = {"distanceTraveled": 100.0, "usageCost": 10.0}
    
    state.update_cumulative_billing("direct", engraver_data, agv_data, ["JOB-1"])
    
    # Verify memory
    assert state.cumulative_billing["user_jobs"]["total_cost_eur"] == 15.0
    
    # Verify reload
    new_state = SimulationState()
    assert new_state.cumulative_billing["user_jobs"]["total_cost_eur"] == 15.0
    assert "JOB-1" in new_state.cumulative_billing["user_jobs"]["jobs_processed"]
