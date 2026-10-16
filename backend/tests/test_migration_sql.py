"""Unit tests verifying SQL migration file structure and RLS policy completeness."""

import os
import re
import unittest

MIGRATION_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "supabase", "migrations", "20261005000000_initial_schema.sql"
)
SEED_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "supabase", "seed.sql"
)


class TestSqlMigration(unittest.TestCase):
    def setUp(self):
        self.assertTrue(os.path.exists(MIGRATION_PATH), f"Migration file not found at {MIGRATION_PATH}")
        with open(MIGRATION_PATH, "r", encoding="utf-8") as f:
            self.migration_sql = f.read()

        self.assertTrue(os.path.exists(SEED_PATH), f"Seed SQL file not found at {SEED_PATH}")
        with open(SEED_PATH, "r", encoding="utf-8") as f:
            self.seed_sql = f.read()

    def test_required_tables_exist(self):
        """Verify that all 13 required operational tables are declared."""
        required_tables = [
            "airports",
            "sectors",
            "aircraft",
            "crew",
            "missions",
            "mission_crew",
            "maintenance_records",
            "weather_conditions",
            "airspace_restrictions",
            "simulation_events",
            "optimization_runs",
            "recommendations",
            "events",
        ]

        for table in required_tables:
            pattern = rf"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?{table}\b"
            match = re.search(pattern, self.migration_sql, re.IGNORECASE)
            self.assertIsNotNone(match, f"Table '{table}' not found in migration SQL")

    def test_rls_enabled_on_all_tables(self):
        """Verify that Row Level Security is explicitly enabled on all tables."""
        required_tables = [
            "airports",
            "sectors",
            "aircraft",
            "crew",
            "missions",
            "mission_crew",
            "maintenance_records",
            "weather_conditions",
            "airspace_restrictions",
            "simulation_events",
            "optimization_runs",
            "recommendations",
            "events",
        ]

        for table in required_tables:
            pattern = rf"ALTER\s+TABLE\s+{table}\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;"
            match = re.search(pattern, self.migration_sql, re.IGNORECASE)
            self.assertIsNotNone(match, f"RLS not enabled for table '{table}'")

    def test_rls_read_policies_exist(self):
        """Verify that SELECT policies exist on all tables."""
        required_tables = [
            "airports",
            "sectors",
            "aircraft",
            "crew",
            "missions",
            "mission_crew",
            "maintenance_records",
            "weather_conditions",
            "airspace_restrictions",
            "simulation_events",
            "optimization_runs",
            "recommendations",
            "events",
        ]

        for table in required_tables:
            pattern = rf"CREATE\s+POLICY\s+.*?ON\s+{table}\s+FOR\s+SELECT\b"
            match = re.search(pattern, self.migration_sql, re.IGNORECASE | re.DOTALL)
            self.assertIsNotNone(match, f"No SELECT policy found for table '{table}'")

    def test_seed_sql_contains_insert_for_all_core_tables(self):
        """Verify that seed.sql populates all core operational tables."""
        tables_to_seed = [
            "airports",
            "sectors",
            "aircraft",
            "crew",
            "missions",
            "mission_crew",
            "maintenance_records",
            "weather_conditions",
            "airspace_restrictions",
            "simulation_events",
            "optimization_runs",
            "recommendations",
            "events",
        ]

        for table in tables_to_seed:
            pattern = rf"INSERT\s+INTO\s+{table}\b"
            match = re.search(pattern, self.seed_sql, re.IGNORECASE)
            self.assertIsNotNone(match, f"No INSERT statement found for table '{table}' in seed.sql")

    def test_rls_hardening_migration(self):
        """Verify the pre-production RLS hardening migration file restricts operational tables."""
        hardening_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "supabase", "migrations", "20261010000000_harden_rls_policies.sql"
        )
        self.assertTrue(os.path.exists(hardening_path), f"Hardening migration not found at {hardening_path}")
        with open(hardening_path, "r", encoding="utf-8") as f:
            sql = f.read()

        restricted_tables = [
            "aircraft",
            "crew",
            "mission_crew",
            "missions",
            "maintenance_records",
            "simulation_events",
            "optimization_runs",
            "recommendations",
            "ai_analysis",
        ]

        for table in restricted_tables:
            # Check revoke from anon
            self.assertIn(f"REVOKE SELECT ON TABLE {table} FROM anon;", sql)
            # Check grant to authenticated
            self.assertIn(f"GRANT SELECT ON TABLE {table} TO authenticated;", sql)
            # Check policy restricts to authenticated role
            pattern = rf'CREATE\s+POLICY\s+"Authenticated read-only access for {table}"\s+ON\s+{table}\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s+\(true\);'
            self.assertIsNotNone(re.search(pattern, sql, re.IGNORECASE), f"Hardened policy missing for {table}")

        # Check that environmental & public tables retain grants
        public_tables = ["airports", "sectors", "weather_conditions", "airspace_restrictions", "events"]
        for table in public_tables:
            self.assertIn(f"GRANT SELECT ON TABLE {table} TO anon, authenticated;", sql)

        # Check mutation revoke from clients
        self.assertIn("REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;", sql)
        self.assertIn("GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;", sql)

    def test_migration_drops_all_previous_permissive_policies(self):
        """Verify the migration explicitly drops previous permissive SELECT policies."""
        hardening_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "supabase", "migrations", "20261010000000_harden_rls_policies.sql"
        )
        with open(hardening_path, "r", encoding="utf-8") as f:
            sql = f.read()

        restricted_tables = [
            "aircraft",
            "crew",
            "mission_crew",
            "missions",
            "maintenance_records",
            "simulation_events",
            "optimization_runs",
            "recommendations",
            "ai_analysis",
        ]

        for table in restricted_tables:
            drop_pattern = rf'DROP\s+POLICY\s+IF\s+EXISTS\s+"Public read-only access for {table}"\s+ON\s+{table};'
            self.assertIsNotNone(re.search(drop_pattern, sql, re.IGNORECASE), f"Missing drop policy for {table}")

    def test_migration_is_non_destructive(self):
        """Verify that the migration contains no destructive table or column drops or truncations."""
        hardening_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "supabase", "migrations", "20261010000000_harden_rls_policies.sql"
        )
        with open(hardening_path, "r", encoding="utf-8") as f:
            sql = f.read()

        destructive_patterns = [
            r"\bDROP\s+TABLE\b",
            r"\bTRUNCATE\b",
            r"\bDROP\s+COLUMN\b",
            r"\bDELETE\s+FROM\b",
        ]

        for pattern in destructive_patterns:
            self.assertIsNone(
                re.search(pattern, sql, re.IGNORECASE),
                f"Destructive pattern '{pattern}' found in hardening migration",
            )



if __name__ == "__main__":
    unittest.main()
