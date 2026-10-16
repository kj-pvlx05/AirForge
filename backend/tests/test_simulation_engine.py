"""AEROSYNC — Simulation Engine Comprehensive Tests (Phase 6).

Test Coverage:
1. Valid weather deterioration event
2. Invalid scenario rejection (400)
3. Invalid target sector rejection (404)
4. Before-state snapshot integrity
5. After-state snapshot integrity & delta
6. Affected resource detection from database relationships
7. Event persistence in simulation_events & events log
8. Event retrieval by ID
9. Deterministic repeated execution
10. Reset behavior and baseline restoration
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services import simulation_service
from app.db.repository import repository


class TestSimulationEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Always start from clean seed baseline
        self.client.post("/api/simulation/reset")

    def tearDown(self):
        # Reset back after each test
        self.client.post("/api/simulation/reset")

    def test_01_valid_weather_deterioration_event(self):
        """Test valid weather deterioration event executes and returns applied status."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()

        self.assertEqual(data["scenario"], "weather_deterioration")
        self.assertEqual(data["target"], "SEC-B")
        self.assertEqual(data["status"], "applied")
        self.assertIn("event_id", data)

    def test_02_invalid_scenario_rejection(self):
        """Test invalid scenario type returns 400 Bad Request."""
        payload = {
            "scenario": "alien_invasion_hypothetical",
            "target_id": "SEC-B",
        }
        res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Unsupported scenario", res.json()["detail"])

    def test_03_invalid_target_sector_rejection(self):
        """Test invalid target sector code returns 404 Not Found."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-NONEXISTENT-99",
        }
        res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(res.status_code, 404)
        self.assertIn("not found", res.json()["detail"].lower())

    def test_04_before_state_snapshot(self):
        """Test before-state snapshot captures pre-mutation operational posture."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()

        sb = data["state_before"]
        self.assertIn("readiness_score", sb)
        self.assertIn("fleet", sb)
        self.assertIn("sector", sb)
        # Sector B baseline weather
        self.assertEqual(sb["sector"]["code"], "SEC-B")
        self.assertEqual(sb["sector"]["ceiling_ft"], 4200)
        self.assertEqual(sb["sector"]["visibility_km"], 8.5)
        self.assertEqual(sb["sector"]["wind_speed_kts"], 14)
        self.assertTrue(sb["sector"]["is_vfr"])

    def test_05_after_state_snapshot_delta(self):
        """Test after-state snapshot reflects deterministic weather deterioration."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()

        sb = data["state_before"]
        sa = data["state_after"]

        # Weather deteriorated
        self.assertEqual(sa["sector"]["ceiling_ft"], 1500)
        self.assertEqual(sa["sector"]["visibility_km"], 2.5)
        self.assertEqual(sa["sector"]["wind_speed_kts"], 28)
        self.assertEqual(sa["sector"]["condition"], "thunderstorm")
        self.assertFalse(sa["sector"]["is_vfr"])
        self.assertEqual(sa["sector"]["risk_level"], "high")

        # Readiness degraded due to grounded aircraft
        self.assertLess(sa["readiness_score"], sb["readiness_score"])
        self.assertGreater(sa["fleet"]["grounded"], sb["fleet"]["grounded"])

    def test_06_affected_resource_detection(self):
        """Test affected missions, aircraft, and routes are calculated from database relations."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()

        impact = data["impact"]
        # Sector B has real missions operating from Bravo Base or through Sector B
        self.assertGreaterEqual(len(impact["affected_sectors"]), 1)
        self.assertEqual(impact["affected_sectors"][0]["code"], "SEC-B")

        # Affected missions should include MSN-2026-01 (emergency medevac in Sector B)
        affected_mission_codes = [m["code"] for m in impact["affected_missions"]]
        self.assertIn("MSN-2026-01", affected_mission_codes)
        self.assertIn("MSN-2026-04", affected_mission_codes)

        # Affected aircraft should include grounded units
        self.assertGreaterEqual(len(impact["affected_aircraft"]), 1)
        grounded_aircraft = [ac for ac in impact["affected_aircraft"] if ac["status_after"] == "grounded"]
        self.assertGreaterEqual(len(grounded_aircraft), 1)

        # Affected routes
        self.assertGreaterEqual(len(impact["affected_routes"]), 1)

    def test_07_event_persistence(self):
        """Test simulation triggers write to audit events feed and simulation history."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(res.status_code, 201)
        event_id = res.json()["event_id"]

        # Check in /api/events feed
        events_res = self.client.get("/api/events?category=weather")
        self.assertEqual(events_res.status_code, 200)
        events = events_res.json()
        titles = [e["title"] for e in events]
        self.assertTrue(any("Weather deterioration detected" in t for t in titles))

        # Check in /api/simulation/events history
        history_res = self.client.get("/api/simulation/events")
        self.assertEqual(history_res.status_code, 200)
        history_ids = [e["id"] for e in history_res.json()]
        self.assertIn(event_id, history_ids)

    def test_08_event_retrieval_by_id(self):
        """Test retrieval of previously executed simulation by event_id."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        create_res = self.client.post("/api/simulation/events", json=payload)
        self.assertEqual(create_res.status_code, 201)
        event_id = create_res.json()["event_id"]

        get_res = self.client.get(f"/api/simulation/events/{event_id}")
        self.assertEqual(get_res.status_code, 200)
        retrieved = get_res.json()
        self.assertEqual(retrieved["event_id"], event_id)
        self.assertEqual(retrieved["scenario"], "weather_deterioration")
        self.assertEqual(retrieved["target"], "SEC-B")

    def test_09_deterministic_repeated_execution(self):
        """Test repeated scenario executions yield deterministic state values."""
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        res1 = self.client.post("/api/simulation/events", json=payload)
        data1 = res1.json()

        self.client.post("/api/simulation/reset")

        res2 = self.client.post("/api/simulation/events", json=payload)
        data2 = res2.json()

        # Both runs against baseline must produce identical before and after states
        self.assertEqual(data1["state_before"]["readiness_score"], data2["state_before"]["readiness_score"])
        self.assertEqual(data1["state_after"]["readiness_score"], data2["state_after"]["readiness_score"])
        self.assertEqual(
            data1["state_after"]["sector"]["visibility_km"],
            data2["state_after"]["sector"]["visibility_km"],
        )
        self.assertEqual(
            data1["state_after"]["sector"]["ceiling_ft"],
            data2["state_after"]["sector"]["ceiling_ft"],
        )
        self.assertEqual(
            len(data1["impact"]["affected_missions"]),
            len(data2["impact"]["affected_missions"]),
        )

    def test_10_reset_behavior_and_baseline_restoration(self):
        """Test POST /api/simulation/reset restores initial baseline state."""
        # 1. Mutate via simulation
        payload = {
            "scenario": "weather_deterioration",
            "target_id": "SEC-B",
        }
        self.client.post("/api/simulation/events", json=payload)

        # Verify Sector B is degraded
        sectors_res = self.client.get("/api/sectors")
        sec_b = [s for s in sectors_res.json() if s["code"] == "SEC-B"][0]
        self.assertEqual(sec_b["risk_level"], "high")

        # 2. Call reset
        reset_res = self.client.post("/api/simulation/reset")
        self.assertEqual(reset_res.status_code, 200)
        self.assertEqual(reset_res.json()["status"], "reset")

        # 3. Verify baseline restored
        # 3.1 Sector B nominal/active
        sectors_res_post = self.client.get("/api/sectors")
        sec_b_post = [s for s in sectors_res_post.json() if s["code"] == "SEC-B"][0]
        self.assertEqual(sec_b_post["risk_level"], "medium")
        self.assertEqual(sec_b_post["status"], "active")

        # 3.2 18/22 available aircraft and 86% readiness
        readiness_res = self.client.get("/api/readiness")
        readiness_data = readiness_res.json()
        self.assertEqual(readiness_data["operational_readiness_pct"], 86)
        self.assertEqual(readiness_data["fleet"]["available"], 18)
        self.assertEqual(readiness_data["fleet"]["total"], 22)

        # 3.3 Baseline weather
        env_res = self.client.get("/api/environment")
        env_data = env_res.json()
        sec_b_weather = [w for w in env_data["weather"] if "Sector B" in w.get("region", "")][0]
        self.assertEqual(sec_b_weather["visibility_km"], 8.5)
        self.assertEqual(sec_b_weather["ceiling_ft"], 4200)
        self.assertEqual(sec_b_weather["wind_speed_kts"], 14)
        self.assertEqual(sec_b_weather["condition"], "scattered-clouds")
        self.assertTrue(sec_b_weather["is_vfr"])

        # 3.4 Baseline aircraft statuses
        aircraft_res = self.client.get("/api/aircraft")
        aircraft_list = aircraft_res.json()
        available_count = len([a for a in aircraft_list if a["status"] == "available"])
        grounded_count = len([a for a in aircraft_list if a["status"] == "grounded"])
        self.assertEqual(available_count, 18)
        self.assertEqual(grounded_count, 1)

        # 3.5 Restrictions restored
        restrictions_res = self.client.get("/api/environment")
        restrictions = restrictions_res.json()["restrictions"]
        # Sector B restriction is not active
        sec_b_restrictions = [r for r in restrictions if r.get("sector_id") == sec_b_post["id"]]
        for r in sec_b_restrictions:
            self.assertNotEqual(r["status"], "active")


if __name__ == "__main__":
    unittest.main()
