-- =============================================================================
-- AEROSYNC — Intelligence for Dynamic Air Operations
-- Migration: 20261005000000_initial_schema.sql
-- Description: Core schema for synthetic aviation operations decision support.
-- Security: Row Level Security enabled on all tables.
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. AIRPORTS / BASES (Fictional aviation facilities)
-- =============================================================================
CREATE TABLE IF NOT EXISTS airports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_ft INTEGER NOT NULL DEFAULT 0,
    runway_length_m INTEGER NOT NULL DEFAULT 1500,
    status VARCHAR(24) NOT NULL DEFAULT 'operational'
        CHECK (status IN ('operational', 'degraded', 'closed')),
    region VARCHAR(60) NOT NULL,
    fuel_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE airports IS 'Fictional air stations, relief staging hubs, and operational forward bases.';

-- =============================================================================
-- 2. OPERATIONAL SECTORS (Airspace sectors & geographic boundaries)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(80) NOT NULL,
    boundary JSONB NOT NULL, -- GeoJSON Polygon coordinates
    status VARCHAR(24) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'restricted', 'closed')),
    risk_level VARCHAR(16) NOT NULL DEFAULT 'low'
        CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sectors IS 'Operational sectors with GeoJSON boundaries, risk assessment, and active status.';

-- =============================================================================
-- 3. AIRCRAFT (Fictional non-combat fleet)
-- Models:
--   - AeroLift M1 (Medium utility helicopter)
--   - AeroLift H2 (Heavy transport helicopter)
--   - AeroTransport T1 (Fixed-wing transport)
--   - AeroUtility U1 (Light utility helicopter)
-- =============================================================================
CREATE TABLE IF NOT EXISTS aircraft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tail_number VARCHAR(24) UNIQUE NOT NULL,
    model VARCHAR(40) NOT NULL
        CHECK (model IN ('AeroLift M1', 'AeroLift H2', 'AeroTransport T1', 'AeroUtility U1')),
    type VARCHAR(60) NOT NULL
        CHECK (type IN ('Medium utility helicopter', 'Heavy transport helicopter', 'Fixed-wing transport', 'Light utility helicopter')),
    role VARCHAR(40) NOT NULL
        CHECK (role IN ('transport', 'medevac', 'search-and-rescue', 'disaster-relief', 'training', 'standby')),
    base_airport_id UUID REFERENCES airports(id) ON DELETE SET NULL,
    current_airport_id UUID REFERENCES airports(id) ON DELETE SET NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'in-mission', 'maintenance', 'grounded')),
    max_range_km INTEGER NOT NULL CHECK (max_range_km > 0),
    max_payload_kg INTEGER NOT NULL CHECK (max_payload_kg > 0),
    max_passengers INTEGER NOT NULL CHECK (max_passengers >= 0),
    cruise_speed_kmh INTEGER NOT NULL CHECK (cruise_speed_kmh > 0),
    fuel_capacity_liters INTEGER NOT NULL CHECK (fuel_capacity_liters > 0),
    fuel_level_percent INTEGER NOT NULL DEFAULT 100 CHECK (fuel_level_percent BETWEEN 0 AND 100),
    flight_hours NUMERIC(8,1) NOT NULL DEFAULT 0.0 CHECK (flight_hours >= 0.0),
    last_maintenance_date TIMESTAMPTZ,
    next_maintenance_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE aircraft IS 'Synthetic non-combat aircraft fleet with operational specifications and readiness telemetry.';

-- =============================================================================
-- 4. CREW (Flight & operational personnel)
-- =============================================================================
CREATE TABLE IF NOT EXISTS crew (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(24) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(40) NOT NULL
        CHECK (role IN ('pilot', 'co-pilot', 'flight-engineer', 'flight-medic', 'loadmaster', 'operations-observer')),
    rank VARCHAR(32) NOT NULL,
    base_airport_id UUID REFERENCES airports(id) ON DELETE SET NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'on-mission', 'off-duty', 'medical')),
    qualifications TEXT[] NOT NULL DEFAULT '{}',
    max_duty_hours NUMERIC(4,1) NOT NULL DEFAULT 12.0 CHECK (max_duty_hours > 0),
    current_duty_hours NUMERIC(4,1) NOT NULL DEFAULT 0.0 CHECK (current_duty_hours >= 0.0),
    rest_period_hours NUMERIC(4,1) NOT NULL DEFAULT 10.0 CHECK (rest_period_hours >= 0.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE crew IS 'Synthetic operational crew roster with roles, qualifications, and duty hour compliance.';

-- =============================================================================
-- 5. MISSIONS (Non-combat operational tasks)
-- =============================================================================
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(40) NOT NULL
        CHECK (type IN ('disaster-relief', 'medevac', 'transport', 'search-and-rescue', 'training', 'standby')),
    priority VARCHAR(16) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(24) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled', 'reassigned')),
    origin_airport_id UUID REFERENCES airports(id) ON DELETE RESTRICT,
    destination_airport_id UUID REFERENCES airports(id) ON DELETE RESTRICT,
    sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
    assigned_aircraft_id UUID REFERENCES aircraft(id) ON DELETE SET NULL,
    required_aircraft_model VARCHAR(40),
    required_crew_composition JSONB NOT NULL DEFAULT '{}',
    passenger_count INTEGER NOT NULL DEFAULT 0 CHECK (passenger_count >= 0),
    cargo_weight_kg NUMERIC(8,1) NOT NULL DEFAULT 0.0 CHECK (cargo_weight_kg >= 0.0),
    urgency_score INTEGER NOT NULL DEFAULT 50 CHECK (urgency_score BETWEEN 1 AND 100),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_schedule CHECK (scheduled_end >= scheduled_start)
);

COMMENT ON TABLE missions IS 'Operational tasks for humanitarian, medevac, relief, and search & rescue flights.';

-- =============================================================================
-- 6. MISSION CREW (Junction table: Crew assignment per mission)
-- =============================================================================
CREATE TABLE IF NOT EXISTS mission_crew (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    crew_id UUID NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
    role_on_mission VARCHAR(40) NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mission_id, crew_id)
);

COMMENT ON TABLE mission_crew IS 'Junction mapping crew members to assigned missions with specific operational roles.';

-- =============================================================================
-- 7. MAINTENANCE RECORDS (Aircraft maintenance tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL
        CHECK (type IN ('scheduled', 'unscheduled', 'avionics-check', 'airframe-inspection', 'engine-overhaul')),
    description TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'in-progress', 'completed', 'delayed')),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_end TIMESTAMPTZ,
    technician_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_maintenance_schedule CHECK (scheduled_end >= scheduled_start)
);

COMMENT ON TABLE maintenance_records IS 'Scheduled and unscheduled maintenance events that constrain aircraft availability.';

-- =============================================================================
-- 8. WEATHER CONDITIONS (Environmental sensor data & forecasts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS weather_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(60) NOT NULL,
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    airport_id UUID REFERENCES airports(id) ON DELETE CASCADE,
    condition VARCHAR(40) NOT NULL
        CHECK (condition IN ('clear', 'scattered-clouds', 'overcast', 'light-rain', 'heavy-rain', 'thunderstorm', 'fog')),
    severity VARCHAR(16) NOT NULL DEFAULT 'none'
        CHECK (severity IN ('none', 'moderate', 'severe')),
    visibility_km NUMERIC(5,2) NOT NULL CHECK (visibility_km >= 0.0),
    wind_speed_kts INTEGER NOT NULL CHECK (wind_speed_kts >= 0),
    wind_direction_deg INTEGER NOT NULL CHECK (wind_direction_deg BETWEEN 0 AND 360),
    ceiling_ft INTEGER NOT NULL CHECK (ceiling_ft >= 0),
    temperature_c NUMERIC(4,1) NOT NULL,
    is_vfr BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_weather_window CHECK (valid_until >= valid_from)
);

COMMENT ON TABLE weather_conditions IS 'Real-time and forecasted environmental conditions affecting flight safety and routing.';

-- =============================================================================
-- 9. AIRSPACE RESTRICTIONS (NOTAMs, safety corridors, hazard zones)
-- =============================================================================
CREATE TABLE IF NOT EXISTS airspace_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(140) NOT NULL,
    type VARCHAR(32) NOT NULL
        CHECK (type IN ('weather-hazard', 'relief-corridor', 'search-grid', 'civil-protection-zone')),
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    boundary JSONB, -- GeoJSON Polygon boundary
    altitude_floor_ft INTEGER NOT NULL DEFAULT 0 CHECK (altitude_floor_ft >= 0),
    altitude_ceiling_ft INTEGER NOT NULL DEFAULT 15000 CHECK (altitude_ceiling_ft >= altitude_floor_ft),
    status VARCHAR(24) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'pending', 'expired', 'lifted')),
    reason TEXT NOT NULL,
    active_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    active_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_restriction_window CHECK (active_until >= active_from)
);

COMMENT ON TABLE airspace_restrictions IS 'Airspace restrictions, temporary hazard buffers, and designated safety corridors.';

-- =============================================================================
-- 10. SIMULATION EVENTS (Scenarios: Before → Event → After snapshots)
-- =============================================================================
CREATE TABLE IF NOT EXISTS simulation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_type VARCHAR(40) NOT NULL
        CHECK (scenario_type IN ('weather_deterioration', 'aircraft_unavailable', 'crew_unavailable', 'airspace_restriction', 'new_high_priority_task', 'maintenance_delay')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    state_before JSONB NOT NULL DEFAULT '{}',
    state_after JSONB NOT NULL DEFAULT '{}',
    affected_aircraft_ids UUID[] NOT NULL DEFAULT '{}',
    affected_crew_ids UUID[] NOT NULL DEFAULT '{}',
    affected_mission_ids UUID[] NOT NULL DEFAULT '{}',
    status VARCHAR(24) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE simulation_events IS 'Simulation scenarios tracking full state before, parameter mutations, and state after.';

-- =============================================================================
-- 11. OPTIMIZATION RUNS (OR-Tools solver execution records)
-- =============================================================================
CREATE TABLE IF NOT EXISTS optimization_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_event_id UUID REFERENCES simulation_events(id) ON DELETE SET NULL,
    trigger_reason VARCHAR(60) NOT NULL,
    solver_status VARCHAR(32) NOT NULL
        CHECK (solver_status IN ('OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'MODEL_INVALID', 'UNKNOWN')),
    objective_value NUMERIC(10,4),
    solve_time_ms INTEGER NOT NULL DEFAULT 0 CHECK (solve_time_ms >= 0),
    total_missions INTEGER NOT NULL DEFAULT 0,
    assigned_missions INTEGER NOT NULL DEFAULT 0,
    unassigned_missions INTEGER NOT NULL DEFAULT 0,
    constraints_applied JSONB NOT NULL DEFAULT '[]',
    constraint_violations_avoided JSONB NOT NULL DEFAULT '[]',
    raw_result JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE optimization_runs IS 'Deterministic constraint optimization runs output by Google OR-Tools CP-SAT solver.';

-- =============================================================================
-- 12. RECOMMENDATIONS (Actionable proposals & AI explanations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optimization_run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    simulation_event_id UUID REFERENCES simulation_events(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    action_type VARCHAR(40) NOT NULL
        CHECK (action_type IN ('reallocate_aircraft', 'reroute_mission', 'standby_deployment', 'delay_task')),
    allocations JSONB NOT NULL DEFAULT '[]',
    impact_summary JSONB NOT NULL DEFAULT '{}',
    ai_explanation TEXT,
    status VARCHAR(24) NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review', 'approved', 'dismissed', 'applied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE recommendations IS 'Generated actionable recommendations with deterministic allocations and AI explanations.';

-- =============================================================================
-- 13. SYSTEM EVENTS LOG (Audit timeline & activity feed)
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(32) NOT NULL
        CHECK (type IN ('info', 'warning', 'critical', 'optimization', 'simulation')),
    category VARCHAR(32) NOT NULL
        CHECK (category IN ('weather', 'fleet', 'crew', 'mission', 'system')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE events IS 'System operational event log for timeline telemetry and operator notification feed.';

-- =============================================================================
-- INDEXES FOR HIGH-PERFORMANCE OPERATIONAL QUERIES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_airports_status ON airports(status);
CREATE INDEX IF NOT EXISTS idx_sectors_status ON sectors(status);

CREATE INDEX IF NOT EXISTS idx_aircraft_status ON aircraft(status);
CREATE INDEX IF NOT EXISTS idx_aircraft_model ON aircraft(model);
CREATE INDEX IF NOT EXISTS idx_aircraft_base ON aircraft(base_airport_id);

CREATE INDEX IF NOT EXISTS idx_crew_status ON crew(status);
CREATE INDEX IF NOT EXISTS idx_crew_role ON crew(role);
CREATE INDEX IF NOT EXISTS idx_crew_base ON crew(base_airport_id);

CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_priority ON missions(priority);
CREATE INDEX IF NOT EXISTS idx_missions_sector ON missions(sector_id);
CREATE INDEX IF NOT EXISTS idx_missions_assigned_aircraft ON missions(assigned_aircraft_id);
CREATE INDEX IF NOT EXISTS idx_missions_schedule ON missions(scheduled_start, scheduled_end);

CREATE INDEX IF NOT EXISTS idx_mission_crew_mission ON mission_crew(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_crew_crew ON mission_crew(crew_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_aircraft ON maintenance_records(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);

CREATE INDEX IF NOT EXISTS idx_weather_sector ON weather_conditions(sector_id);
CREATE INDEX IF NOT EXISTS idx_weather_airport ON weather_conditions(airport_id);
CREATE INDEX IF NOT EXISTS idx_weather_severity ON weather_conditions(severity);

CREATE INDEX IF NOT EXISTS idx_airspace_restrictions_sector ON airspace_restrictions(sector_id);
CREATE INDEX IF NOT EXISTS idx_airspace_restrictions_status ON airspace_restrictions(status);

CREATE INDEX IF NOT EXISTS idx_simulation_events_scenario ON simulation_events(scenario_type);
CREATE INDEX IF NOT EXISTS idx_simulation_events_created ON simulation_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_runs_created ON optimization_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_opt_run ON recommendations(optimization_run_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Security Philosophy:
--   1. RLS is ENABLED on every table.
--   2. Client/Anon/Authenticated access is strictly SELECT (read-only visualization).
--   3. NO direct client mutations (INSERT/UPDATE/DELETE).
--   4. The FastAPI backend connects using `service_role`, which bypasses RLS
--      and executes privileged, validated state mutations.
-- =============================================================================

ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE airspace_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Read-only policies for public/authenticated clients
CREATE POLICY "Public read-only access for airports"
    ON airports FOR SELECT USING (true);

CREATE POLICY "Public read-only access for sectors"
    ON sectors FOR SELECT USING (true);

CREATE POLICY "Public read-only access for aircraft"
    ON aircraft FOR SELECT USING (true);

CREATE POLICY "Public read-only access for crew"
    ON crew FOR SELECT USING (true);

CREATE POLICY "Public read-only access for missions"
    ON missions FOR SELECT USING (true);

CREATE POLICY "Public read-only access for mission_crew"
    ON mission_crew FOR SELECT USING (true);

CREATE POLICY "Public read-only access for maintenance_records"
    ON maintenance_records FOR SELECT USING (true);

CREATE POLICY "Public read-only access for weather_conditions"
    ON weather_conditions FOR SELECT USING (true);

CREATE POLICY "Public read-only access for airspace_restrictions"
    ON airspace_restrictions FOR SELECT USING (true);

CREATE POLICY "Public read-only access for simulation_events"
    ON simulation_events FOR SELECT USING (true);

CREATE POLICY "Public read-only access for optimization_runs"
    ON optimization_runs FOR SELECT USING (true);

CREATE POLICY "Public read-only access for recommendations"
    ON recommendations FOR SELECT USING (true);

CREATE POLICY "Public read-only access for events"
    ON events FOR SELECT USING (true);
