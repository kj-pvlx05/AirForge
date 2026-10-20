# AEROSYNC — Production Deployment & Operations Guide

**Intelligence for Dynamic Air Operations**  
Synthetic Non-Combat Aviation Decision-Support Platform

---

## 1. System Architecture Overview

AEROSYNC is a high-reliability, decision-support platform designed to manage dynamic disruptions (weather deterioration, maintenance groundings) across synthetic aviation fleets.

```text
┌────────────────────────────────────────────────────────┐
│             AEROSYNC Frontend (Next.js 16)             │
│        Light Calm Intelligence UI / MapLibre GL        │
│          Deployed on Vercel / Global CDN               │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (Typed API Client)
                            ▼
┌────────────────────────────────────────────────────────┐
│             AEROSYNC Backend (FastAPI / Py)            │
│  - Operator Auth Middleware (Bearer / X-API-Key)       │
│  - LifeCycle Startup Checks (/api/health, /api/ready)  │
│  - Non-root Container on Render / Railway              │
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

### Core Separation of Responsibilities
1. **Simulation Engine:** Applies environmental/operational events deterministically to airframes and missions.
2. **OR-Tools CP-SAT:** Resolves resource allocations mathematically; guarantees constraint satisfaction.
3. **Gemini Flash:** Explains optimization outputs in natural language for human operators; **never** allocates resources or overrides constraints.
4. **Supabase PostgreSQL:** Persistent source of truth with Row Level Security.
5. **FastAPI & Next.js:** Strict boundary layer isolating database service keys and AI secrets from the public client.

---

## 2. Prerequisites

| Component | Minimum Version | Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | v18.18.0 | v20 LTS or v22 | Frontend runtime & build engine |
| **npm** | v9.0.0 | v10.8+ | Frontend package management |
| **Python** | 3.11 | 3.12 or 3.14 | FastAPI backend runtime & OR-Tools |
| **PostgreSQL** | 15.0 | Supabase Cloud (PG 15+) | Managed database with RLS |
| **Docker** | 24.0+ | Latest Docker Desktop / Engine | Containerized backend deployment |
| **Google AI Key** | Gemini Flash API | Google AI Studio key | Decision explanation layer |

---

## 3. Local Development Setup

### 3.1 Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Update `.env` with your Supabase credentials and Gemini API key, or leave defaults for mock in-memory mode during local testing).*

5. **Run the backend development server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Verify backend endpoints:**
   - Swagger Documentation: `http://localhost:8000/docs`
   - Liveness Probe: `http://localhost:8000/api/health`
   - Readiness Probe: `http://localhost:8000/api/ready`

### 3.2 Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Ensure `NEXT_PUBLIC_API_URL=http://localhost:8000`.

4. **Run the Next.js development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open `http://localhost:3000` in your browser.

---

## 4. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Type | Default | Required in Production? | Description |
| :--- | :--- | :--- | :--- | :--- |
| `APP_NAME` | string | `"AEROSYNC API"` | No | Human-readable service name. |
| `APP_ENV` | enum | `"development"` | **YES** | Set to `production` in live environments. Triggers strict boot validation. |
| `DEBUG` | boolean | `false` | No | Enables detailed debug traces (keep `false` in production). |
| `API_HOST` | string | `"0.0.0.0"` | No | Network binding interface. |
| `API_PORT` | integer | `8000` | No | Listening port. Render/Railway will dynamically supply `PORT`. |
| `AUTH_REQUIRED` | boolean | `false` | **YES** (`true`) | Enforces operator token authorization on state-mutating endpoints. |
| `OPERATOR_API_KEY`| string | `""` | **YES** | Secret key required when `AUTH_REQUIRED=true` (min 16 chars). |
| `ALLOW_DEMO_RESET`| boolean | `true` | **YES** (`false`) | Prevents destructive `POST /api/simulation/reset` in production. |
| `CORS_ORIGINS` | string | `"http://localhost:3000"` | **YES** | Whitelist of allowed frontend origins (comma-separated or JSON array). |
| `SUPABASE_URL` | string | `""` | **YES** | Supabase project URL (`https://<project-ref>.supabase.co`). |
| `SUPABASE_ANON_KEY`| string | `""` | Optional | Public anonymous client key. |
| `SUPABASE_SERVICE_ROLE_KEY`| string| `""` | **YES** | Privileged server-side key bypassing RLS for administrative operations. |
| `GEMINI_API_KEY` | string | `""` | Recommended | Google AI API key for natural-language situational summaries. |
| `GEMINI_MODEL` | string | `"gemini-2.5-flash"` | No | Gemini foundation model identifier. |
| `GEMINI_TIMEOUT_SECONDS` | integer | `30` | No | Outbound HTTP timeout for Gemini API calls. |
| `GEMINI_MAX_OUTPUT_TOKENS` | integer | `2048` | No | Max tokens generated per explanation run. |
| `OPTIMIZER_TIME_LIMIT_SECONDS` | float | `5.0` | No | Solver deadline for OR-Tools CP-SAT engine. |

### Frontend (`frontend/.env.local` / Vercel Environment)

| Variable | Type | Default | Required in Production? | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | string | `http://localhost:8000` | **YES** | Public URL of the deployed FastAPI backend (e.g. `https://api.aerosync.app`). |
| `NEXT_PUBLIC_SUPABASE_URL` | string | `""` | Optional | Public client Supabase URL (read-only/auth). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | `""` | Optional | Public anonymous key. |

> **Security Note**: Never expose `OPERATOR_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in frontend environment variables or client bundles. Privileged operator sessions are authorized via runtime Bearer JWT or operator headers.

---

## 5. Database Setup & Supabase Migrations

The database is built on PostgreSQL with Row Level Security (RLS) enabled on all tables.

### 5.1 Migration Execution Order

Execute the SQL files located in `supabase/migrations/` sequentially via the **Supabase Dashboard SQL Editor** or via the **Supabase CLI**:

```bash
# Order of execution:
1. supabase/migrations/20261005000000_initial_schema.sql
2. supabase/migrations/20261008000000_ai_analysis_schema.sql
3. supabase/migrations/20261010000000_harden_rls_policies.sql
```

#### What Each Migration Creates:
- **`20261005000000_initial_schema.sql`**:  
  Declares the 13 core operational tables (`airports`, `sectors`, `aircraft`, `crew`, `missions`, `mission_crew`, `maintenance_records`, `weather_conditions`, `airspace_restrictions`, `simulation_events`, `optimization_runs`, `recommendations`, `events`), enables Row Level Security (RLS), adds foreign keys, check constraints, and performance indexes.
- **`20261008000000_ai_analysis_schema.sql`**:  
  `ai_analysis` table caching Gemini natural language explanations, operational situation assessments, constraint analyses, and fallback flags linked to optimization runs (`optimization_run_id REFERENCES optimization_runs(id)`).
- **`20261010000000_harden_rls_policies.sql`**:  
  Pre-production Row Level Security hardening:
  - Revokes `SELECT` on all 9 operational tables from `anon`.
  - Replaces permissive policies with authenticated-only policies (`FOR SELECT TO authenticated USING (true)`).
  - Preserves public access for 5 environmental/facility tables (`airports`, `sectors`, `weather_conditions`, `airspace_restrictions`, `events`).
  - Revokes direct `INSERT, UPDATE, DELETE` on all tables in `public` from client roles (`anon`, `authenticated`).
  - Grants full server-side administrative access to `service_role`.

### 5.2 Seeding Synthetic Data (Staging / Demo)

To seed the initial 18 aircraft, 35 flight crew, active missions, and nominal environmental conditions:

```bash
# Using Supabase CLI:
supabase db reset

# Or execute manually in Supabase SQL Editor:
# Run: supabase/seed.sql
```


---

## 6. Production Deployment

### 6.1 Backend Deployment (Render or Railway)

#### Option A: Docker Container (Recommended)
A production multi-stage `Dockerfile` is provided in `backend/Dockerfile`. It uses `python:3.12-slim`, drops privileges to non-root user `appuser` (UID 10001), and includes health check directives.

1. Connect your Git repository to **Render** or **Railway**.
2. Select **Docker Runtime**.
3. Set the Docker context to `backend/`.
4. Configure the environment variables specified in Section 4.
5. In Render, ensure Health Check Path is set to `/api/health`.

#### Option B: Native Python Service (`render.yaml`)
A complete Infrastructure-as-Code specification is provided in `render.yaml` at the repository root.
```yaml
# Build Command:
pip install --upgrade pip && pip install -r backend/requirements.txt

# Start Command:
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 6.2 Frontend Deployment (Vercel)

1. Connect your repository to **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your live backend domain (e.g. `https://aerosync-api.onrender.com`).
   - (Optional) `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` if direct client-side read queries are enabled.
5. Build Command: `next build` (standard).
6. Click **Deploy**.

### 6.3 Configuring CORS Between Frontend & Backend

In your backend environment on Render/Railway, configure `CORS_ORIGINS`:
```bash
CORS_ORIGINS="https://aerosync.vercel.app,https://aerosync-preview.vercel.app"
```
The FastAPI backend parses comma-separated lists and JSON arrays, validates each URL, and rejects wildcards (`*`) when credentials/auth headers are transmitted.

---

## 7. Gemini AI Decision Explanation Layer Configuration

### 7.1 Setting up Gemini Flash
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Set `GEMINI_API_KEY` in your backend environment variables.
3. Model default is set to `gemini-2.5-flash`.

### 7.2 Zero-Downtime Deterministic Fallback
If the Gemini API key is unset, invalid, or experiences a network timeout:
- AEROSYNC **does not fail**.
- The `ai_explanation_service` automatically engages its deterministic template engine.
- A structured explanation is generated from the exact OR-Tools allocations and active weather state.
- The UI displays an `[OFFLINE / DETERMINISTIC FALLBACK]` indicator to the operator.
- The optimization engine itself operates completely independently of the AI layer.

---

## 8. Production Security & Hardening Checklist

Before designating a deployment as live production, verify every item in this checklist:

- [x] **`APP_ENV=production`** set in backend environment.
- [x] **`AUTH_REQUIRED=true`** enabled to restrict simulation injections, resets, optimization runs, and recommendation applications.
- [x] **`OPERATOR_API_KEY`** configured with a high-entropy secret (>= 16 characters).
- [x] **`ALLOW_DEMO_RESET=false`** set to prevent accidental wipes of live operational data via `POST /api/simulation/reset`.
- [x] **Strict CORS**: `CORS_ORIGINS` contains only verified production frontend domain(s). No `*` wildcards.
- [x] **Supabase RLS Enabled**: All tables enforce row-level security.
- [x] **Service Role Key Shielded**: `SUPABASE_SERVICE_ROLE_KEY` is present only in backend environment variables, never committed to git or exposed to the frontend.
- [x] **Non-Root Container**: Docker container runs as `appuser:appuser` (UID 10001).
- [x] **Destructive Actions Guarded**: Confirmation dialogs required in UI for "Reset Baseline" and "Apply to Fleet".
- [x] **Idempotent Allocations**: Repeated clicks on "Apply to Fleet" return HTTP 409 Conflict once applied.
- [x] **Stale Optimization Prevention**: Solver detects state modifications occurring after an optimization run and warns the operator.

---

## 9. Verification & Smoke Testing

### 9.1 Local Automated Verification
Run the following test commands across backend and frontend before deployment:

```bash
# 1. Backend test suite (85 tests)
cd backend
py -3.14 -m pytest
# Expected: 85 passed


# 2. Frontend typecheck
cd ../frontend
npx tsc --noEmit
# Expected: 0 errors

# 3. Frontend lint
npm run lint
# Expected: 0 errors

# 4. Frontend production build
npm run build
# Expected: Compiled successfully, all static pages generated
```

### 9.2 Post-Deployment Smoke Test (Live System)

Execute these curl checks against your production backend domain:

1. **Check Liveness:**
   ```bash
   curl -i https://<your-backend>/api/health
   # Expected: HTTP 200 OK, {"status": "ok", "app_env": "production"}
   ```

2. **Check Readiness & Database Connection:**
   ```bash
   curl -i https://<your-backend>/api/ready
   # Expected: HTTP 200 OK, {"ready": true, "database": "connected"}
   ```

3. **Verify Auth Protection on Privileged Mutations:**
   ```bash
   curl -i -X POST https://<your-backend>/api/simulation/events/inject \
     -H "Content-Type: application/json" \
     -d '{"event_type": "weather_deterioration", "parameters": {}}'
   # Expected: HTTP 401 Unauthorized (Missing or invalid authorization)
   ```

4. **Verify Authorized Privileged Mutation:**
   ```bash
   curl -i -X POST https://<your-backend>/api/simulation/events/inject \
     -H "Content-Type: application/json" \
     -H "X-API-Key: <your-operator-api-key>" \
     -d '{"event_type": "weather_deterioration", "parameters": {}}'
   # Expected: HTTP 200 OK
   ```

5. **Verify Demo Reset Safeguard in Production:**
   ```bash
   curl -i -X POST https://<your-backend>/api/simulation/reset \
     -H "X-API-Key: <your-operator-api-key>"
   # Expected: HTTP 403 Forbidden ("Baseline resets are disabled in production.")
   ```

---

## 10. Synthetic Aviation Scope & Non-Combat Framing Disclaimer

AEROSYNC is explicitly designed and implemented for **synthetic, non-combat aviation operations**:
- Fleet categories include **cargo transport**, **humanitarian aid**, **fixed-wing transport**, **medical evacuation**, **disaster relief**, and **environmental survey/observation**.
- Operational disruptions model **severe weather** (thunderstorms, heavy fog, high crosswinds) and **scheduled/unscheduled mechanical maintenance**.
- No real-world military missions, combat assets, tactics, or weapon systems are modeled or supported.
