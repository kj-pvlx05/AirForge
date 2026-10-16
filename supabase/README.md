# AEROSYNC — Database Architecture & Schema Documentation

> Fictional / Synthetic Operational Data Layer for Non-Combat Aviation Decision Support.

---

## 1. Entity-Relationship Overview

```
                      ┌───────────────┐
                      │    Sectors    │
                      └───────┬───────┘
                              │ 1:N
              ┌───────────────┼───────────────┬────────────────┐
              │               │               │                │
              ▼               ▼               ▼                ▼
     ┌─────────────────┐ ┌─────────┐ ┌─────────────────┐ ┌───────────┐
     │   Airports      │ │ Weather │ │  Restrictions   │ │ Missions  │
     └────────┬────────┘ └─────────┘ └─────────────────┘ └─────┬─────┘
              │ 1:N (base/curr)                                │ 1:N
      ┌───────┴───────┐                                        │
      ▼               ▼                                        ▼
┌───────────┐   ┌───────────┐                            ┌────────────┐
│ Aircraft  │   │   Crew    │                            │MissionCrew │
└─────┬─────┘   └─────┬─────┘                            └────────────┘
      │ 1:N           │
      ▼               └────────────────────────────────────────┘
┌─────────────┐       (Crew assigned via MissionCrew junction)
│ Maintenance │
└─────────────┘

Operational & Decision Pipeline:
┌──────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│Simulation Events ├──────►│Optimization Runs ├──────►│ Recommendations │
│ (Before / After) │  1:N  │ (OR-Tools solver)│  1:N  │(AI Explanations)│
└──────────────────┘       └──────────────────┘       └─────────────────┘
```

---

## 2. Table Specifications

| Table | Records | Purpose | Key Constraints |
|---|---|---|---|
| `airports` | 5 | Operational bases & relief camps | Unique `code`, valid GPS coords, status enum |
| `sectors` | 6 | Operational sectors with GeoJSON bounds | Unique `code`, GeoJSON polygon, risk enum |
| `aircraft` | 22 | Synthetic non-combat airframes | Unique `tail_number`, model enum, positive limits |
| `crew` | 32 | Flight personnel & medical teams | Unique `code`, role enum, duty-hour limits |
| `missions` | 16 | Non-combat flight tasks | Unique `code`, priority enum, schedule integrity |
| `mission_crew` | 12 | Crew-to-mission role mapping | Unique composite `(mission_id, crew_id)` |
| `maintenance_records`| 11 | Aircraft maintenance window tracking | Foreign key to `aircraft`, valid date windows |
| `weather_conditions` | 6 | Regional/sector weather & visibility | Severity enum, positive wind/visibility |
| `airspace_restrictions` | 4 | NOTAM safety corridors & hazards | Unique `identifier`, altitude limits |
| `simulation_events` | 1+ | Dynamic scenario tracking (before/after) | Full state JSONB snapshots, UUID arrays |
| `optimization_runs` | 1+ | OR-Tools CP-SAT solver execution history| Solver status, solve time, constraints JSONB |
| `recommendations` | 1+ | Actionable reallocations & AI rationale | Links to optimization run, action enum |
| `events` | 4+ | Operator timeline activity feed | Type & category enums, metadata JSONB |

---

## 3. Row-Level Security (RLS) & Security Boundary

1. **RLS Enabled Across All 13 Tables**:
   Every table executes `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`.
2. **Client Access Boundary**:
   Public and authenticated clients are granted `SELECT` access only. No direct `INSERT`, `UPDATE`, or `DELETE` policies exist for clients.
3. **Backend Privilege**:
   All state mutations, simulation event processing, and optimizer runs are processed by the **FastAPI backend** using the Supabase `service_role` key, which bypasses RLS and applies deterministic validation rules.
4. **API Key Isolation**:
   The `service_role` key and the Gemini API key are strictly maintained in backend server environment variables (`backend/.env`) and never exposed to the frontend.

---

## 4. How to Apply Migrations to a Supabase Project

When connecting a live Supabase project:

```bash
# Using Supabase CLI (linked project)
supabase db push

# Or via SQL Editor in the Supabase Dashboard:
# 1. Run supabase/migrations/20261005000000_initial_schema.sql
# 2. Run supabase/seed.sql
```
