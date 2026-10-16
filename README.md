# AEROSYNC — Intelligence for Dynamic Air Operations

AEROSYNC is a decision-support prototype demonstrating how fragmented aviation operational data can be unified into a real-time common operating picture and dynamically re-optimized when conditions change.

Designed for non-combat aviation operations:
- Disaster Relief
- Medical Evacuation (MEDEVAC)
- Humanitarian Transport
- Search & Rescue (SAR)
- Training & Readiness
- Standby Operations

---

## Architecture Overview

```
                  ┌──────────────────────┐
                  │  Supabase PostgreSQL  │
                  │  (Tables + RLS)      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   FastAPI Backend    │
                  │ (Owns State/Mutations│
                  └─────┬────┬─────┬─────┘
                        │    │     │
         ┌──────────────┘    │     └──────────────┐
         ▼                   ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│Simulation Engine│ │ OR-Tools Solver │ │  Gemini Flash   │
│ (State Machine) │ │ (Deterministic) │ │ (Explanations)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │    Next.js Client    │
                  │(Visualization/Shell) │
                  └──────────────────────┘
```

---

## Design Philosophy: Calm Intelligence

- **Light theme only**
- **Palette**: `#FAFAFC` (Bg), `#FFFFFF` (Surface), `#8B7CF6` (Primary Purple), `#F3F0FF` (Soft Purple), `#1E1B2E` (Text), `#77738A` (Muted), `#EAE7F2` (Border)
- **Semantic Accents**: Green (`#16A34A`), Amber (`#D97706`), Red (`#DC2626`)
- **Purple restraint**: Used only for intelligence/selection/primary interaction (~5–10% of interface)
- Avoids military video game, cyberpunk, glassmorphism, or generic chatbot aesthetics

---

## Project Structure

```
├── frontend/                     # Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
│   ├── src/
│   │   ├── app/                  # App Router
│   │   │   ├── (app)/            # Authenticated Shell layout
│   │   │   │   ├── dashboard/    # Primary Overview (Tier 1)
│   │   │   │   ├── simulation/   # Scenario Engine (Tier 2)
│   │   │   │   ├── optimization/ # Constraint Solver (Tier 2)
│   │   │   │   ├── fleet/        # Fleet Roster (Tier 3)
│   │   │   │   ├── crew/         # Personnel & Qualifications (Tier 3)
│   │   │   │   ├── missions/     # Mission Tasks (Tier 3)
│   │   │   │   ├── environment/  # Weather & Airspace (Tier 3)
│   │   │   │   └── reports/      # Analytics & Readiness (Tier 3)
│   │   │   ├── layout.tsx        # Inter + JetBrains Mono root layout
│   │   │   ├── page.tsx          # Root redirect to /dashboard
│   │   │   └── globals.css       # Design tokens & calm intelligence theme
│   │   ├── components/
│   │   │   ├── layout/           # Sidebar, Topbar, Shell
│   │   │   └── ui/               # shadcn/ui primitives
│   │   ├── lib/                  # API client, constants, utils
│   └── package.json
│
├── backend/                      # Python FastAPI + OR-Tools + Pydantic
│   ├── app/
│   │   ├── routers/              # API Endpoints
│   │   ├── models/               # Pydantic Schemas
│   │   ├── services/             # Optimization, Simulation, AI services
│   │   ├── db/                   # Supabase client & seed scripts
│   │   ├── config.py             # Environment configuration
│   │   └── main.py               # FastAPI entry point
│   ├── tests/                    # Backend unit tests
│   └── requirements.txt
│
└── supabase/                     # Migrations & RLS policies
```

---

## Getting Started

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 2. Backend

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Running Tests

```bash
# Frontend type check & lint
cd frontend
npx tsc --noEmit
npm run lint

# Backend unit tests
cd backend
python -m unittest discover -s tests
```
