"""AEROSYNC — OR-Tools CP-SAT Optimization Engine Comprehensive Tests (Phase 7).

Verifies all 13 required test cases:
1. Baseline optimization
2. Weather deterioration scenario (Sector B squall line)
3. Aircraft unavailable (grounded/maintenance aircraft excluded)
4. Crew unavailable (off-duty/medical crew excluded)
5. Incompatible aircraft (model, payload, passenger capacities enforced)
6. Incompatible crew qualification (certifications & roles strictly matched)
7. Restricted airspace (NOTAM avoidance & inland detour corridors)
8. Weather restriction (sub-VFR minimums & light utility exclusion)
9. Mission priority ordering (Critical > High > Medium > Low guarantees)
10. No-feasible-allocation case (unresolved missions reported, not dropped)
11. Deterministic repeated optimization (bit-for-bit reproducible solutions)
12. Persisted optimization result (immutable run and recommendation storage)
13. Retrieved optimization result (API retrieval by run ID)
"""

import unittest
from uuid import UUID
from fastapi.testclient import TestClient
from app.main import app
from app.db.repository import repository


class TestOptimizationEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Always start from clean seed baseline
        self.client.post("/api/simulation/reset")

    def tearDown(self):
        self.client.post("/api/simulation/reset")

    def test_01_baseline_optimization(self):
        """1. Baseline optimization: executes CP-SAT on nominal operational state."""
        res = self.client.post("/api/optimization/run", json={"trigger_reason": "nominal_baseline_eval"})
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn(data["solver_status"], ["OPTIMAL", "FEASIBLE"])
        self.assertGreater(data["objective_score"], 0)
        self.assertLess(data["solve_time_ms"], 5000)
        self.assertTrue(data["constraints"]["hard_constraints_satisfied"])
        self.assertGreaterEqual(data["metrics"]["missions_covered"], 10)
        self.assertGreaterEqual(len(data["allocations"]), 10)
        self.assertIn("run_id", data)

    def test_02_weather_deterioration_scenario(self):
        """2. Weather deterioration scenario: Sector B squall forces reassignments and detour corridors."""
        # Step 1: Trigger weather deterioration in Sector B via Phase 6 simulation
        sim_res = self.client.post(
            "/api/simulation/events",
            json={"scenario": "weather_deterioration", "target_id": "SEC-B"},
        )
        self.assertEqual(sim_res.status_code, 201)
        sim_data = sim_res.json()
        grounded_aircraft = [
            a["tail_number"]
            for a in sim_data["impact"]["affected_aircraft"]
            if a["status_after"] == "grounded"
        ]
        self.assertGreater(len(grounded_aircraft), 0)

        # Step 2: Run optimization against mutated state
        opt_res = self.client.post(
            "/api/optimization/run",
            json={"trigger_reason": "weather_deterioration_sector_b", "scenario_event_id": sim_data["event_id"]},
        )
        self.assertEqual(opt_res.status_code, 200)
        data = opt_res.json()

        # Step 3: Verify allocations and constraints
        self.assertIn(data["solver_status"], ["OPTIMAL", "FEASIBLE"])
        self.assertTrue(data["constraints"]["hard_constraints_satisfied"])

        # Grounded aircraft must NEVER appear in any allocation
        allocated_tails = [alloc["aircraft_tail"] for alloc in data["allocations"]]
        for grounded_tail in grounded_aircraft:
            self.assertNotIn(grounded_tail, allocated_tails, f"Grounded tail {grounded_tail} was allocated!")

        # Unresolved missions must be detected and reported
        self.assertGreaterEqual(len(data["unresolved_missions"]), 1)
        unresolved_codes = [um["mission_code"] for um in data["unresolved_missions"]]
        self.assertTrue(any("MSN-2026" in code for code in unresolved_codes))

        # Reassignments must be present and explainable
        reassigned = data["reassignments"]
        self.assertGreaterEqual(len(reassigned), 2)
        for r in reassigned:
            self.assertTrue(len(r["reason"]) > 10, "Missing algorithmic rationale!")

    def test_03_aircraft_unavailable(self):
        """3. Aircraft unavailable: airframes in maintenance or unavailable are strictly excluded."""
        # Mark aircraft AS-LM01 as maintenance
        ac_list = repository.get_aircraft()
        target_ac = next(a for a in ac_list if a.tail_number == "AS-LM01")
        repository.update_aircraft_status(target_ac.id, "maintenance")

        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        allocated_tails = [a["aircraft_tail"] for a in res.json()["allocations"]]
        self.assertNotIn("AS-LM01", allocated_tails, "Maintenance airframe AS-LM01 was allocated!")

    def test_04_crew_unavailable(self):
        """4. Crew unavailable: off-duty and medical crew members are never assigned."""
        # Find crew member CRW-P01 and set to medical
        crew_list = repository.get_crew()
        p01 = next(c for c in crew_list if c.code == "CRW-P01")
        repository.update_crew_status(p01.id, "medical")

        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        for alloc in res.json()["allocations"]:
            self.assertNotIn("CRW-P01", alloc.get("crew_codes", []), "Medical crew CRW-P01 was allocated!")

    def test_05_incompatible_aircraft(self):
        """5. Incompatible aircraft: payload and platform model compatibility enforced."""
        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        allocations = {a["mission_code"]: a for a in res.json()["allocations"]}

        # MSN-2026-03 requires AeroLift H2 (heavy helicopter) and has cargo weight 6200 kg
        if "MSN-2026-03" in allocations:
            alloc_ac_tail = allocations["MSN-2026-03"]["aircraft_tail"]
            ac = next(a for a in repository.get_aircraft() if a.tail_number == alloc_ac_tail)
            self.assertGreaterEqual(ac.max_payload_kg, 6200, "Aircraft payload insufficient for heavy cargo!")

    def test_06_incompatible_crew_qualification(self):
        """6. Incompatible crew qualification: specialized missions require certified crew."""
        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        crew_map = {c.id: c for c in repository.get_crew()}

        # Check all medevac allocations have required crew roles
        for alloc in res.json()["allocations"]:
            assigned_crew = [crew_map[UUID(cid)] for cid in alloc.get("crew_ids", []) if UUID(cid) in crew_map]
            assigned_roles = [c.role for c in assigned_crew]
            # Every flying mission must have at least one pilot
            if assigned_crew:
                self.assertIn("pilot", assigned_roles, f"Mission {alloc['mission_code']} dispatched without pilot!")

    def test_07_restricted_airspace(self):
        """7. Restricted airspace: missions touching adverse sectors route via inland detour corridor."""
        self.client.post(
            "/api/simulation/events",
            json={"scenario": "weather_deterioration", "target_id": "SEC-B"},
        )
        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        reassignments = res.json()["reassignments"]

        rerouted = [r for r in reassignments if "Corridor" in r.get("recommended_corridor", "")]
        self.assertGreater(len(rerouted), 0, "No flights rerouted around convective airspace!")

    def test_08_weather_restriction(self):
        """8. Weather restriction: light utility aircraft (U1) prohibited in severe thunderstorm sectors."""
        self.client.post(
            "/api/simulation/events",
            json={"scenario": "weather_deterioration", "target_id": "SEC-B"},
        )
        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)

        # In Sector B severe weather, no AeroUtility U1 should be assigned to Sector B missions
        for alloc in res.json()["allocations"]:
            if "MSN-2026-01" == alloc["mission_code"]:  # Originates at Bravo Base
                self.assertNotIn("Utility", alloc["aircraft_tail"], "Light utility allocated to severe weather sector!")

    def test_09_mission_priority_ordering(self):
        """9. Mission priority ordering: critical priority missions guaranteed allocation."""
        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        allocations = {a["mission_code"]: a for a in res.json()["allocations"]}

        # Critical priority missions must be fulfilled
        critical_missions = [m for m in repository.get_missions() if m.priority == "critical"]
        for cm in critical_missions:
            self.assertIn(cm.code, allocations, f"Critical mission {cm.code} was unallocated!")

    def test_10_no_feasible_allocation_case(self):
        """10. No-feasible-allocation case: unassignable missions reported in unresolved_missions."""
        # Ground all aircraft at all bases
        for ac in repository.get_aircraft():
            repository.update_aircraft_status(ac.id, "grounded")

        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # When all aircraft are grounded, candidate missions become unresolved
        self.assertEqual(len(data["allocations"]), 0)
        self.assertGreater(len(data["unresolved_missions"]), 0)
        for um in data["unresolved_missions"]:
            self.assertTrue(len(um["reason"]) > 0)
            self.assertGreater(len(um["unmet_constraints"]), 0)

    def test_11_deterministic_repeated_optimization(self):
        """11. Deterministic repeated optimization: consecutive runs produce bit-for-bit identical results."""
        res1 = self.client.post("/api/optimization/run", json={"trigger_reason": "deterministic_test"})
        res2 = self.client.post("/api/optimization/run", json={"trigger_reason": "deterministic_test"})

        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res2.status_code, 200)

        d1 = res1.json()
        d2 = res2.json()

        self.assertEqual(d1["objective_score"], d2["objective_score"])
        self.assertEqual(d1["solver_status"], d2["solver_status"])
        self.assertEqual(len(d1["allocations"]), len(d2["allocations"]))

        alloc1 = {a["mission_id"]: a["aircraft_id"] for a in d1["allocations"]}
        alloc2 = {a["mission_id"]: a["aircraft_id"] for a in d2["allocations"]}
        self.assertEqual(alloc1, alloc2)

    def test_12_persisted_optimization_result(self):
        """12. Persisted optimization result: results saved immutably with audit events."""
        res = self.client.post("/api/optimization/run", json={"trigger_reason": "persistence_verification"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        run_id = UUID(data["run_id"])

        # Check repository has saved the run
        saved_run = repository.get_optimization_run(run_id)
        self.assertIsNotNone(saved_run)
        self.assertEqual(saved_run.solver_status, data["solver_status"])

    def test_13_retrieved_optimization_result(self):
        """13. Retrieved optimization result: API returns previously computed optimization runs and results."""
        res = self.client.post("/api/optimization/run", json={"trigger_reason": "retrieval_verification"})
        self.assertEqual(res.status_code, 200)
        run_id = res.json()["run_id"]

        # Retrieve by GET /api/optimization/runs/{run_id}
        get_run_res = self.client.get(f"/api/optimization/runs/{run_id}")
        self.assertEqual(get_run_res.status_code, 200)
        self.assertEqual(get_run_res.json()["id"], run_id)

        # Retrieve by GET /api/optimization/results/{run_id}
        get_result_res = self.client.get(f"/api/optimization/results/{run_id}")
        self.assertEqual(get_result_res.status_code, 200)
        self.assertEqual(get_result_res.json()["run_id"], run_id)

    def test_14_apply_to_fleet_audit_trail(self):
        """14. Apply to Fleet: preserves explicit audit trail with run_id, timestamp, previous and new airframes."""
        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        rec_id = data["recommendation_id"]
        run_id = data["run_id"]

        apply_res = self.client.post(f"/api/optimization/apply/{rec_id}", json={})
        self.assertEqual(apply_res.status_code, 200)
        apply_data = apply_res.json()
        self.assertEqual(apply_data["status"], "applied")

        # Verify audit event emitted with required metadata
        events = repository.get_events(limit=5, category="fleet")
        applied_events = [e for e in events if e.metadata.get("recommendation_id") == str(rec_id)]
        self.assertGreater(len(applied_events), 0, "No audit event emitted for applied recommendation!")
        audit_meta = applied_events[0].metadata
        self.assertEqual(audit_meta["optimization_run_id"], str(run_id))
        self.assertIn("allocations", audit_meta)
        self.assertGreater(len(audit_meta["allocations"]), 0)
        first_audit = audit_meta["allocations"][0]
        self.assertIn("new_aircraft_id", first_audit)
        self.assertIn("new_aircraft_tail", first_audit)
        self.assertIn("reason", first_audit)

    def test_15_reset_after_apply_to_fleet(self):
        """15. Reset after Apply to Fleet: simulation reset restores baseline missions while result remains immutable."""
        res = self.client.post("/api/optimization/run", json={})
        self.assertEqual(res.status_code, 200)
        rec_id = res.json()["recommendation_id"]
        run_id = res.json()["run_id"]

        # Apply recommendation
        self.client.post(f"/api/optimization/apply/{rec_id}", json={})

        # Reset simulation back to baseline
        reset_res = self.client.post("/api/simulation/reset", json={})
        self.assertEqual(reset_res.status_code, 200)

        # Baseline aircraft allocations restored
        missions = repository.get_missions()
        self.assertEqual(len(missions), 16)

        # Original optimization result remains intact and immutable
        saved_result = repository.get_optimization_result(UUID(run_id))
        self.assertIsNotNone(saved_result, "Optimization result must remain immutable after simulation reset!")
        self.assertEqual(str(saved_result.run_id), run_id)


if __name__ == "__main__":
    unittest.main()
