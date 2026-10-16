"""AEROSYNC — Synthetic Operational Seed Data (Python Mirror).

All data is 100% fictional/synthetic.
Used for zero-config offline runs, integration tests, and fallback data layer.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.models import (
    Airport,
    Sector,
    Aircraft,
    Crew,
    Mission,
    MissionCrewAssignment,
    MaintenanceRecord,
    WeatherCondition,
    AirspaceRestriction,
    SimulationEvent,
    OperationalSnapshot,
    OptimizationRun,
    Recommendation,
    MissionAllocation,
    Event,
)

NOW = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# 1. AIRPORTS (5 Fictional Facilities)
# ---------------------------------------------------------------------------
AIRPORTS_RAW = [
    {
        "id": UUID("a0000000-0000-0000-0000-000000000001"),
        "code": "SYN-ALPHA",
        "name": "Alpha Air Station",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "elevation_ft": 710,
        "runway_length_m": 2400,
        "status": "operational",
        "region": "Northern Highlands",
        "fuel_available": True,
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("a0000000-0000-0000-0000-000000000002"),
        "code": "SYN-BRAVO",
        "name": "Bravo Forward Base",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "elevation_ft": 45,
        "runway_length_m": 1800,
        "status": "operational",
        "region": "Coastal Sector B",
        "fuel_available": True,
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("a0000000-0000-0000-0000-000000000003"),
        "code": "SYN-CHARLIE",
        "name": "Charlie Logistics Hub",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "elevation_ft": 1800,
        "runway_length_m": 2800,
        "status": "operational",
        "region": "Central Corridor",
        "fuel_available": True,
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("a0000000-0000-0000-0000-000000000004"),
        "code": "SYN-DELTA",
        "name": "Delta Relief Staging Camp",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "elevation_ft": 30,
        "runway_length_m": 1600,
        "status": "operational",
        "region": "Eastern Flood Zone",
        "fuel_available": True,
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("a0000000-0000-0000-0000-000000000005"),
        "code": "SYN-ECHO",
        "name": "Echo Mountain Outpost",
        "latitude": 30.7333,
        "longitude": 76.7794,
        "elevation_ft": 2850,
        "runway_length_m": 1200,
        "status": "operational",
        "region": "Western Highlands",
        "fuel_available": True,
        "created_at": NOW - timedelta(days=90),
    },
]

# ---------------------------------------------------------------------------
# 2. OPERATIONAL SECTORS (6 Fictional Sectors)
# ---------------------------------------------------------------------------
SECTORS_RAW = [
    {
        "id": UUID("b0000000-0000-0000-0000-000000000001"),
        "code": "SEC-A",
        "name": "Sector A - Northern Highlands",
        "boundary": {"type": "Polygon", "coordinates": [[[76.0, 28.0], [78.5, 28.0], [78.5, 30.5], [76.0, 30.5], [76.0, 28.0]]]},
        "status": "active",
        "risk_level": "low",
        "notes": "Northern mountain approaches, generally stable weather.",
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("b0000000-0000-0000-0000-000000000002"),
        "code": "SEC-B",
        "name": "Sector B - Coastal Corridor",
        "boundary": {"type": "Polygon", "coordinates": [[[71.5, 18.0], [74.5, 18.0], [74.5, 20.5], [71.5, 20.5], [71.5, 18.0]]]},
        "status": "active",
        "risk_level": "medium",
        "notes": "High maritime humidity; vulnerable to sudden tropical rain & convective squalls.",
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("b0000000-0000-0000-0000-000000000003"),
        "code": "SEC-C",
        "name": "Sector C - Central Transit Corridor",
        "boundary": {"type": "Polygon", "coordinates": [[[74.5, 21.5], [77.5, 21.5], [77.5, 24.0], [74.5, 24.0], [74.5, 21.5]]]},
        "status": "active",
        "risk_level": "low",
        "notes": "Main logistics arterial connector between northern and coastal staging bases.",
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("b0000000-0000-0000-0000-000000000004"),
        "code": "SEC-D",
        "name": "Sector D - Eastern River Delta",
        "boundary": {"type": "Polygon", "coordinates": [[[87.0, 21.5], [89.5, 21.5], [89.5, 23.5], [87.0, 23.5], [87.0, 21.5]]]},
        "status": "active",
        "risk_level": "medium",
        "notes": "Flood-relief operational sector; multiple remote landing zones.",
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("b0000000-0000-0000-0000-000000000005"),
        "code": "SEC-E",
        "name": "Sector E - Western Ridge",
        "boundary": {"type": "Polygon", "coordinates": [[[75.0, 29.5], [78.0, 29.5], [78.0, 31.5], [75.0, 31.5], [75.0, 29.5]]]},
        "status": "active",
        "risk_level": "high",
        "notes": "High-altitude ridgelines; requires specialized mountain qualification.",
        "created_at": NOW - timedelta(days=90),
    },
    {
        "id": UUID("b0000000-0000-0000-0000-000000000006"),
        "code": "SEC-F",
        "name": "Sector F - Southern Training Zone",
        "boundary": {"type": "Polygon", "coordinates": [[[76.0, 16.5], [78.5, 16.5], [78.5, 18.5], [76.0, 18.5], [76.0, 16.5]]]},
        "status": "active",
        "risk_level": "low",
        "notes": "Designated low-risk operational training and instrument practice box.",
        "created_at": NOW - timedelta(days=90),
    },
]

# ---------------------------------------------------------------------------
# 3. AIRCRAFT (22 Fleet Units)
# ---------------------------------------------------------------------------
AIRCRAFT_SPECS = {
    "AeroLift M1": {
        "type": "Medium utility helicopter",
        "range": 850,
        "payload": 2400,
        "passengers": 12,
        "speed": 260,
        "fuel": 1600,
    },
    "AeroLift H2": {
        "type": "Heavy transport helicopter",
        "range": 1100,
        "payload": 8500,
        "passengers": 36,
        "speed": 290,
        "fuel": 4200,
    },
    "AeroTransport T1": {
        "type": "Fixed-wing transport",
        "range": 3600,
        "payload": 9200,
        "passengers": 48,
        "speed": 480,
        "fuel": 7800,
    },
    "AeroUtility U1": {
        "type": "Light utility helicopter",
        "range": 680,
        "payload": 1100,
        "passengers": 5,
        "speed": 240,
        "fuel": 720,
    },
}

AIRCRAFT_RAW = [
    # 8 x AeroLift M1
    {"tail": "AS-LM01", "model": "AeroLift M1", "role": "medevac", "base": 1, "status": "available", "fuel_pct": 95, "hours": 342.5},
    {"tail": "AS-LM02", "model": "AeroLift M1", "role": "search-and-rescue", "base": 1, "status": "available", "fuel_pct": 88, "hours": 410.2},
    {"tail": "AS-LM03", "model": "AeroLift M1", "role": "medevac", "base": 2, "status": "available", "fuel_pct": 92, "hours": 280.8},
    {"tail": "AS-LM04", "model": "AeroLift M1", "role": "disaster-relief", "base": 2, "status": "available", "fuel_pct": 78, "hours": 512.0},
    {"tail": "AS-LM05", "model": "AeroLift M1", "role": "disaster-relief", "base": 3, "status": "available", "fuel_pct": 100, "hours": 195.4},
    {"tail": "AS-LM06", "model": "AeroLift M1", "role": "standby", "base": 4, "status": "available", "fuel_pct": 85, "hours": 320.1},
    {"tail": "AS-LM07", "model": "AeroLift M1", "role": "search-and-rescue", "base": 5, "status": "available", "fuel_pct": 90, "hours": 480.0},
    {"tail": "AS-LM08", "model": "AeroLift M1", "role": "training", "base": 3, "status": "maintenance", "fuel_pct": 45, "hours": 620.5},
    # 4 x AeroLift H2
    {"tail": "AS-LH01", "model": "AeroLift H2", "role": "disaster-relief", "base": 1, "status": "available", "fuel_pct": 95, "hours": 280.0},
    {"tail": "AS-LH02", "model": "AeroLift H2", "role": "transport", "base": 2, "status": "available", "fuel_pct": 82, "hours": 340.5},
    {"tail": "AS-LH03", "model": "AeroLift H2", "role": "disaster-relief", "base": 4, "status": "available", "fuel_pct": 90, "hours": 190.2},
    {"tail": "AS-LH04", "model": "AeroLift H2", "role": "transport", "base": 3, "status": "maintenance", "fuel_pct": 30, "hours": 710.0},
    # 4 x AeroTransport T1
    {"tail": "AS-TT01", "model": "AeroTransport T1", "role": "transport", "base": 1, "status": "available", "fuel_pct": 98, "hours": 520.4},
    {"tail": "AS-TT02", "model": "AeroTransport T1", "role": "disaster-relief", "base": 2, "status": "available", "fuel_pct": 90, "hours": 410.0},
    {"tail": "AS-TT03", "model": "AeroTransport T1", "role": "transport", "base": 3, "status": "available", "fuel_pct": 85, "hours": 315.6},
    {"tail": "AS-TT04", "model": "AeroTransport T1", "role": "training", "base": 3, "status": "grounded", "fuel_pct": 20, "hours": 890.1},
    # 6 x AeroUtility U1
    {"tail": "AS-LU01", "model": "AeroUtility U1", "role": "search-and-rescue", "base": 1, "status": "available", "fuel_pct": 92, "hours": 215.3},
    {"tail": "AS-LU02", "model": "AeroUtility U1", "role": "medevac", "base": 2, "status": "available", "fuel_pct": 88, "hours": 305.8},
    {"tail": "AS-LU03", "model": "AeroUtility U1", "role": "search-and-rescue", "base": 3, "status": "available", "fuel_pct": 95, "hours": 175.4},
    {"tail": "AS-LU04", "model": "AeroUtility U1", "role": "standby", "base": 4, "status": "available", "fuel_pct": 84, "hours": 260.0},
    {"tail": "AS-LU05", "model": "AeroUtility U1", "role": "search-and-rescue", "base": 5, "status": "available", "fuel_pct": 90, "hours": 390.2},
    {"tail": "AS-LU06", "model": "AeroUtility U1", "role": "training", "base": 3, "status": "maintenance", "fuel_pct": 40, "hours": 145.0},
]

# ---------------------------------------------------------------------------
# 4. CREW (32 Personnel)
# ---------------------------------------------------------------------------
CREW_RAW = [
    # Pilots (12)
    {"code": "CRW-P01", "name": "Elena Vance", "role": "pilot", "rank": "Senior Flight Officer", "base": 1, "status": "available", "quals": ["IFR", "NVG", "SAR_CERT", "MOUNTAIN_OPS"], "duty": 2.5},
    {"code": "CRW-P02", "name": "Marcus Finch", "role": "pilot", "rank": "Flight Captain", "base": 1, "status": "available", "quals": ["IFR", "HEAVY_LIFT", "OVERWATER"], "duty": 1.0},
    {"code": "CRW-P03", "name": "Devon Rhodes", "role": "pilot", "rank": "Senior Flight Officer", "base": 2, "status": "available", "quals": ["IFR", "NVG", "OVERWATER", "MEDEVAC_OPS"], "duty": 3.0},
    {"code": "CRW-P04", "name": "Ananya Sen", "role": "pilot", "rank": "Flight Captain", "base": 2, "status": "available", "quals": ["IFR", "NVG", "SAR_CERT"], "duty": 0.0},
    {"code": "CRW-P05", "name": "Liam Callahan", "role": "pilot", "rank": "Senior Flight Officer", "base": 3, "status": "available", "quals": ["IFR", "HEAVY_LIFT", "FIXED_WING"], "duty": 2.0},
    {"code": "CRW-P06", "name": "Sofia Mendez", "role": "pilot", "rank": "Flight Captain", "base": 3, "status": "available", "quals": ["IFR", "FIXED_WING", "CARGO_OPS"], "duty": 1.5},
    {"code": "CRW-P07", "name": "Tariq Al-Mansoor", "role": "pilot", "rank": "Flight Officer", "base": 4, "status": "available", "quals": ["IFR", "SAR_CERT", "FLOOD_RELIEF"], "duty": 4.0},
    {"code": "CRW-P08", "name": "Kavita Nair", "role": "pilot", "rank": "Senior Flight Officer", "base": 4, "status": "available", "quals": ["IFR", "NVG", "MEDEVAC_OPS"], "duty": 0.0},
    {"code": "CRW-P09", "name": "Rohan Verma", "role": "pilot", "rank": "Senior Flight Officer", "base": 5, "status": "available", "quals": ["IFR", "MOUNTAIN_OPS", "SAR_CERT"], "duty": 2.0},
    {"code": "CRW-P10", "name": "Ingrid Lindholm", "role": "pilot", "rank": "Flight Officer", "base": 5, "status": "available", "quals": ["IFR", "NVG", "MOUNTAIN_OPS"], "duty": 1.0},
    {"code": "CRW-P11", "name": "Gabriel Osei", "role": "pilot", "rank": "Flight Captain", "base": 1, "status": "off-duty", "quals": ["IFR", "NVG", "SAR_CERT"], "duty": 11.5},
    {"code": "CRW-P12", "name": "Chloe Mercier", "role": "pilot", "rank": "Flight Officer", "base": 2, "status": "medical", "quals": ["IFR", "OVERWATER"], "duty": 0.0},
    # Co-Pilots (6)
    {"code": "CRW-CP01", "name": "Aiden Zhao", "role": "co-pilot", "rank": "First Officer", "base": 1, "status": "available", "quals": ["IFR", "NVG"], "duty": 2.5},
    {"code": "CRW-CP02", "name": "Hannah Becker", "role": "co-pilot", "rank": "First Officer", "base": 2, "status": "available", "quals": ["IFR", "OVERWATER"], "duty": 3.0},
    {"code": "CRW-CP03", "name": "Carlos Ortiz", "role": "co-pilot", "rank": "First Officer", "base": 3, "status": "available", "quals": ["IFR", "FIXED_WING"], "duty": 1.5},
    {"code": "CRW-CP04", "name": "Zara Phillips", "role": "co-pilot", "rank": "First Officer", "base": 4, "status": "available", "quals": ["IFR", "SAR_CERT"], "duty": 4.0},
    {"code": "CRW-CP05", "name": "Vikram Sethi", "role": "co-pilot", "rank": "First Officer", "base": 5, "status": "available", "quals": ["IFR", "MOUNTAIN_OPS"], "duty": 2.0},
    {"code": "CRW-CP06", "name": "Lucas Dubois", "role": "co-pilot", "rank": "First Officer", "base": 3, "status": "available", "quals": ["IFR", "HEAVY_LIFT"], "duty": 0.5},
    # Flight Engineers (4)
    {"code": "CRW-FE01", "name": "Arjun Das", "role": "flight-engineer", "rank": "Chief Systems Specialist", "base": 1, "status": "available", "quals": ["HEAVY_LIFT_TECH", "TURBINE_CERT"], "duty": 1.0},
    {"code": "CRW-FE02", "name": "Nadia Kowalski", "role": "flight-engineer", "rank": "Systems Specialist", "base": 2, "status": "available", "quals": ["AVIONICS_CERT", "OVERWATER_GEAR"], "duty": 2.0},
    {"code": "CRW-FE03", "name": "Kenji Sato", "role": "flight-engineer", "rank": "Senior Systems Specialist", "base": 3, "status": "available", "quals": ["FIXED_WING_TECH", "CARGO_RIGGING"], "duty": 1.5},
    {"code": "CRW-FE04", "name": "Mira Al-Hashemi", "role": "flight-engineer", "rank": "Systems Specialist", "base": 4, "status": "available", "quals": ["WINCH_OPERATOR", "TURBINE_CERT"], "duty": 3.5},
    # Flight Medics (5)
    {"code": "CRW-MD01", "name": "Dr. Rachel Vance", "role": "flight-medic", "rank": "Lead Flight Paramedic", "base": 1, "status": "available", "quals": ["CRITICAL_CARE", "PEDIATRIC_ADV", "WINCH_RESCUE"], "duty": 2.5},
    {"code": "CRW-MD02", "name": "Siddharth Roy", "role": "flight-medic", "rank": "Senior Paramedic", "base": 2, "status": "available", "quals": ["CRITICAL_CARE", "OVERWATER_RESCUE"], "duty": 3.0},
    {"code": "CRW-MD03", "name": "Emily Thornton", "role": "flight-medic", "rank": "Flight Paramedic", "base": 4, "status": "available", "quals": ["CRITICAL_CARE", "TRAUMA_LIFE_SUPPORT"], "duty": 0.0},
    {"code": "CRW-MD04", "name": "David Kim", "role": "flight-medic", "rank": "Flight Paramedic", "base": 5, "status": "available", "quals": ["MOUNTAIN_MEDIC", "HYPOTHERMIA_CERT"], "duty": 2.0},
    {"code": "CRW-MD05", "name": "Pooja Iyer", "role": "flight-medic", "rank": "Lead Flight Paramedic", "base": 2, "status": "off-duty", "quals": ["CRITICAL_CARE"], "duty": 11.0},
    # Loadmasters (3)
    {"code": "CRW-LM01", "name": "Derrick Boone", "role": "loadmaster", "rank": "Master Cargo Controller", "base": 1, "status": "available", "quals": ["HEAVY_RIGGING", "AIRDROP_CERT"], "duty": 1.0},
    {"code": "CRW-LM02", "name": "Fatima Zahra", "role": "loadmaster", "rank": "Cargo Controller", "base": 2, "status": "available", "quals": ["HAZMAT_RELIEF", "RAPID_OFFLOAD"], "duty": 2.5},
    {"code": "CRW-LM03", "name": "Tomas Novak", "role": "loadmaster", "rank": "Master Cargo Controller", "base": 3, "status": "available", "quals": ["FIXED_WING_CARGO", "HEAVY_RIGGING"], "duty": 1.5},
    # Operations Observers (2)
    {"code": "CRW-OB01", "name": "Maya Lin", "role": "operations-observer", "rank": "Mission Specialist", "base": 1, "status": "available", "quals": ["SAR_GRID_MAPPING", "SENSOR_OPERATOR"], "duty": 2.0},
    {"code": "CRW-OB02", "name": "Owen Gallagher", "role": "operations-observer", "rank": "Mission Specialist", "base": 5, "status": "available", "quals": ["FLIR_OPERATOR", "MOUNTAIN_LOOKOUT"], "duty": 1.5},
]


def build_seed_airports() -> list[Airport]:
    return [Airport(**a) for a in AIRPORTS_RAW]


def build_seed_sectors() -> list[Sector]:
    return [Sector(**s) for s in SECTORS_RAW]


def build_seed_aircraft() -> list[Aircraft]:
    aircraft = []
    for i, a in enumerate(AIRCRAFT_RAW, start=1):
        spec = AIRCRAFT_SPECS[a["model"]]
        base_id = UUID(f"a0000000-0000-0000-0000-00000000000{a['base']}")
        ac_id = UUID(f"c0000000-0000-0000-0000-{i:012d}")
        aircraft.append(
            Aircraft(
                id=ac_id,
                tail_number=a["tail"],
                model=a["model"],
                type=spec["type"],
                role=a["role"],
                base_airport_id=base_id,
                current_airport_id=base_id,
                status=a["status"],
                max_range_km=spec["range"],
                max_payload_kg=spec["payload"],
                max_passengers=spec["passengers"],
                cruise_speed_kmh=spec["speed"],
                fuel_capacity_liters=spec["fuel"],
                fuel_level_percent=a["fuel_pct"],
                flight_hours=a["hours"],
                last_maintenance_date=NOW - timedelta(days=15),
                next_maintenance_due=NOW + timedelta(days=45),
                created_at=NOW - timedelta(days=60),
            )
        )
    return aircraft


def build_seed_crew() -> list[Crew]:
    crew = []
    for i, c in enumerate(CREW_RAW, start=1):
        base_id = UUID(f"a0000000-0000-0000-0000-00000000000{c['base']}")
        c_id = UUID(f"d0000000-0000-0000-0000-{i:012d}")
        crew.append(
            Crew(
                id=c_id,
                code=c["code"],
                name=c["name"],
                role=c["role"],
                rank=c["rank"],
                base_airport_id=base_id,
                status=c["status"],
                qualifications=c["quals"],
                max_duty_hours=12.0,
                current_duty_hours=c["duty"],
                rest_period_hours=10.0,
                created_at=NOW - timedelta(days=60),
            )
        )
    return crew


def build_seed_missions() -> list[Mission]:
    missions_meta = [
        # (code, title, type, prio, orig, dest, sec, ac_idx, model, crew_comp, pax, cargo, urg, start_h, end_h)
        ("MSN-2026-01", "Emergency Pediatric Medevac - Coastal Clinic", "medevac", "critical", 2, 1, 2, 3, "AeroLift M1", {"pilot": 1, "co-pilot": 1, "flight-medic": 1}, 2, 80.0, 95, 1, 4),
        ("MSN-2026-02", "High-Altitude Hiker Evacuation - Echo Ridge", "search-and-rescue", "critical", 5, 1, 5, 7, "AeroLift M1", {"pilot": 1, "flight-medic": 1, "operations-observer": 1}, 3, 120.0, 92, 2, 5),
        ("MSN-2026-03", "Critical Water Purification Airlift - Delta Post", "disaster-relief", "critical", 3, 4, 4, 11, "AeroLift H2", {"pilot": 1, "co-pilot": 1, "loadmaster": 1}, 0, 6200.0, 90, 1, 5),
        ("MSN-2026-04", "Coastal Storm Surge Medical Evac Support", "medevac", "high", 2, 3, 2, 18, "AeroUtility U1", {"pilot": 1, "flight-medic": 1}, 1, 40.0, 82, 2, 4),
        ("MSN-2026-05", "Central Food Rations Bulk Distribution", "disaster-relief", "high", 1, 4, 4, 13, "AeroTransport T1", {"pilot": 1, "co-pilot": 1, "loadmaster": 1}, 4, 8500.0, 78, 3, 7),
        ("MSN-2026-06", "Maritime Distress Beacon Survey", "search-and-rescue", "high", 2, 2, 2, 4, "AeroLift M1", {"pilot": 1, "co-pilot": 1, "operations-observer": 1}, 0, 200.0, 85, 1, 4),
        ("MSN-2026-07", "Northern Medical Team Relocation", "transport", "high", 1, 5, 1, 1, "AeroLift M1", {"pilot": 1, "flight-medic": 1}, 8, 350.0, 75, 4, 7),
        ("MSN-2026-08", "Emergency Blanket & Tent Dispatch", "disaster-relief", "medium", 3, 2, 3, 14, "AeroTransport T1", {"pilot": 1, "co-pilot": 1, "loadmaster": 1}, 2, 7000.0, 65, 5, 9),
        ("MSN-2026-09", "Power Generator Deployment - Delta Substation", "transport", "medium", 1, 4, 4, 9, "AeroLift H2", {"pilot": 1, "flight-engineer": 1, "loadmaster": 1}, 0, 7500.0, 60, 6, 10),
        ("MSN-2026-10", "Coastal Sector Environmental Observation", "search-and-rescue", "medium", 2, 2, 2, 10, "AeroLift H2", {"pilot": 1, "co-pilot": 1}, 0, 300.0, 55, 4, 8),
        ("MSN-2026-11", "Highland Weather Station Diagnostic Team", "transport", "medium", 5, 5, 5, 21, "AeroUtility U1", {"pilot": 1, "operations-observer": 1}, 3, 150.0, 50, 5, 8),
        ("MSN-2026-12", "Relief Fuel Bladders Transfer", "disaster-relief", "medium", 3, 4, 4, 5, "AeroLift M1", {"pilot": 1, "flight-engineer": 1}, 0, 2100.0, 58, 3, 6),
        ("MSN-2026-13", "Night Vision Goggle Recertification Flight", "training", "low", 3, 3, 6, 22, "AeroUtility U1", {"pilot": 1, "co-pilot": 1}, 0, 0.0, 25, 8, 10),
        ("MSN-2026-14", "Northern Sector Medevac Standby Readiness", "standby", "low", 1, 1, 1, 2, "AeroLift M1", {"pilot": 1, "flight-medic": 1}, 0, 0.0, 30, -2, 6),
        ("MSN-2026-15", "Delta Relief Reserve Standby", "standby", "low", 4, 4, 4, 6, "AeroLift M1", {"pilot": 1, "co-pilot": 1}, 0, 0.0, 30, -1, 7),
        ("MSN-2026-16", "Mountain Route Instrument Check Flight", "training", "low", 5, 5, 5, 17, "AeroUtility U1", {"pilot": 1}, 0, 0.0, 20, 9, 11),
    ]

    missions = []
    for i, m in enumerate(missions_meta, start=1):
        m_id = UUID(f"e0000000-0000-0000-0000-{i:012d}")
        orig = UUID(f"a0000000-0000-0000-0000-00000000000{m[4]}")
        dest = UUID(f"a0000000-0000-0000-0000-00000000000{m[5]}")
        sec = UUID(f"b0000000-0000-0000-0000-00000000000{m[6]}")
        ac = UUID(f"c0000000-0000-0000-0000-{m[7]:012d}")

        status = "active" if m[13] < 0 else "scheduled"

        missions.append(
            Mission(
                id=m_id,
                code=m[0],
                title=m[1],
                type=m[2],
                priority=m[3],
                status=status,
                origin_airport_id=orig,
                destination_airport_id=dest,
                sector_id=sec,
                assigned_aircraft_id=ac,
                required_aircraft_model=m[8],
                required_crew_composition=m[9],
                passenger_count=m[10],
                cargo_weight_kg=m[11],
                urgency_score=m[12],
                scheduled_start=NOW + timedelta(hours=m[13]),
                scheduled_end=NOW + timedelta(hours=m[14]),
                created_at=NOW - timedelta(days=2),
            )
        )
    return missions


def build_seed_weather() -> list[WeatherCondition]:
    items = [
        {"region": "Northern Highlands", "sec": 1, "air": 1, "cond": "clear", "sev": "none", "vis": 10.0, "w_spd": 8, "w_dir": 310, "ceil": 8500, "temp": 22.5, "vfr": True},
        {"region": "Coastal Sector B", "sec": 2, "air": 2, "cond": "scattered-clouds", "sev": "none", "vis": 8.5, "w_spd": 14, "w_dir": 240, "ceil": 4200, "temp": 29.0, "vfr": True},
        {"region": "Central Corridor", "sec": 3, "air": 3, "cond": "clear", "sev": "none", "vis": 10.0, "w_spd": 6, "w_dir": 180, "ceil": 9000, "temp": 27.2, "vfr": True},
        {"region": "Eastern Flood Zone", "sec": 4, "air": 4, "cond": "light-rain", "sev": "moderate", "vis": 5.2, "w_spd": 18, "w_dir": 120, "ceil": 1800, "temp": 26.0, "vfr": False},
        {"region": "Western Ridge", "sec": 5, "air": 5, "cond": "overcast", "sev": "none", "vis": 7.0, "w_spd": 16, "w_dir": 280, "ceil": 3100, "temp": 14.5, "vfr": True},
        {"region": "Southern Training Zone", "sec": 6, "air": None, "cond": "clear", "sev": "none", "vis": 10.0, "w_spd": 5, "w_dir": 200, "ceil": 10000, "temp": 30.5, "vfr": True},
    ]
    weather = []
    for i, w in enumerate(items, start=1):
        sec_id = UUID(f"b0000000-0000-0000-0000-00000000000{w['sec']}")
        air_id = UUID(f"a0000000-0000-0000-0000-00000000000{w['air']}") if w["air"] else None
        weather.append(
            WeatherCondition(
                id=UUID(f"80000000-0000-0000-0000-{i:012d}"),
                region=w["region"],
                sector_id=sec_id,
                airport_id=air_id,
                condition=w["cond"],
                severity=w["sev"],
                visibility_km=w["vis"],
                wind_speed_kts=w["w_spd"],
                wind_direction_deg=w["w_dir"],
                ceiling_ft=w["ceil"],
                temperature_c=w["temp"],
                is_vfr=w["vfr"],
                valid_from=NOW - timedelta(hours=1),
                valid_until=NOW + timedelta(hours=12),
                created_at=NOW - timedelta(hours=1),
            )
        )
    return weather


def build_seed_maintenance() -> list[MaintenanceRecord]:
    records = [
        (8, "scheduled", "600-hour comprehensive rotorhead inspection", "in-progress", -2, 3),
        (12, "unscheduled", "Auxiliary Power Unit turbine seal oil leak", "delayed", -3, 2),
        (16, "engine-overhaul", "Port turboprop hot-section inspection", "in-progress", -5, 10),
        (1, "avionics-check", "Periodic weather radar calibration", "completed", -16, -15),
        (2, "airframe-inspection", "Hoist cable tensile load calibration", "completed", -21, -20),
        (3, "scheduled", "Routine 100-hour airframe check", "completed", -11, -10),
        (5, "avionics-check", "GPS / RNAV flight computer firmware update", "completed", -6, -5),
        (10, "airframe-inspection", "Ramp hydraulic cylinder seal flush", "completed", -23, -22),
        (14, "scheduled", "Tire wear inspection and brake pack test", "completed", -26, -25),
        (18, "avionics-check", "Medical oxygen onboard distribution check", "completed", -20, -19),
        (21, "airframe-inspection", "Tail rotor gearbox oil analysis", "completed", -22, -21),
    ]
    items = []
    for i, r in enumerate(records, start=1):
        ac_id = UUID(f"c0000000-0000-0000-0000-{r[0]:012d}")
        items.append(
            MaintenanceRecord(
                id=UUID(f"70000000-0000-0000-0000-{i:012d}"),
                aircraft_id=ac_id,
                type=r[1],
                description=r[2],
                status=r[3],
                scheduled_start=NOW + timedelta(days=r[4]),
                scheduled_end=NOW + timedelta(days=r[5]),
                actual_end=NOW + timedelta(days=r[5]) if r[3] == "completed" else None,
                technician_notes="Nominal verification." if r[3] == "completed" else "Work underway.",
                created_at=NOW - timedelta(days=30),
            )
        )
    return items


def build_seed_airspace_restrictions() -> list[AirspaceRestriction]:
    notams = [
        ("NOTAM-SEC-D-01", "Delta Flood Relief Transit Corridor", "relief-corridor", 4, 500, 6000, "active", "Dedicated low-altitude humanitarian airlift corridor for flood operations."),
        ("NOTAM-SEC-E-02", "High-Altitude Pass Wind Shear Warning Zone", "weather-hazard", 5, 7000, 16000, "active", "Severe mountain downdrafts reported near Echo Pass."),
        ("NOTAM-SEC-F-03", "Aviation Cadet Low-Level Training Box", "civil-protection-zone", 6, 0, 4500, "active", "Restricted to scheduled training operations."),
        ("NOTAM-SEC-B-04", "Coastal Offshore Sea Search Grid", "search-grid", 2, 0, 3000, "pending", "Reserved grid for marine distress beacon sweep if weather deteriorates."),
    ]
    items = []
    for i, n in enumerate(notams, start=1):
        sec_id = UUID(f"b0000000-0000-0000-0000-00000000000{n[3]}")
        items.append(
            AirspaceRestriction(
                id=UUID(f"90000000-0000-0000-0000-{i:012d}"),
                identifier=n[0],
                name=n[1],
                type=n[2],
                sector_id=sec_id,
                boundary=None,
                altitude_floor_ft=n[4],
                altitude_ceiling_ft=n[5],
                status=n[6],
                reason=n[7],
                active_from=NOW - timedelta(hours=6),
                active_until=NOW + timedelta(days=5),
                created_at=NOW - timedelta(hours=6),
            )
        )
    return items
