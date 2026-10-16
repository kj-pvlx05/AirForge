-- =============================================================================
-- AEROSYNC — Intelligence for Dynamic Air Operations
-- Migration: 20261010000000_harden_rls_policies.sql
-- Description: Pre-production security hardening for Row Level Security (RLS).
-- Security Philosophy:
--   1. Non-sensitive environmental and facility data remain public for visualization
--      (airports, sectors, weather_conditions, airspace_restrictions, events).
--   2. Operational assets, crew PII, mission itineraries, solver runs, and AI records
--      are restricted strictly to authenticated operators.
--   3. Anonymous clients (anon role) are REVOKED from querying operational tables.
--   4. Direct client mutations (INSERT, UPDATE, DELETE) remain completely REVOKED.
--   5. Backend server-side service_role retains authoritative mutation access.
-- =============================================================================

-- =============================================================================
-- 1. HARDEN OPERATIONAL ASSETS & FLEET DATA (aircraft)
-- =============================================================================
DROP POLICY IF EXISTS "Public read-only access for aircraft" ON aircraft;
REVOKE SELECT ON TABLE aircraft FROM anon;
GRANT SELECT ON TABLE aircraft TO authenticated;
CREATE POLICY "Authenticated read-only access for aircraft"
    ON aircraft FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 2. HARDEN CREW & PERSONNEL ROSTERS (crew, mission_crew)
-- =============================================================================
DROP POLICY IF EXISTS "Public read-only access for crew" ON crew;
REVOKE SELECT ON TABLE crew FROM anon;
GRANT SELECT ON TABLE crew TO authenticated;
CREATE POLICY "Authenticated read-only access for crew"
    ON crew FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Public read-only access for mission_crew" ON mission_crew;
REVOKE SELECT ON TABLE mission_crew FROM anon;
GRANT SELECT ON TABLE mission_crew TO authenticated;
CREATE POLICY "Authenticated read-only access for mission_crew"
    ON mission_crew FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 3. HARDEN MISSION ITINERARIES & AIRFRAME ALLOCATIONS (missions)
-- =============================================================================
DROP POLICY IF EXISTS "Public read-only access for missions" ON missions;
REVOKE SELECT ON TABLE missions FROM anon;
GRANT SELECT ON TABLE missions TO authenticated;
CREATE POLICY "Authenticated read-only access for missions"
    ON missions FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 4. HARDEN AIRFRAME MAINTENANCE DEFICIENCY LOGS (maintenance_records)
-- =============================================================================
DROP POLICY IF EXISTS "Public read-only access for maintenance_records" ON maintenance_records;
REVOKE SELECT ON TABLE maintenance_records FROM anon;
GRANT SELECT ON TABLE maintenance_records TO authenticated;
CREATE POLICY "Authenticated read-only access for maintenance_records"
    ON maintenance_records FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 5. HARDEN SIMULATION DISRUPTION HISTORY (simulation_events)
-- =============================================================================
DROP POLICY IF EXISTS "Public read-only access for simulation_events" ON simulation_events;
REVOKE SELECT ON TABLE simulation_events FROM anon;
GRANT SELECT ON TABLE simulation_events TO authenticated;
CREATE POLICY "Authenticated read-only access for simulation_events"
    ON simulation_events FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 6. HARDEN OPTIMIZATION SOLVER RUNS & RECOMMENDATIONS
-- =============================================================================
DROP POLICY IF EXISTS "Public read-only access for optimization_runs" ON optimization_runs;
REVOKE SELECT ON TABLE optimization_runs FROM anon;
GRANT SELECT ON TABLE optimization_runs TO authenticated;
CREATE POLICY "Authenticated read-only access for optimization_runs"
    ON optimization_runs FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Public read-only access for recommendations" ON recommendations;
REVOKE SELECT ON TABLE recommendations FROM anon;
GRANT SELECT ON TABLE recommendations TO authenticated;
CREATE POLICY "Authenticated read-only access for recommendations"
    ON recommendations FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 7. HARDEN AI SITUATION ANALYSIS & DECISION SUPPORT BRIEFS (ai_analysis)
-- =============================================================================
DROP POLICY IF EXISTS "Public read-only access for ai_analysis" ON ai_analysis;
REVOKE SELECT ON TABLE ai_analysis FROM anon;
GRANT SELECT ON TABLE ai_analysis TO authenticated;
CREATE POLICY "Authenticated read-only access for ai_analysis"
    ON ai_analysis FOR SELECT
    TO authenticated
    USING (true);

-- =============================================================================
-- 8. PRESERVE PUBLIC ENVIRONMENTAL & FACILITY READ POLICIES
-- =============================================================================
-- airports, sectors, weather_conditions, airspace_restrictions, events
-- These remain accessible to anon and authenticated clients for map/situational display.
GRANT SELECT ON TABLE airports TO anon, authenticated;
GRANT SELECT ON TABLE sectors TO anon, authenticated;
GRANT SELECT ON TABLE weather_conditions TO anon, authenticated;
GRANT SELECT ON TABLE airspace_restrictions TO anon, authenticated;
GRANT SELECT ON TABLE events TO anon, authenticated;

-- =============================================================================
-- 9. STRICT MUTATION BOUNDARY: PREVENT CLIENT-SIDE WRITE ACCESS
-- =============================================================================
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Ensure service_role retains full server-side administrative authority
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
