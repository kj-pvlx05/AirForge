# AEROSYNC — Intelligence for Dynamic Air Operations

[![Production Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success?style=flat&logo=vercel)](https://airops-systems.vercel.app)
[![Backend Engine](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Render-blue?style=flat&logo=fastapi)](https://airforge.onrender.com/docs)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%2015-emerald?style=flat&logo=supabase)](https://supabase.com)
[![Optimization](https://img.shields.io/badge/Solver-OR--Tools%20CP--SAT-violet?style=flat&logo=google)](https://developers.google.com/optimization)
[![AI Explanations](https://img.shields.io/badge/AI%20Layer-Gemini%20Flash-orange?style=flat&logo=google-gemini)](https://ai.google.dev/)

**AEROSYNC** is a high-reliability, decision-support platform designed to unify fragmented aviation operational data into a real-time Common Operating Picture (COP) and dynamically re-optimize fleet allocations when disruptions occur.

Built specifically for high-tempo, non-combat aviation operations:
- **Disaster Relief & Humanitarian Airdrops**
- **Medical Evacuation (MEDEVAC)**
- **Search & Rescue (SAR)**
- **Tactical Logistics & Transport**
- **Readiness & Standby Operations**

---

## Live Deployments

- **Live Application:** [https://airops-systems.vercel.app](https://airops-systems.vercel.app)
- **FastAPI Decision Engine:** [https://airforge.onrender.com](https://airforge.onrender.com)
- **API Documentation & Swagger:** [https://airforge.onrender.com/docs](https://airforge.onrender.com/docs)
- **Backend Health Endpoint:** [https://airforge.onrender.com/api/health](https://airforge.onrender.com/api/health)

---

## System Architecture

```text
┌────────────────────────────────────────────────────────┐
│             AEROSYNC Frontend (Next.js 16)             │
│        Light/Dark Calm Intelligence UI / MapLibre      │
│          Deployed on Vercel / Global Edge CDN          │
└───────────────────────────┬────────────────────────────┘
                            │ Same-Origin Rewrites (/api/*)
                            ▼
┌────────────────────────────────────────────────────────┐
│             AEROSYNC Backend (FastAPI / Py)            │
│  - Operator Auth Middleware (Bearer / X-API-Key)       │
│  - LifeCycle Startup Checks (/api/health, /api/ready)  │
│  - Non-root Container on Render                        │
└──────────────┬──────────────────┬──────────────────────┘
               │                  │
               ▼                  ▼
┌────────────────────────┐  ┌────────────────────────────┐
│ Supabase PostgreSQL 15 │  │ Google OR-Tools CP-SAT     │
│ - Core Aviation Schema │  │ - Deterministic Solver     │
│ - Simulation History   │  │ - Aircraft & Crew Matching │
│ - Optimization Runs    │  │ - Constrained Objective    │
│ - AI Analysis Cache    │  └────────────────────────────┘
│ - RLS & B-Tree Indexes │                 │
└────────────────────────┘                 ▼
                               ┌────────────────────────────┐
                               │ Gemini Flash (AI Layer)    │
                               │ - Natural Language Explan. │
                               │ - Situation Assessment     │
                               │ - Deterministic Fallback   │
                               └────────────────────────────┘
```

### Architectural Separation of Concerns
1. **Simulation Engine:** Injects weather squalls, airport closures, and airframe groundings deterministically into operational state.
2. **OR-Tools CP-SAT:** Resolves complex multi-commodity resource allocation problems mathematically with zero stochastic variation.
3. **Gemini Flash AI:** Translates solver decisions and constraint trade-offs into human-readable tactical explanations for dispatchers. Never assigns assets or overrides hard constraints.
4. **Supabase PostgreSQL:** Single source of truth with Row Level Security (RLS) enforcing read-only vs. operator write permissions.
5. **Next.js Rewrite Proxy:** Routes browser API requests through Vercel's edge network directly to Render, eliminating cross-origin preflight latency and CORS blocking.

---

## Key Capabilities

### 1. Unified Common Operating Picture (COP)
- Aggregates 5 operational stations, 22 airframes, 32 flight personnel, and active sorties.
- Real-time telemetry monitoring for fuel levels, flight hours, maintenance cycles, and crew duty limits.
- Composite readiness score dynamically computed from fleet availability, crew duty windows, and environmental hazards.

### 2. Deterministic Scenario Simulation
- Test operational resilience against convective storm squalls, runway closures, and emergency taskings.
- Inspect detailed **State Before → Injected Event → State After** transitions with foreign-key impact tracing.

### 3. Constraint-Based Optimization (OR-Tools CP-SAT)
- Automatically computes optimal aircraft and crew reassignments when flights are disrupted.
- Enforces strict aviation constraints: range limitations, payload capacities, required crew qualifications, and airport runway lengths.

### 4. Natural Language Decision Explanations (Gemini Flash)
- Generates transparent, human-readable rationales explaining *why* an airframe was reallocated or *why* a sortie was delayed.
- Includes a fully deterministic local fallback engine in the event of upstream AI rate limits.

### 5. Reviewer Demo Mode & Operational Personas
For rapid evaluation without live credentials, AEROSYNC features an isolated client-side Demo Mode backed by `localStorage` (zero mutation of production Supabase data) with four fictional reviewer identities:
- **Col. Marcus Vance** — Operations Commander (`VANGUARD-01`)
- **Maj. Elena Rostova** — Fleet Readiness Officer (`IRONCLAD-04`)
- **Capt. Liam Chen** — Chief Flight Dispatcher (`SKYWATCH-09`)
- **Dr. Sarah Jenkins** — Senior Airspace Safety Analyst (`AURA-02`)

---

## Application Navigation

The frontend includes 9 dedicated operational views within a unified command shell:

| Route | View | Description |
| :--- | :--- | :--- |
| `/dashboard` | **Operational Overview** | Fleet/crew readiness KPIs, interactive sector map, active weather alerts, and operational event log. |
| `/fleet` | **Fleet Management** | Complete airframe registry (22 aircraft), status filters, fuel levels, flight hours, and maintenance due dates. |
| `/crew` | **Personnel & Crew** | Duty hours, rest windows, rank hierarchy, qualifications (IFR, NVG, MEDEVAC), and base assignments. |
| `/missions` | **Missions & Sorties** | Task priorities (Critical, High, Medium), passenger/cargo loads, route assignments, and departure statuses. |
| `/environment` | **Weather & Airspace** | Sector wind speeds, visibility, METAR/TAF weather reports, and flight corridor restriction statuses. |
| `/optimization`| **Constraint Engine** | Automated solver execution, reallocation diff matrix, solve time benchmarks, and Gemini AI analysis. |
| `/simulation`  | **Simulation Center** | Interactive hazard injection, deterministic scenario runs, and state transition audit trail. |
| `/reports`     | **Reports & Analytics** | Historical mission completion metrics, airframe utilization curves, and readiness posture charts. |
| `/settings`    | **Settings & Configuration** | Fictional reviewer persona switcher, backend health diagnostics, theme settings, and session resets. |

---

## Design System: Calm Intelligence

AEROSYNC adheres to a **Calm Intelligence** design standard engineered for high-stress operational environments:
- **Palette**: Clean slate background (`#FAFAFC` / dark counterpart), pristine surface cards, subtle borders (`#EAE7F2`).
- **Accent Purple (`#8B7CF6`)**: Reserved strictly for intelligence insights, active solver recommendations, and tactical selections.
- **Semantic Color Coding**: Emerald (`#16A34A`) for mission-ready/nominal, Amber (`#D97706`) for advisory/maintenance, Rose (`#DC2626`) for critical/grounded.
- **Typography**: Inter for UI hierarchy and JetBrains Mono for telemetry numbers, callsigns, and coordinates.

---

## Project Structure

```text
├── frontend/                     # Next.js 16 + TypeScript + Tailwind CSS v4
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── (app)/            # Authenticated Command Shell
│   │   │   │   ├── dashboard/    # Primary Operations Overview
│   │   │   │   ├── fleet/        # Fleet Management & Airframe Telemetry
│   │   │   │   ├── crew/         # Personnel Qualifications & Rostering
│   │   │   │   ├── missions/     # Sorties, Tasks, & Priority Dispatch
│   │   │   │   ├── environment/  # Meteorology, METARs, & Corridor Hazards
│   │   │   │   ├── optimization/ # Constraint Solver & AI Explanations
│   │   │   │   ├── simulation/   # Scenario Injection & State Transition
│   │   │   │   ├── reports/      # Readiness Analytics & Utilization
│   │   │   │   └── settings/     # Personas, Connectivity, & Configuration
│   │   │   ├── layout.tsx        # Inter + JetBrains Mono root layout
│   │   │   ├── page.tsx          # Root redirect to /dashboard
│   │   │   └── globals.css       # Calm Intelligence CSS variables & design tokens
│   │   ├── components/           # Reusable UI primitives & layout shells
│   │   │   ├── dashboard/        # KPI cards, operational maps, feeds
│   │   │   ├── layout/           # Sidebar, Topbar with Persona switcher
│   │   │   └── ui/               # Tailored UI components
│   │   ├── lib/
│   │   │   ├── api/              # Typed API clients (Missions, Fleet, Sim, Opt)
│   │   │   ├── auth/             # Supabase Auth & JWT token manager
│   │   │   └── demo/             # Isolated synthetic store & reviewer personas
│   │   └── next.config.ts        # Next.js edge rewrites (/api/* -> backend)
│   └── package.json
│
├── backend/                      # Python FastAPI + OR-Tools + Pydantic
│   ├── app/
│   │   ├── routers/              # REST Endpoints (health, readiness, sim, opt)
│   │   ├── models/               # Domain Pydantic models & validation schemas
│   │   ├── services/             # Optimization (CP-SAT), Simulation, Gemini AI
│   │   ├── db/                   # Supabase client, repository layer, seed loader
│   │   ├── config.py             # Pydantic Settings & CORS configuration
│   │   └── main.py               # FastAPI application lifecycle & middleware
│   ├── tests/                    # Production readiness & unit tests
│   ├── Dockerfile                # Non-root production container
│   └── requirements.txt
│
├── supabase/                     # Supabase database configurations
│   ├── migrations/               # PostgreSQL schemas, RLS policies, indexes
│   └── seed.sql                  # Staging base dataset
└── DEPLOYMENT.md                 # Production deployment & operations runbook
```

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20 LTS` or higher
- **Python**: `3.11` or higher
- **Supabase Account** (or local PostgreSQL 15+)
- **Google AI Studio API Key** (optional, for live Gemini summaries)

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger docs will be accessible at: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start Next.js development server
npm run dev
```
Open your browser at: `http://localhost:3000`

---

## Testing & Quality Assurance

### Run Frontend Build & Typechecks
```bash
cd frontend

# Run Next.js production build and static analysis
npm run build

# TypeScript compilation check
npx tsc --noEmit
```

### Run Backend Test Suite
```bash
cd backend

# Run safe unit and health tests
python -m pytest tests/test_health.py tests/test_seed_and_models.py -v

# Run full test suite
python -m pytest tests/ -v
```

---

## Security & Reliability Standards

- **Zero Secret Exposure:** `SUPABASE_SERVICE_ROLE_KEY`, `OPERATOR_API_KEY`, and `GEMINI_API_KEY` are strictly isolated to the backend container. The frontend only receives signed short-lived JWT tokens or client-safe public payloads.
- **Row Level Security (RLS):** Supabase tables enforce granular policies allowing public read access for read-only telemetry while restricting mutations to verified `operator` or `service_role` tokens.
- **Fail-Safe AI Layer:** If Gemini Flash exceeds API quotas or times out, the system automatically falls back to deterministic rule-based explanations without halting operational workflows.
- **Zero Silent Mocking:** Live Mode transparently displays network errors and status indicators if the backend is unreachable, rather than quietly substituting synthetic data.

---

## License

This project was developed for the Smart India Hackathon (SIH) aviation decision-support problem statement. All synthetic operational scenarios and airframe designations are fictional and designed for evaluation purposes.
