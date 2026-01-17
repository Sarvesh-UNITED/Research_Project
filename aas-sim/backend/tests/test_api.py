"""Basic API tests"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.state import reset_state

client = TestClient(app)

def setup_module():
    """Reset state before tests"""
    reset_state()

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "AAS Simulation API"
    assert "endpoints" in data

def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "devices" in data

def test_get_devices():
    """Test getting all devices"""
    response = client.get("/api/v1/aas/devices")
    assert response.status_code == 200
    data = response.json()
    assert "engraver" in data
    assert "agv" in data

def test_get_device_status():
    """Test getting device status"""
    response = client.get("/api/v1/aas/engraver/operational/status")
    assert response.status_code == 200
    data = response.json()
    assert "productionProgress" in data
    assert "operationMode" in data
    assert "heartbeatCounter" in data
    assert "heartbeatTimestamp" in data

def test_get_billing_data():
    """Test getting billing data"""
    response = client.get("/api/v1/aas/engraver/billing")
    assert response.status_code == 200
    data = response.json()
    assert "currency" in data
    assert "billingStatus" in data
    assert "energyConsumed" in data
    assert "usageCost" in data

def test_get_queue():
    """Test getting queue"""
    response = client.get("/api/v1/queue")
    assert response.status_code == 200
    data = response.json()
    assert "queue" in data
    assert "length" in data

def test_enqueue_job():
    """Test enqueueing a job"""
    job_data = {
        "orderNo": "TEST-001",
        "laserText": "TEST",
        "site": "JOB_POS1"
    }
    
    response = client.post("/api/v1/queue/enqueue", json=job_data)
    assert response.status_code == 200
    data = response.json()
    assert data["orderNo"] == "TEST-001"
    assert data["queueLength"] == 1

def test_get_config():
    """Test getting configuration"""
    response = client.get("/api/v1/config")
    assert response.status_code == 200
    data = response.json()
    assert "config" in data
    assert "coords" in data

def test_get_history():
    """Test getting history"""
    response = client.get("/api/v1/history")
    assert response.status_code == 200
    data = response.json()
    assert "history" in data
    assert "total" in data

def test_combined_billing():
    """Test combined billing endpoint"""
    response = client.get("/api/v1/aas/combined-billing")
    assert response.status_code == 200
    data = response.json()
    assert "engraver" in data
    assert "agv" in data
    assert "combined_cost_eur" in data
    assert "currency" in data

def test_cycle_status():
    """Test cycle status endpoint"""
    response = client.get("/api/v1/cycle/status")
    assert response.status_code == 200
    data = response.json()
    assert "engraver_mode" in data
    assert "agv_mode" in data
    assert "queue_length" in data