"""Comprehensive API tests for all AEROSYNC FastAPI endpoints."""

import unittest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.db.store import store


class TestApiEndpoints(unittest.TestCase):
    def setUp(self):
        store.reset_to_seed()
        self.client = TestClient(app)

    # -------------------------------------------------------------------------
    # Aircraft Endpoints
    # -------------------------------------------------------------------------
    def test_list_aircraft(self):
        response = self.client.get("/api/aircraft")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 22)
        # Check required fields
        self.assertIn("tail_number", data[0])
        self.assertIn("model", data[0])
        self.assertIn("status", data[0])

    def test_list_aircraft_filtered(self):
        response = self.client.get("/api/aircraft?status=available")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 18)
        for ac in data:
            self.assertEqual(ac["status"], "available")

        response_role = self.client.get("/api/aircraft?role=medevac")
        self.assertEqual(response_role.status_code, 200)
        data_role = response_role.json()
        self.assertGreater(len(data_role), 0)
        for ac in data_role:
            self.assertEqual(ac["role"], "medevac")

    def test_get_aircraft_by_id(self):
        all_ac = self.client.get("/api/aircraft").json()
        target_id = all_ac[0]["id"]

        response = self.client.get(f"/api/aircraft/{target_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], target_id)
        self.assertEqual(data["tail_number"], all_ac[0]["tail_number"])

    def test_get_aircraft_not_found(self):
        random_id = str(uuid4())
        response = self.client.get(f"/api/aircraft/{random_id}")
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    # -------------------------------------------------------------------------
    # Crew Endpoints
    # -------------------------------------------------------------------------
    def test_list_crew(self):
        response = self.client.get("/api/crew")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 32)
        self.assertIn("name", data[0])
        self.assertIn("role", data[0])

    def test_list_crew_filtered(self):
        response = self.client.get("/api/crew?role=pilot")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 12)
        for c in data:
            self.assertEqual(c["role"], "pilot")

        response_status = self.client.get("/api/crew?status=available")
        self.assertEqual(response_status.status_code, 200)
        self.assertEqual(len(response_status.json()), 29)

    def test_get_crew_by_id(self):
        all_crew = self.client.get("/api/crew").json()
        target_id = all_crew[0]["id"]

        response = self.client.get(f"/api/crew/{target_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], target_id)

    def test_get_crew_not_found(self):
        random_id = str(uuid4())
        response = self.client.get(f"/api/crew/{random_id}")
        self.assertEqual(response.status_code, 404)

    # -------------------------------------------------------------------------
    # Mission Endpoints
    # -------------------------------------------------------------------------
    def test_list_missions(self):
        response = self.client.get("/api/missions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 16)
        self.assertIn("code", data[0])
        self.assertIn("priority", data[0])

    def test_list_missions_filtered(self):
        response_crit = self.client.get("/api/missions?priority=critical")
        self.assertEqual(response_crit.status_code, 200)
        data = response_crit.json()
        self.assertEqual(len(data), 3)
        for m in data:
            self.assertEqual(m["priority"], "critical")

        response_type = self.client.get("/api/missions?type=disaster-relief")
        self.assertEqual(response_type.status_code, 200)
        for m in response_type.json():
            self.assertEqual(m["type"], "disaster-relief")

    def test_get_mission_by_id(self):
        all_m = self.client.get("/api/missions").json()
        target_id = all_m[0]["id"]

        response = self.client.get(f"/api/missions/{target_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], target_id)

    def test_get_mission_not_found(self):
        random_id = str(uuid4())
        response = self.client.get(f"/api/missions/{random_id}")
        self.assertEqual(response.status_code, 404)

    # -------------------------------------------------------------------------
    # Airports & Sectors Endpoints
    # -------------------------------------------------------------------------
    def test_list_airports(self):
        response = self.client.get("/api/airports")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 5)

    def test_get_airport_by_id(self):
        airports = self.client.get("/api/airports").json()
        target_id = airports[0]["id"]
        response = self.client.get(f"/api/airports/{target_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], airports[0]["code"])

    def test_list_sectors(self):
        response = self.client.get("/api/sectors")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 6)

    def test_get_sector_by_id(self):
        sectors = self.client.get("/api/sectors").json()
        target_id = sectors[0]["id"]
        response = self.client.get(f"/api/sectors/{target_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], sectors[0]["code"])

    # -------------------------------------------------------------------------
    # Environment State
    # -------------------------------------------------------------------------
    def test_get_environment_state(self):
        response = self.client.get("/api/environment")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("weather", data)
        self.assertIn("restrictions", data)
        self.assertIn("sectors", data)
        self.assertIn("timestamp", data)
        self.assertEqual(len(data["weather"]), 6)
        self.assertEqual(len(data["restrictions"]), 4)
        self.assertEqual(len(data["sectors"]), 6)

    # -------------------------------------------------------------------------
    # Readiness Telemetry
    # -------------------------------------------------------------------------
    def test_get_readiness_report(self):
        response = self.client.get("/api/readiness")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("operational_readiness_pct", data)
        self.assertIn("fleet", data)
        self.assertIn("crew", data)
        self.assertIn("missions", data)
        # Fleet KPIs
        self.assertEqual(data["fleet"]["total"], 22)
        self.assertEqual(data["fleet"]["available"], 18)
        # Crew KPIs
        self.assertEqual(data["crew"]["total"], 32)
        self.assertEqual(data["crew"]["available"], 29)
        # Overall ~86%
        self.assertAlmostEqual(data["operational_readiness_pct"], 86, delta=2)

    # -------------------------------------------------------------------------
    # Events Log
    # -------------------------------------------------------------------------
    def test_list_events(self):
        response = self.client.get("/api/events?limit=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertLessEqual(len(data), 5)
        self.assertGreater(len(data), 0)

    # -------------------------------------------------------------------------
    # Stubs (Simulation, Optimization, AI)
    # -------------------------------------------------------------------------
    def test_simulation_event_execution(self):
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        response = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["scenario"], "weather_deterioration")
        self.assertEqual(data["target"], "SEC-B")
        self.assertEqual(data["status"], "applied")
        self.assertIn("state_before", data)
        self.assertIn("state_after", data)
        self.assertIn("impact", data)
        # Reset after test
        self.client.post("/api/simulation/reset")

    def test_optimization_run_stub(self):
        payload = {
            "trigger_reason": "manual_baseline_check",
            "excluded_aircraft_ids": [],
            "excluded_sector_ids": [],
            "excluded_crew_ids": [],
        }
        response = self.client.post("/api/optimization/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["solver_status"], "OPTIMAL")
        self.assertGreaterEqual(data["solve_time_ms"], 0)

    def test_ai_analyze_stub(self):
        # Run optimization first to get authoritative run_id
        opt_resp = self.client.post("/api/optimization/run", json={"trigger_reason": "test"})
        self.assertEqual(opt_resp.status_code, 200)
        run_id = opt_resp.json()["run_id"]

        payload = {"optimization_run_id": run_id}
        response = self.client.post("/api/ai/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["optimization_run_id"], run_id)
        self.assertIn("headline", data["explanation"])
        self.assertIn("situation_summary", data["explanation"])

    def test_ai_chat_stub(self):
        payload = {"message": "What is current fleet readiness?", "context": {}}
        response = self.client.post("/api/ai/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("response", data)


if __name__ == "__main__":
    unittest.main()
