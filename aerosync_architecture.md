# AEROSYNC — Architecture Document

> Intelligence for Dynamic Air Operations

---

## 1. Environment Summary

| Tool | Version |
|------|---------|
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Python | 3.14.6 |
| pip | 26.1.2 |
| Git | 2.45.1 |
| OS | Windows |

Workspace: `c:\Users\KRISHNAJITH\Documents\SIH\2nd` — empty, clean start.

---

## 2. Repository Structure

```
aerosync/
├── frontend/                          # Next.js + TypeScript
│   ├── public/
│   │   └── fonts/
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Redirect → /dashboard
│   │   │   ├── globals.css
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── fleet/
│   │   │   │   └── page.tsx
│   │   │   ├── crew/
│   │   │   │   └── page.tsx
│   │   │   ├── missions/
│   │   │   │   └── page.tsx
│   │   │   ├── environment/
│   │   │   │   └── page.tsx
│   │   │   ├── optimization/
│   │   │   │   └── page.tsx
│   │   │   ├── simulation/
│   │   │   │   └── page.tsx
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui primitives
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── topbar.tsx
│   │   │   │   └── shell.tsx          # sidebar + topbar + main area
│   │   │   ├── dashboard/
│   │   │   │   ├── kpi-cards.tsx
│   │   │   │   ├── alert-banner.tsx
│   │   │   │   ├── situation-panel.tsx
│   │   │   │   ├── resource-readiness.tsx
│   │   │   │   ├── active-missions.tsx
│   │   │   │   └── recent-events.tsx
│   │   │   ├── map/
│   │   │   │   ├── operational-map.tsx
│   │   │   │   ├── map-layers.tsx
│   │   │   │   └── map-controls.tsx
│   │   │   ├── simulation/
│   │   │   │   ├── scenario-picker.tsx
│   │   │   │   ├── before-after.tsx
│   │   │   │   └── simulation-timeline.tsx
│   │   │   └── shared/
│   │   │       ├── status-badge.tsx
│   │   │       ├── data-table.tsx
│   │   │       └── loading-skeleton.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                 # Typed fetch wrapper
│   │   │   ├── supabase.ts            # Supabase client
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── use-aircraft.ts
│   │   │   ├── use-crew.ts
│   │   │   ├── use-missions.ts
│   │   │   ├── use-environment.ts
│   │   │   └── use-simulation.ts
│   │   └── types/
│   │       ├── aircraft.ts
│   │       ├── crew.ts
│   │       ├── mission.ts
│   │       ├── environment.ts
│   │       ├── optimization.ts
│   │       └── simulation.ts
│   ├── components.json               # shadcn config
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── package.json
│
├── backend/                           # Python FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── config.py                  # Settings / env vars
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── aircraft.py
│   │   │   ├── crew.py
│   │   │   ├── missions.py
│   │   │   ├── environment.py
│   │   │   ├── readiness.py
│   │   │   ├── events.py
│   │   │   ├── simulation.py
│   │   │   ├── optimization.py
│   │   │   └── ai.py
│   │   ├── models/                    # Pydantic models
│   │   │   ├── __init__.py
│   │   │   ├── aircraft.py
│   │   │   ├── crew.py
│   │   │   ├── mission.py
│   │   │   ├── environment.py
│   │   │   ├── optimization.py
│   │   │   ├── simulation.py
│   │   │   └── ai.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── aircraft_service.py
│   │   │   ├── crew_service.py
│   │   │   ├── mission_service.py
│   │   │   ├── environment_service.py
│   │   │   ├── readiness_service.py
│   │   │   ├── simulation_service.py
│   │   │   ├── optimization_service.py # OR-Tools solver
│   │   │   └── ai_service.py          # Gemini wrapper
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── supabase.py            # Supabase client
│   │   │   └── seed.py                # Seed data script
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   ├── tests/
│   │   ├── test_aircraft.py
│   │   ├── test_optimization.py
│   │   └── test_simulation.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
│
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── README.md
└── docker-compose.yml                 # Local dev (optional)
```

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- ============================================================
-- AIRPORTS / BASES
-- ============================================================
CREATE TABLE airports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(10) UNIQUE NOT NULL,       -- e.g. "SYN-ALPHA"
    name            VARCHAR(120) NOT NULL,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    elevation_ft    INTEGER,
    runway_length_m INTEGER,
    status          VARCHAR(20) DEFAULT 'operational',  -- operational | degraded | closed
    region          VARCHAR(60),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AIRCRAFT
-- ============================================================
CREATE TABLE aircraft (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tail_number     VARCHAR(20) UNIQUE NOT NULL,        -- e.g. "AS-H201"
    type            VARCHAR(60) NOT NULL,                -- e.g. "Medium Helicopter"
    model           VARCHAR(60) NOT NULL,                -- e.g. "AW139"
    role            VARCHAR(40) NOT NULL,                -- transport | medevac | SAR | utility | trainer
    base_airport_id UUID REFERENCES airports(id),
    status          VARCHAR(20) DEFAULT 'available',     -- available | in-mission | maintenance | grounded
    max_range_km    INTEGER,
    max_payload_kg  INTEGER,
    max_passengers  INTEGER,
    fuel_hours      NUMERIC(4,1),
    last_maintenance TIMESTAMPTZ,
    next_maintenance TIMESTAMPTZ,
    flight_hours    NUMERIC(8,1) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CREW
-- ============================================================
CREATE TABLE crew (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(20) UNIQUE NOT NULL,         -- e.g. "CRW-0042"
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(40) NOT NULL,                 -- pilot | co-pilot | flight-engineer |
                                                          -- medic | loadmaster | observer
    rank            VARCHAR(30),
    qualifications  TEXT[],                               -- e.g. {"IFR","NVG","SAR-cert","mountain"}
    base_airport_id UUID REFERENCES airports(id),
    status          VARCHAR(20) DEFAULT 'available',      -- available | on-mission | off-duty | medical
    max_duty_hours  NUMERIC(4,1) DEFAULT 12,
    current_duty_hours NUMERIC(4,1) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- OPERATIONAL SECTORS
-- ============================================================
CREATE TABLE sectors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(60) NOT NULL,                -- "Sector A", "Sector B"
    description     TEXT,
    boundary        JSONB NOT NULL,                      -- GeoJSON polygon
    status          VARCHAR(20) DEFAULT 'active',        -- active | restricted | closed
    risk_level      VARCHAR(10) DEFAULT 'low',           -- low | medium | high | critical
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MISSIONS / TASKS
-- ============================================================
CREATE TABLE missions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20) UNIQUE NOT NULL,         -- "MSN-2024-0042"
    title           VARCHAR(200) NOT NULL,
    type            VARCHAR(40) NOT NULL,                -- transport | medevac | SAR | training
                                                         -- | relief | standby | recon
    priority        VARCHAR(10) NOT NULL,                -- critical | high | medium | low
    status          VARCHAR(20) DEFAULT 'scheduled',     -- scheduled | active | completed | cancelled
                                                         -- | reassigned
    origin_airport_id    UUID REFERENCES airports(id),
    destination_airport_id UUID REFERENCES airports(id),
    sector_id       UUID REFERENCES sectors(id),
    assigned_aircraft_id UUID REFERENCES aircraft(id),
    required_aircraft_type VARCHAR(60),
    required_crew_roles  JSONB,                          -- e.g. {"pilot":1,"medic":1}
    passenger_count INTEGER DEFAULT 0,
    cargo_kg        NUMERIC(8,1) DEFAULT 0,
    scheduled_start TIMESTAMPTZ,
    scheduled_end   TIMESTAMPTZ,
    actual_start    TIMESTAMPTZ,
    actual_end      TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MISSION ↔ CREW (many-to-many)
-- ============================================================
CREATE TABLE mission_crew (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id      UUID REFERENCES missions(id) ON DELETE CASCADE,
    crew_id         UUID REFERENCES crew(id) ON DELETE CASCADE,
    role_on_mission VARCHAR(40),
    UNIQUE(mission_id, crew_id)
);

-- ============================================================
-- MAINTENANCE RECORDS
-- ============================================================
CREATE TABLE maintenance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id     UUID REFERENCES aircraft(id) ON DELETE CASCADE,
    type            VARCHAR(40) NOT NULL,                -- scheduled | unscheduled | inspection
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'scheduled',     -- scheduled | in-progress | completed | delayed
    scheduled_start TIMESTAMPTZ,
    scheduled_end   TIMESTAMPTZ,
    actual_end      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WEATHER CONDITIONS
-- ============================================================
CREATE TABLE weather (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region          VARCHAR(60) NOT NULL,
    sector_id       UUID REFERENCES sectors(id),
    airport_id      UUID REFERENCES airports(id),
    condition       VARCHAR(40) NOT NULL,                -- clear | cloudy | rain | heavy-rain
                                                         -- | thunderstorm | fog | snow
    visibility_km   NUMERIC(5,1),
    wind_speed_kts  INTEGER,
    wind_direction  INTEGER,                             -- degrees
    ceiling_ft      INTEGER,
    temperature_c   NUMERIC(4,1),
    is_vfr          BOOLEAN DEFAULT true,
    severity        VARCHAR(10) DEFAULT 'none',          -- none | moderate | severe
    valid_from      TIMESTAMPTZ DEFAULT now(),
    valid_until     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AIRSPACE RESTRICTIONS
-- ============================================================
CREATE TABLE airspace_restrictions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    type            VARCHAR(40) NOT NULL,                -- TFR | NOTAM | exercise | emergency
    boundary        JSONB,                               -- GeoJSON polygon
    sector_id       UUID REFERENCES sectors(id),
    altitude_min_ft INTEGER,
    altitude_max_ft INTEGER,
    active_from     TIMESTAMPTZ,
    active_until    TIMESTAMPTZ,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'active',        -- active | expired | cancelled
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SIMULATION EVENTS
-- ============================================================
CREATE TABLE simulation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_type   VARCHAR(40) NOT NULL,                -- weather | aircraft_unavailable | crew_unavailable
                                                         -- | airspace_restriction | new_task | maintenance_delay
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    parameters      JSONB NOT NULL,                      -- scenario-specific params
    state_before    JSONB,                               -- snapshot
    state_after     JSONB,                               -- snapshot after optimization
    optimization_result JSONB,                           -- full optimizer output
    ai_summary      TEXT,                                -- Gemini explanation
    status          VARCHAR(20) DEFAULT 'pending',       -- pending | processing | completed | failed
    triggered_at    TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SYSTEM EVENTS LOG
-- ============================================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(40) NOT NULL,                -- info | warning | critical | optimization | simulation
    category        VARCHAR(40),                         -- weather | fleet | crew | mission | system
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
-- ... (applied to every table)

-- For this prototype: allow authenticated read/write
CREATE POLICY "Authenticated users can read all" ON airports
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can modify all" ON airports
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Same pattern for all tables.
-- In production, role-based policies would restrict write access.
```

---

## 4. API Contracts

### 4.1 Resource Endpoints

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/api/aircraft` | List all aircraft (filter by status, base, type) | `Aircraft[]` |
| `GET` | `/api/aircraft/{id}` | Single aircraft detail | `Aircraft` |
| `GET` | `/api/crew` | List all crew (filter by status, role, base) | `Crew[]` |
| `GET` | `/api/crew/{id}` | Single crew detail | `Crew` |
| `GET` | `/api/missions` | List missions (filter by status, priority, type) | `Mission[]` |
| `GET` | `/api/missions/{id}` | Single mission detail | `Mission` |
| `GET` | `/api/environment` | Current weather + restrictions | `EnvironmentState` |
| `GET` | `/api/airports` | All airports | `Airport[]` |
| `GET` | `/api/sectors` | All sectors | `Sector[]` |
| `GET` | `/api/readiness` | Aggregated readiness KPIs | `ReadinessReport` |
| `GET` | `/api/events` | System events log (paginated) | `Event[]` |

### 4.2 Simulation Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/simulation/events` | Trigger a simulation scenario |
| `GET`  | `/api/simulation/events` | List past simulation events |
| `GET`  | `/api/simulation/events/{id}` | Get simulation event with before/after |

**Request body for `POST /api/simulation/events`:**
```json
{
  "scenario_type": "weather_deterioration",
  "parameters": {
    "sector_id": "uuid",
    "severity": "severe",
    "visibility_km": 1.2,
    "duration_hours": 3
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "scenario_type": "weather_deterioration",
  "title": "Weather deterioration in Sector B",
  "state_before": { "aircraft_available": 18, "readiness": 0.87, ... },
  "state_after": { "aircraft_available": 14, "readiness": 0.72, ... },
  "optimization_result": {
    "status": "optimal",
    "reallocations": [...],
    "affected_missions": [...],
    "constraint_violations_avoided": [...],
    "utilization": 0.78
  },
  "ai_summary": "Weather deterioration detected near Sector B...",
  "status": "completed"
}
```

### 4.3 Optimization Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/optimization/run` | Run optimizer with current or modified state |
| `GET`  | `/api/optimization/history` | Past optimization runs |

**Request body for `POST /api/optimization/run`:**
```json
{
  "constraints_override": {              // optional overrides
    "excluded_aircraft": ["uuid"],
    "excluded_sectors": ["uuid"],
    "excluded_crew": ["uuid"]
  },
  "objective": "maximize_readiness"      // maximize_readiness | minimize_cost | balance
}
```

**Response:**
```json
{
  "status": "optimal",                   // optimal | feasible | infeasible
  "objective_value": 0.87,
  "allocations": [
    {
      "mission_id": "uuid",
      "aircraft_id": "uuid",
      "crew_ids": ["uuid"],
      "origin": "uuid",
      "destination": "uuid",
      "reasoning_metadata": { ... }
    }
  ],
  "unassigned_missions": ["uuid"],
  "constraint_violations_avoided": [
    "Aircraft AS-H205 excluded due to maintenance",
    "Crew CRW-0012 exceeded duty hours"
  ],
  "resource_utilization": {
    "aircraft": 0.82,
    "crew": 0.76
  },
  "solve_time_ms": 42
}
```

### 4.4 AI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/analyze` | Generate situation analysis from current state |
| `POST` | `/api/ai/chat` | Chat with context about operational state |

**Request body for `POST /api/ai/chat`:**
```json
{
  "message": "Why did the recommendation change?",
  "context": {
    "include_readiness": true,
    "include_recent_events": true,
    "simulation_event_id": "uuid"        // optional
  }
}
```

**Response:**
```json
{
  "response": "The recommendation changed because...",
  "sources": ["readiness_data", "simulation_event_xyz"]
}
```

---

## 5. Optimization Model (OR-Tools)

### 5.1 Decision Variables

For each `(mission, aircraft, crew_team)` combination:

```
x[m, a] ∈ {0, 1}    — whether aircraft `a` is assigned to mission `m`
y[m, c] ∈ {0, 1}    — whether crew member `c` is assigned to mission `m`
```

### 5.2 Objective Function

```
Maximize:
  Σ (priority_weight[m] × x[m, a])                          — fulfil high-priority missions
  + α × Σ (readiness_score)                                  — maintain overall readiness
  - β × Σ (reassignment_penalty)                             — minimize disruption
```

### 5.3 Constraints

| # | Constraint | Expression |
|---|-----------|-----------|
| C1 | **One aircraft per mission** | Σ_a x[m, a] ≤ 1 for each mission m |
| C2 | **Aircraft availability** | x[m, a] = 0 if aircraft a status ≠ available |
| C3 | **Aircraft at one mission at a time** | Σ_m x[m, a] ≤ 1 (for overlapping time windows) |
| C4 | **Aircraft type match** | x[m, a] = 0 if aircraft a type ∉ mission m required types |
| C5 | **Payload capacity** | cargo_kg[m] ≤ max_payload_kg[a] × x[m, a] |
| C6 | **Passenger capacity** | passenger_count[m] ≤ max_passengers[a] × x[m, a] |
| C7 | **Range feasibility** | route_distance[m] ≤ max_range_km[a] × x[m, a] |
| C8 | **Crew qualification** | For each required role in m, at least one assigned crew has that qualification |
| C9 | **Crew availability** | y[m, c] = 0 if crew c status ≠ available |
| C10 | **Crew duty hours** | current_duty_hours[c] + mission_duration[m] × y[m, c] ≤ max_duty_hours[c] |
| C11 | **Crew single assignment** | Σ_m y[m, c] ≤ 1 (for overlapping time windows) |
| C12 | **Weather restriction** | x[m, a] = 0 if mission m sector has severe weather and aircraft a cannot operate |
| C13 | **Airspace restriction** | x[m, a] = 0 if mission m route intersects active restriction |
| C14 | **Airport availability** | x[m, a] = 0 if origin or destination airport is closed |
| C15 | **Maintenance window** | x[m, a] = 0 if mission m overlaps aircraft a maintenance window |

### 5.4 Implementation Approach

- Use `ortools.sat.python.cp_model` (CP-SAT solver) for boolean decision variables
- Priority weights: `critical=100, high=50, medium=20, low=5`
- Solver time limit: 5 seconds (prototype)
- Return all allocations + unassigned missions + explanation metadata

---

## 6. Frontend Route Structure

| Route | Page | Description |
|-------|------|-------------|
| `/` | Redirect | → `/dashboard` |
| `/dashboard` | Dashboard | KPIs, map, situation panel, events |
| `/fleet` | Fleet Management | Aircraft table, status, maintenance schedule |
| `/crew` | Personnel & Crew | Crew table, qualifications, duty status |
| `/missions` | Missions & Tasks | Mission table, timeline, assignments |
| `/environment` | Environment | Weather map, restrictions, sector status |
| `/optimization` | Optimization | Run optimizer, view results, history |
| `/simulation` | Simulation Center | Scenario picker, before/after, timeline |
| `/reports` | Reports & Analytics | Charts, readiness trends, utilization |

All pages share:
- `Shell` layout (sidebar + topbar + content area)
- Same design tokens
- Responsive but optimized for 16:9 desktop/projector

---

## 7. Design System

### 7.1 Tailwind Theme Extension

```ts
// tailwind.config.ts — theme.extend
{
  colors: {
    background: '#FAFAFC',
    surface: '#FFFFFF',
    primary: {
      DEFAULT: '#8B7CF6',
      light: '#A99FF8',
      soft: '#F3F0FF',
      'very-soft': '#F8F7FF',
    },
    foreground: '#1E1B2E',
    muted: '#77738A',
    border: '#EAE7F2',
    success: '#16A34A',
    warning: '#D97706',
    critical: '#DC2626',
  },
  borderRadius: {
    DEFAULT: '12px',
    lg: '14px',
    md: '10px',
    sm: '8px',
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  boxShadow: {
    card: '0 1px 3px rgba(30, 27, 46, 0.04), 0 1px 2px rgba(30, 27, 46, 0.02)',
    elevated: '0 4px 12px rgba(30, 27, 46, 0.06)',
  },
}
```

### 7.2 Component Design Principles

- **Cards**: White background, `border` color border (1px), `shadow-card`, `rounded-[12px]`, padding `20-24px`
- **Buttons primary**: `bg-primary` with white text, subtle hover darken
- **Buttons secondary**: `border` with `foreground` text
- **Status badges**: Small pills — green/amber/red/neutral background at 10% opacity + matching text
- **Tables**: Clean, no zebra striping, thin bottom borders, hover highlight
- **Sidebar**: White background, fixed 260px, thin right border, active item gets `primary-soft` background + `primary` text
- **TopBar**: White background, thin bottom border, 56px height
- **Map container**: Rounded corners, thin border, fills available space
- **Typography scale**: 13px body, 12px secondary, 11px caption, 24px page title, 14px section title
- **Spacing**: 8px base grid
- **Transitions**: 150ms ease-out for all interactive elements
- **Purple accent usage**: ~5-10% — active sidebar, primary buttons, selected states, KPI accents, AI panel header

---

## 8. Simulation Architecture

### 8.1 Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API as FastAPI
    participant Sim as SimulationService
    participant Opt as OptimizationService (OR-Tools)
    participant AI as AIService (Gemini)
    participant DB as Supabase

    User->>Frontend: Select scenario + parameters
    Frontend->>API: POST /api/simulation/events
    API->>Sim: process_scenario(type, params)
    
    Sim->>DB: Snapshot current state (state_before)
    Sim->>DB: Apply state mutations (e.g. degrade weather)
    Sim->>Sim: Identify affected resources & missions
    Sim->>Opt: run_optimization(modified_state)
    Opt->>Opt: Build CP-SAT model, solve
    Opt-->>Sim: OptimizationResult
    Sim->>DB: Snapshot new state (state_after)
    Sim->>AI: explain(state_before, event, state_after, opt_result)
    AI-->>Sim: Natural language summary
    Sim->>DB: Store simulation_event record
    Sim-->>API: SimulationEventResponse
    API-->>Frontend: JSON response
    Frontend->>Frontend: Render Before → Event → After
```

### 8.2 Scenario Definitions

| Scenario | State Mutation | Affected Resources |
|----------|---------------|-------------------|
| **Weather deterioration** | Update `weather` table for target sector; set severity = severe | Aircraft in sector, missions through sector |
| **Aircraft unavailable** | Set aircraft status = grounded | Missions assigned to that aircraft |
| **Crew unavailable** | Set crew status = medical/off-duty | Missions assigned to that crew member |
| **Airspace restriction** | Insert `airspace_restrictions` record | Missions routing through restricted area |
| **New high-priority task** | Insert new `missions` record with priority = critical | Forces re-optimization of all allocations |
| **Maintenance delay** | Update `maintenance` record; extend end date; set aircraft = maintenance | Missions assigned to that aircraft |

### 8.3 State Snapshots

Each simulation captures a `state_before` and `state_after` JSON object:

```json
{
  "aircraft_total": 22,
  "aircraft_available": 18,
  "crew_total": 29,
  "crew_available": 24,
  "missions_active": 12,
  "readiness": 0.87,
  "affected_aircraft": [],
  "affected_crew": [],
  "affected_missions": [],
  "allocations": [...]
}
```

---

## 9. Synthetic Data Overview

### Airports (5)

| Code | Name | Region | Coordinates (approx) |
|------|------|--------|----------------------|
| SYN-ALPHA | Alpha Air Station | Northern Highlands | 28.6°N, 77.2°E |
| SYN-BRAVO | Bravo Forward Base | Coastal Region | 19.1°N, 72.9°E |
| SYN-CHARLIE | Charlie Regional Hub | Central Plains | 22.7°N, 75.9°E |
| SYN-DELTA | Delta Relief Camp | Eastern Delta | 22.5°N, 88.4°E |
| SYN-ECHO | Echo Mountain Post | Western Range | 30.7°N, 76.8°E |

### Aircraft (22) — Mix of:
- Medium Helicopters (AW139-type) × 8 — medevac, SAR, transport
- Heavy Transport Helicopters (Chinook-type) × 4 — relief cargo
- Light Utility Helicopters (Bell 407-type) × 6 — recon, training
- Fixed-wing Transports (C-295-type) × 4 — long-range transport

### Crew (30+) — Mix of:
- Pilots (12), Co-Pilots (6), Flight Engineers (4), Medics (4), Loadmasters (2), Observers (2)
- Various qualifications: IFR, NVG, SAR-certified, mountain, overwater, etc.

### Sectors (6):
- Sector A — Northern Highlands (active)
- Sector B — Coastal Zone (active, weather-prone)
- Sector C — Central Corridor (active)
- Sector D — Eastern Delta (active, flood-prone)
- Sector E — Western Mountains (restricted access)
- Sector F — Southern Training Zone (training only)

### Missions (15+):
- Mix of transport, medevac, SAR, training, relief, standby
- Various priorities (critical through low)
- Spread across sectors and airports

---

## 10. Implementation Phases

| Phase | Scope | Key Deliverables |
|-------|-------|-----------------|
| **1** | Foundation | Next.js project, Tailwind config, design tokens, Shell layout, sidebar, topbar |
| **2** | Database | Supabase schema migration, seed data script, RLS policies |
| **3** | Backend | FastAPI project, all routers, Pydantic models, services (no optimizer/AI yet) |
| **4** | Dashboard UI | KPI cards, alert banner, situation panel, resource readiness, active missions, events |
| **5** | Map | MapLibre GL integration, airports, sectors, routes, weather overlay |
| **6** | Simulation | Scenario picker UI, before/after view, simulation service, state mutation logic |
| **7** | Optimization | OR-Tools CP-SAT model, optimization service, optimization page UI |
| **8** | AI | Gemini integration, situation analysis, chat, explanation generation |
| **9** | Remaining Pages | Fleet, Crew, Missions, Environment, Reports pages with full data |
| **10** | Polish & Deploy | Testing, security audit, Vercel + Render/Railway deployment |

---

> [!IMPORTANT]
> This architecture is ready for your review. No code has been generated yet. Please review the repository structure, database schema, API contracts, optimization model, and design system. Let me know if you'd like any changes before I begin Phase 1 implementation.
