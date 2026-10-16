"""Unit tests for AEROSYNC Synthetic Seed Data, Models, and Foreign Key Integrity."""

import unittest
from uuid import UUID
from app.db.store import store
from app.models import (
    Aircraft,
    Crew,
    Airport,
    Sector,
    Mission,
    MaintenanceRecord,
    WeatherCondition,
    AirspaceRestriction,
)


class TestSeedDataAndModels(unittest.TestCase):
    def setUp(self):
        store.reset_to_seed()

    def test_seed_data_counts(self):
        """Verify that all required synthetic entity count thresholds are satisfied."""
        airports = store.get_airports()
        sectors = store.get_sectors()
        aircraft = store.get_aircraft()
        crew = store.get_crew()
        missions = store.get_missions()
        maintenance = store.get_maintenance_records()
        weather = store.get_weather()
        restrictions = store.get_airspace_restrictions()

        self.assertGreaterEqual(len(airports), 5, "Must have at least 5 airports")
        self.assertGreaterEqual(len(sectors), 6, "Must have at least 6 sectors")
        self.assertGreaterEqual(len(aircraft), 20, "Must have at least 20 aircraft")
        self.assertGreaterEqual(len(crew), 30, "Must have at least 30 crew members")
        self.assertGreaterEqual(len(missions), 15, "Must have at least 15 missions")
        self.assertGreaterEqual(len(maintenance), 10, "Must have at least 10 maintenance records")
        self.assertGreaterEqual(len(weather), 4, "Must have multiple weather conditions")
        self.assertGreaterEqual(len(restrictions), 3, "Must have multiple airspace restrictions")

        # Exact counts generated
        self.assertEqual(len(airports), 5)
        self.assertEqual(len(sectors), 6)
        self.assertEqual(len(aircraft), 22)
        self.assertEqual(len(crew), 32)
        self.assertEqual(len(missions), 16)
        self.assertEqual(len(maintenance), 11)
        self.assertEqual(len(weather), 6)
        self.assertEqual(len(restrictions), 4)

    def test_aircraft_nomenclature(self):
        """Verify that aircraft use the updated fictional model names and types."""
        allowed_models = {"AeroLift M1", "AeroLift H2", "AeroTransport T1", "AeroUtility U1"}
        allowed_types = {
            "Medium utility helicopter",
            "Heavy transport helicopter",
            "Fixed-wing transport",
            "Light utility helicopter",
        }

        for ac in store.get_aircraft():
            self.assertIn(ac.model, allowed_models)
            self.assertIn(ac.type, allowed_types)
            if ac.model == "AeroUtility U1":
                self.assertEqual(ac.type, "Light utility helicopter")
            elif ac.model == "AeroTransport T1":
                self.assertEqual(ac.type, "Fixed-wing transport")

    def test_foreign_key_integrity(self):
        """Verify that all relationships (airports, sectors, aircraft, crew) resolve correctly."""
        airport_ids = {a.id for a in store.get_airports()}
        sector_ids = {s.id for s in store.get_sectors()}
        aircraft_ids = {ac.id for ac in store.get_aircraft()}
        crew_ids = {c.id for c in store.get_crew()}

        # Aircraft -> Airports
        for ac in store.get_aircraft():
            if ac.base_airport_id:
                self.assertIn(ac.base_airport_id, airport_ids, f"Aircraft {ac.tail_number} has invalid base_airport_id")
            if ac.current_airport_id:
                self.assertIn(ac.current_airport_id, airport_ids, f"Aircraft {ac.tail_number} has invalid current_airport_id")

        # Crew -> Airports
        for c in store.get_crew():
            if c.base_airport_id:
                self.assertIn(c.base_airport_id, airport_ids, f"Crew {c.code} has invalid base_airport_id")

        # Missions -> Airports, Sectors, Aircraft
        for m in store.get_missions():
            self.assertIn(m.origin_airport_id, airport_ids, f"Mission {m.code} invalid origin")
            self.assertIn(m.destination_airport_id, airport_ids, f"Mission {m.code} invalid destination")
            if m.sector_id:
                self.assertIn(m.sector_id, sector_ids, f"Mission {m.code} invalid sector")
            if m.assigned_aircraft_id:
                self.assertIn(m.assigned_aircraft_id, aircraft_ids, f"Mission {m.code} invalid aircraft")

        # Maintenance -> Aircraft
        for mr in store.get_maintenance_records():
            self.assertIn(mr.aircraft_id, aircraft_ids, f"Maintenance record {mr.id} invalid aircraft_id")

        # Weather -> Sectors, Airports
        for w in store.get_weather():
            if w.sector_id:
                self.assertIn(w.sector_id, sector_ids, f"Weather {w.id} invalid sector_id")
            if w.airport_id:
                self.assertIn(w.airport_id, airport_ids, f"Weather {w.id} invalid airport_id")

        # Restrictions -> Sectors
        for r in store.get_airspace_restrictions():
            if r.sector_id:
                self.assertIn(r.sector_id, sector_ids, f"Restriction {r.identifier} invalid sector_id")

    def test_readiness_metrics(self):
        """Verify aggregated fleet and crew readiness KPIs."""
        metrics = store.get_readiness_metrics()
        self.assertEqual(metrics["aircraft_total"], 22)
        self.assertEqual(metrics["aircraft_available"], 18)
        self.assertEqual(metrics["crew_total"], 32)
        self.assertEqual(metrics["crew_available"], 29)
        self.assertEqual(metrics["missions_active"], 16)
        # Readiness formula: 50% aircraft availability + 50% crew availability (~86%)
        self.assertAlmostEqual(metrics["operational_readiness_pct"], 86, delta=2)

    def test_state_mutation(self):
        """Verify that mutations on operational store work cleanly."""
        target_ac = store.get_aircraft()[0]
        original_status = target_ac.status

        # Ground aircraft
        updated = store.update_aircraft_status(target_ac.id, "grounded")
        self.assertIsNotNone(updated)
        self.assertEqual(updated.status, "grounded")
        self.assertEqual(store.get_aircraft_by_id(target_ac.id).status, "grounded")

        # Reset
        store.reset_to_seed()
        self.assertEqual(store.get_aircraft_by_id(target_ac.id).status, original_status)


if __name__ == "__main__":
    unittest.main()
