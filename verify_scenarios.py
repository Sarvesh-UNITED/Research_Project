import requests
import time
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def wait_for_server():
    print("Waiting for server...")
    for _ in range(30):
        try:
            resp = requests.get("http://localhost:8000/health")
            if resp.status_code == 200:
                print("Server is ready!")
                return True
        except:
            pass
        time.sleep(1)
    print("Server failed to start.")
    return False

def run_scenario(name, endpoint):
    print(f"\n--- Running {name} ---")
    try:
        # Start Scenario
        resp = requests.post(f"{BASE_URL}/cycle/{endpoint}")
        resp.raise_for_status()
        data = resp.json()
        run_id = data["runId"]
        print(f"Started {name}. Run ID: {run_id}")
        
        # Poll for completion
        while True:
            status_resp = requests.get(f"{BASE_URL}/cycle/status/{run_id}")
            status_data = status_resp.json()
            status = status_data["status"]
            
            if status in ["completed", "error", "no_jobs"]:
                print(f"Scenario finished with status: {status}")
                if status == "completed":
                    summary = status_data["cycleSummary"]
                    print(json.dumps(summary, indent=2))
                    return summary
                else:
                    print(f"Error: {status_data.get('error')}")
                    return None
            
            time.sleep(1)
            
    except Exception as e:
        print(f"Failed to run {name}: {e}")
        return None

def main():
    if not wait_for_server():
        sys.exit(1)
        
    # Run Scenario 1
    s1_results = run_scenario("Scenario 1 (Batch)", "scenario1")
    
    # Run Scenario 2
    s2_results = run_scenario("Scenario 2 (Individual)", "scenario2")
    
    # Comparison Report
    print("\n\n=== FINAL VERIFICATION REPORT ===")
    if s1_results and s2_results:
        print(f"{'Metric':<25} | {'Scenario 1 (Batch)':<20} | {'Scenario 2 (Individual)':<20}")
        print("-" * 70)
        print(f"{'Jobs Processed':<25} | {len(s1_results['jobsProcessed']):<20} | {len(s2_results['jobsProcessed']):<20}")
        print(f"{'AGV Distance (m)':<25} | {s1_results['agvBilledMeters']:<20} | {s2_results['agvBilledMeters']:<20}")
        print(f"{'AGV Cost (EUR)':<25} | {s1_results['agvCostEUR']:<20} | {s2_results['agvCostEUR']:<20}")
        print(f"{'Engraver Energy (kWh)':<25} | {s1_results['engraverEnergyKWh']:<20} | {s2_results['engraverEnergyKWh']:<20}")
        print(f"{'Engraver CO2 (g)':<25} | {s1_results['engraverCO2g']:<20} | {s2_results['engraverCO2g']:<20}")
        print(f"{'Total Cost (EUR)':<25} | {s1_results['combinedCostEUR']:<20} | {s2_results['combinedCostEUR']:<20}")
        print("-" * 70)
        
        # Validation checks
        print("\nValidation Checks:")
        
        # Check 1: AGV Cost Calculation
        # S1: 21.28m * 0.02 = 0.4256
        expected_s1_agv = round(s1_results['agvBilledMeters'] * 0.02, 6)
        print(f"1. AGV Cost S1 (Rate 0.02): Expected {expected_s1_agv} vs Actual {s1_results['agvCostEUR']} -> {'PASS' if abs(expected_s1_agv - s1_results['agvCostEUR']) < 0.001 else 'FAIL'}")
        
        # Check 2: Emission Factor
        # S1: Energy * 360
        expected_s1_co2 = round(s1_results['engraverEnergyKWh'] * 360.0, 6)
        print(f"2. CO2 Emissions S1 (Factor 360): Expected {expected_s1_co2} vs Actual {s1_results['engraverCO2g']} -> {'PASS' if abs(expected_s1_co2 - s1_results['engraverCO2g']) < 0.01 else 'FAIL'}")

if __name__ == "__main__":
    main()
