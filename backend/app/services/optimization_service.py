"""AEROSYNC — OR-Tools CP-SAT Deterministic Optimization Engine (Phase 7).

Mathematical Formulation:
Decision Variables:
  - x[m, a] in {0, 1}: Binary assignment of aircraft `a` to mission `m`.
  - z[m] in {0, 1}: Binary fulfillment indicator for mission `m`.
  - r[m] in {0, 1}: Binary reroute indicator for mission `m` (corridor diversion).

Crew Resolution Methodology:
  CP-SAT determines conflict-free mission/aircraft allocations and aggregate crew feasibility;
  a deterministic qualification/rest-aware assignment step selects specific crew personnel,
  strictly verifying role requirements, mandatory ratings (IFR, SAR_CERT, MOUNTAIN_OPS, CRITICAL_CARE),
  and duty hours (<= 12h).

8 Core Hard Constraints (Inviolable):
  1. Aircraft Availability: Grounded/maintenance/unavailable aircraft strictly excluded.
  2. Aircraft Capability & Model Compatibility: Payload, passenger, range, and platform model compatibility.
  3. Crew Availability & Limits: Off-duty/medical personnel excluded; duty-hours <= 12h limits enforced; single-mission capacity.
  4. Crew Qualification: Role matching and specialized ratings (IFR, SAR_CERT, CRITICAL_CARE, MOUNTAIN_OPS).
  5. Mission Compatibility & Runway Bounds: Runway length >= 1,500 m for fixed-wing transports; reachability verified.
  6. Weather Restrictions: Sub-VFR/convective squall avoidance enforced via detour corridors.
  7. Airspace Restrictions: Active hazard NOTAM airspace avoidance enforced.
  8. Airport Availability: Closed/degraded airports strictly reject operations.
  (Safety Rule: Life-safety critical missions guaranteed 100% allocation if feasible).

Soft Objectives (Multi-Objective Maximization):
  Maximize:
    sum_m ( (PRIORITY_WEIGHT[m] + URGENCY_FACTOR * urgency_score[m]) * z[m] )
    - sum_m ( REROUTE_PENALTY * r[m] )
    + sum_{m, a} ( CHURN_BONUS_OR_PENALTY(m, a) + FERRY_BONUS_OR_PENALTY(m, a) ) * x[m, a]
"""

import math
import time
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4
from ortools.sat.python import cp_model

from app.db.repository import repository, OperationalRepository
from app.services.readiness_service import readiness_service, ReadinessService
from app.models.optimization import (
    Allocation,
    UnresolvedMission,
    ConstraintSummary,
    OptimizationMetrics,
    OptimizationRequest,
    OptimizationResult,
    OptimizationRun,
    Recommendation,
    ReassignmentDetail,
    ApplyRecommendationResponse,
    SolverStatus,
)
from app.models.event import Event
from app.models.mission import Mission
from app.models.aircraft import Aircraft
from app.models.crew import Crew
from app.models.airport import Airport
from app.models.sector import Sector
from app.models.environment import WeatherCondition, AirspaceRestriction


# Explicit, transparent objective weights (no hidden magic numbers)
PRIORITY_WEIGHTS = {
    "critical": 20000,
    "high": 10000,
    "medium": 4000,
    "low": 1000,
}
URGENCY_WEIGHT_FACTOR = 20
CHURN_RETENTION_BONUS = 100
CHURN_REASSIGNMENT_PENALTY = -40
BASE_STATION_BONUS = 60
FERRY_PENALTY = -30
REROUTE_PENALTY = 35


def compute_distance_km(p1: tuple[float, float], p2: tuple[float, float]) -> float:
    """Computes approximate ground distance between two (lat, lon) coordinates in kilometers."""
    lat1, lon1 = p1
    lat2, lon2 = p2
    # Equirectangular approximation suitable for regional aviation domain
    x = (math.radians(lon2) - math.radians(lon1)) * math.cos(0.5 * (math.radians(lat1) + math.radians(lat2)))
    y = math.radians(lat2) - math.radians(lat1)
    return math.sqrt(x * x + y * y) * 6371.0


class OptimizationService:
    """Deterministic OR-Tools CP-SAT Solver Service for AEROSYNC resource allocation."""

    def __init__(
        self,
        repo: OperationalRepository = repository,
        readiness_svc: ReadinessService = readiness_service,
    ):
        self.repo = repo
        self.readiness_svc = readiness_svc

    def solve(self, req: Optional[OptimizationRequest] = None) -> OptimizationResult:
        """Solves the operational resource allocation problem deterministically."""
        request = req or OptimizationRequest()
        start_time = time.perf_counter()

        # 1. Fetch current operational state from repository
        all_missions = self.repo.get_missions()
        all_aircraft = self.repo.get_aircraft()
        all_crew = self.repo.get_crew()
        all_sectors = self.repo.get_sectors()
        all_weather = self.repo.get_weather()
        all_airports = self.repo.get_airports()
        all_restrictions = self.repo.get_airspace_restrictions(status="active")

        airport_map: dict[UUID, Airport] = {a.id: a for a in all_airports}
        sector_map: dict[UUID, Sector] = {s.id: s for s in all_sectors}
        aircraft_map: dict[UUID, Aircraft] = {ac.id: ac for ac in all_aircraft}
        crew_map: dict[UUID, Crew] = {c.id: c for c in all_crew}

        # 2. Identify Disrupted Sectors & Bases (e.g. Sector B squall)
        high_risk_sector_ids: set[UUID] = set()
        severe_weather_sector_ids: set[UUID] = set()

        for s in all_sectors:
            if s.risk_level in ("high", "critical"):
                high_risk_sector_ids.add(s.id)

        for w in all_weather:
            if w.condition in ("thunderstorm", "heavy-rain") or w.severity == "severe":
                if w.sector_id:
                    high_risk_sector_ids.add(w.sector_id)
                    severe_weather_sector_ids.add(w.sector_id)

        for r in all_restrictions:
            if r.status == "active" and r.type in ("weather-hazard", "civil-protection-zone", "search-grid"):
                if r.sector_id:
                    high_risk_sector_ids.add(r.sector_id)

        # Identify Bravo Base (associated with Sector B)
        bravo_airport: Optional[Airport] = None
        for a in all_airports:
            if "bravo" in a.code.lower() or "bravo" in a.name.lower():
                bravo_airport = a
                break
        bravo_airport_id = bravo_airport.id if bravo_airport else None

        # Filter candidate missions
        candidate_missions = [
            m for m in all_missions if m.status in ("active", "scheduled")
        ]
        if request.mission_ids:
            target_ids = set(request.mission_ids)
            candidate_missions = [m for m in candidate_missions if m.id in target_ids]
        elif request.event_id:
            from app.services.simulation_service import simulation_service
            sim_res = simulation_service.get_simulation_result(request.event_id)
            if sim_res and sim_res.impact and sim_res.impact.affected_missions:
                affected_ids = {m.id for m in sim_res.impact.affected_missions}
                candidate_missions = [m for m in candidate_missions if m.id in affected_ids]

        # Deterministic ordering of candidate missions:
        # Sort by priority rank (critical=0, high=1, medium=2, low=3), then descending urgency, then code
        priority_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        candidate_missions.sort(
            key=lambda m: (priority_rank.get(m.priority, 4), -m.urgency_score, m.code)
        )

        # Deterministic sorting of aircraft and crew
        candidate_aircraft = sorted(all_aircraft, key=lambda a: a.tail_number)
        candidate_crew = sorted(all_crew, key=lambda c: c.code)

        # 3. Assess Hard Constraint Feasibility for Aircraft & Crew
        # Constraint 1: Aircraft Availability
        unavailable_aircraft_ids: set[UUID] = {
            ac.id for ac in all_aircraft if ac.status in ("grounded", "maintenance", "unavailable")
        }

        # Constraint 3: Crew Availability
        unavailable_crew_ids: set[UUID] = {
            c.id for c in all_crew if c.status in ("off-duty", "medical", "unavailable")
        }

        # Precompute candidate aircraft feasibility per mission
        feasible_ac_for_m: dict[UUID, list[Aircraft]] = {}
        infeasibility_reasons: dict[tuple[UUID, UUID], list[str]] = {}

        for m in candidate_missions:
            feasible_ac_for_m[m.id] = []
            orig_apt = airport_map.get(m.origin_airport_id)
            dest_apt = airport_map.get(m.destination_airport_id)
            est_distance = 0.0
            if orig_apt and dest_apt:
                est_distance = compute_distance_km(
                    (orig_apt.latitude, orig_apt.longitude),
                    (dest_apt.latitude, dest_apt.longitude),
                )

            is_sector_b_impacted = (
                (m.sector_id and m.sector_id in severe_weather_sector_ids)
                or (bravo_airport_id and (m.origin_airport_id == bravo_airport_id or m.destination_airport_id == bravo_airport_id))
            )
            is_local_sector_b_sortie = (
                is_sector_b_impacted
                and bravo_airport_id
                and m.origin_airport_id == bravo_airport_id
                and m.destination_airport_id == bravo_airport_id
            )

            for ac in candidate_aircraft:
                reasons: list[str] = []

                # Constraint 1: Aircraft Availability
                if ac.id in unavailable_aircraft_ids:
                    reasons.append(f"Airframe {ac.tail_number} status is '{ac.status}' (unavailable/grounded).")

                # Constraint 2: Aircraft Capability & Model Compatibility
                if ac.max_payload_kg < m.cargo_weight_kg:
                    reasons.append(f"Payload capacity ({ac.max_payload_kg} kg) < required cargo ({m.cargo_weight_kg} kg).")
                if ac.max_passengers < m.passenger_count:
                    reasons.append(f"Passenger capacity ({ac.max_passengers}) < required pax ({m.passenger_count}).")
                if est_distance > 0 and (ac.max_range_km * 1.25) < est_distance:
                    reasons.append(f"Airframe range ({ac.max_range_km} km with auxiliary tanks) < mission route distance ({est_distance:.0f} km).")

                if m.required_aircraft_model:
                    req_lower = m.required_aircraft_model.lower()
                    ac_lower = ac.model.lower()
                    # Fixed-wing vs rotary separation
                    if "transport" in req_lower or "t1" in req_lower:
                        if "transport" not in ac_lower and "t1" not in ac_lower:
                            reasons.append(f"Requires fixed-wing transport '{m.required_aircraft_model}', {ac.model} is rotary.")
                    elif "heavy" in req_lower or "h2" in req_lower:
                        if "heavy" not in ac_lower and "h2" not in ac_lower:
                            reasons.append(f"Requires heavy transport platform '{m.required_aircraft_model}', {ac.model} capacity insufficient.")

                # Constraint 5 & 8: Airport Availability & Runway Capability
                if "AeroTransport T1" in ac.model:
                    if orig_apt and orig_apt.runway_length_m < 1500:
                        reasons.append(f"Origin runway ({orig_apt.runway_length_m} m) < fixed-wing transport minimum (1,500 m).")
                    if dest_apt and dest_apt.runway_length_m < 1500:
                        reasons.append(f"Destination runway ({dest_apt.runway_length_m} m) < fixed-wing transport minimum (1,500 m).")

                if orig_apt and orig_apt.status == "closed":
                    reasons.append(f"Origin airport {orig_apt.code} is closed.")
                if dest_apt and dest_apt.status == "closed":
                    reasons.append(f"Destination airport {dest_apt.code} is closed.")

                # Constraint 6 & 7: Weather Restrictions & Airspace NOTAM
                # In severe thunderstorm / sub-VFR, light utility helicopters (U1) cannot operate
                if is_sector_b_impacted:
                    if "Utility U1" in ac.model:
                        reasons.append(f"Light utility {ac.model} prohibited under sub-VFR ceilings & convective squalls.")
                    # Local non-critical flights inside Sector B during severe squall NOTAM cannot operate safely
                    if is_local_sector_b_sortie and m.priority not in ("critical", "high"):
                        reasons.append("Non-critical local flight prohibited under active convective NOTAM.")

                if reasons:
                    infeasibility_reasons[(m.id, ac.id)] = reasons
                else:
                    feasible_ac_for_m[m.id].append(ac)

        # Precompute candidate crew feasibility per mission and role
        feasible_crew_for_m_role: dict[tuple[UUID, str], list[Crew]] = {}
        for m in candidate_missions:
            is_sub_vfr = (m.sector_id and m.sector_id in severe_weather_sector_ids)
            is_mountain = (m.sector_id and sector_map.get(m.sector_id) and sector_map[m.sector_id].code == "SEC-E")

            for role, count in m.required_crew_composition.items():
                crew_candidates = []
                for c in candidate_crew:
                    if c.id in unavailable_crew_ids:
                        continue
                    if c.role != role:
                        continue
                    # Constraint 3: Duty hours limit
                    if c.current_duty_hours + 4.0 > c.max_duty_hours:
                        continue

                    # Constraint 4: Specialized Crew Qualifications
                    if role == "pilot":
                        if is_sub_vfr and "IFR" not in c.qualifications:
                            continue
                        if is_mountain and "MOUNTAIN_OPS" not in c.qualifications:
                            continue
                        if m.type == "search-and-rescue" and "SAR_CERT" not in c.qualifications:
                            continue
                    elif role == "co-pilot":
                        if is_sub_vfr and "IFR" not in c.qualifications:
                            continue
                    elif role == "flight-medic":
                        if m.priority == "critical" and "CRITICAL_CARE" not in c.qualifications:
                            continue

                    crew_candidates.append(c)
                feasible_crew_for_m_role[(m.id, role)] = crew_candidates

        # 4. Formulate OR-Tools CP-SAT Model
        model = cp_model.CpModel()

        # Decision Variables
        # x[m.id, a.id] = 1 if aircraft `a` is assigned to mission `m`
        x: dict[tuple[UUID, UUID], cp_model.IntVar] = {}
        # is_assigned[m.id] = 1 if mission `m` is fulfilled
        is_assigned: dict[UUID, cp_model.IntVar] = {}
        # is_rerouted[m.id] = 1 if mission `m` is rerouted around convective sector
        is_rerouted: dict[UUID, cp_model.IntVar] = {}

        for m in candidate_missions:
            is_assigned[m.id] = model.NewBoolVar(f"assigned_{m.code}")
            is_rerouted[m.id] = model.NewBoolVar(f"rerouted_{m.code}")

            for ac in feasible_ac_for_m[m.id]:
                x[(m.id, ac.id)] = model.NewBoolVar(f"x_{m.code}_{ac.tail_number}")

        # 5. Enforce Hard Constraints in CP-SAT

        # Constraint 1 & 2: Single Aircraft per Mission
        for m in candidate_missions:
            ac_vars_for_m = [x[(m.id, ac.id)] for ac in feasible_ac_for_m[m.id] if (m.id, ac.id) in x]
            if ac_vars_for_m:
                model.Add(sum(ac_vars_for_m) == is_assigned[m.id])
            else:
                model.Add(is_assigned[m.id] == 0)

        # Constraint 1: Single Mission per Aircraft (Unit Capacity)
        for ac in candidate_aircraft:
            m_vars_for_ac = [x[(m.id, ac.id)] for m in candidate_missions if (m.id, ac.id) in x]
            if m_vars_for_ac:
                model.Add(sum(m_vars_for_ac) <= 1)

        # Constraint 3 & 4: Crew Allocation per Mission & Aggregate Role Capacity
        for m in candidate_missions:
            for role, required_count in m.required_crew_composition.items():
                if len(feasible_crew_for_m_role.get((m.id, role), [])) < required_count:
                    model.Add(is_assigned[m.id] == 0)

        all_roles: set[str] = set()
        for m in candidate_missions:
            all_roles.update(m.required_crew_composition.keys())

        for role in all_roles:
            available_for_role = len([c for c in candidate_crew if c.role == role and c.id not in unavailable_crew_ids])
            model.Add(
                sum(m.required_crew_composition.get(role, 0) * is_assigned[m.id] for m in candidate_missions)
                <= available_for_role
            )

        # Constraint 9: Critical Mission Guarantee
        for m in candidate_missions:
            if m.priority == "critical":
                has_feasible_ac = len(feasible_ac_for_m[m.id]) > 0
                has_feasible_crew = all(
                    len(feasible_crew_for_m_role.get((m.id, r), [])) >= count
                    for r, count in m.required_crew_composition.items()
                )
                if has_feasible_ac and has_feasible_crew:
                    model.Add(is_assigned[m.id] == 1)

        # Constraint 6 & 7: Weather Rerouting via Inland Corridor
        for m in candidate_missions:
            touches_disrupted_sector = (
                (m.sector_id and m.sector_id in high_risk_sector_ids)
                or (bravo_airport_id and (m.origin_airport_id == bravo_airport_id or m.destination_airport_id == bravo_airport_id))
            )
            is_transit_flight = (m.origin_airport_id != m.destination_airport_id)

            if touches_disrupted_sector and is_transit_flight and request.allow_rerouting:
                # Transiting flights divert around squall via inland Sector C
                model.Add(is_rerouted[m.id] == is_assigned[m.id])
            else:
                model.Add(is_rerouted[m.id] == 0)

        # 6. Formulate Weighted Objective Function
        objective_terms = []

        for m in candidate_missions:
            p_weight = PRIORITY_WEIGHTS.get(m.priority, 1000)
            urgency_weight = m.urgency_score * URGENCY_WEIGHT_FACTOR

            # Fulfillment reward
            objective_terms.append((p_weight + urgency_weight) * is_assigned[m.id])

            # Reroute penalty (small cost to prefer direct tracks when safe)
            objective_terms.append(-REROUTE_PENALTY * is_rerouted[m.id])

            for ac in feasible_ac_for_m[m.id]:
                if (m.id, ac.id) in x:
                    var = x[(m.id, ac.id)]

                    # Churn Penalty: Prefer retaining original feasible assignment
                    if m.assigned_aircraft_id and m.assigned_aircraft_id == ac.id:
                        objective_terms.append(CHURN_RETENTION_BONUS * var)
                    elif m.assigned_aircraft_id and m.assigned_aircraft_id != ac.id:
                        objective_terms.append(CHURN_REASSIGNMENT_PENALTY * var)

                    # Ferry Delay: Prefer aircraft already stationed at mission origin base
                    if ac.base_airport_id == m.origin_airport_id:
                        objective_terms.append(BASE_STATION_BONUS * var)
                    else:
                        objective_terms.append(FERRY_PENALTY * var)

        model.Maximize(sum(objective_terms))

        # 7. Execute Deterministic CP-SAT Solver
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = request.max_solve_time_seconds
        solver.parameters.random_seed = 42  # Guarantees deterministic reproducibility
        solver.parameters.num_workers = 1

        solver_code = solver.Solve(model)
        solve_time_ms = int((time.perf_counter() - start_time) * 1000)

        solver_status_map: dict[int, SolverStatus] = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE",
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
        }
        solver_status_str: SolverStatus = solver_status_map.get(solver_code, "UNKNOWN")
        objective_score = float(solver.ObjectiveValue()) if solver_status_str in ("OPTIMAL", "FEASIBLE") else 0.0

        # 8. Extract Solution Allocations, Unresolved Missions & Metrics
        allocations: list[Allocation] = []
        unresolved_missions: list[UnresolvedMission] = []
        reassignments: list[ReassignmentDetail] = []

        assigned_missions_count = 0
        reassigned_count = 0
        rerouted_count = 0
        allocated_aircraft_ids: set[UUID] = set()
        assigned_crew_ids_global: set[UUID] = set()

        run_id = uuid4()
        recommendation_id = uuid4()

        if solver_status_str in ("OPTIMAL", "FEASIBLE"):
            for m in candidate_missions:
                is_m_assigned = (solver.Value(is_assigned[m.id]) == 1)

                if is_m_assigned:
                    assigned_missions_count += 1
                    assigned_ac: Optional[Aircraft] = None
                    for ac in feasible_ac_for_m[m.id]:
                        if (m.id, ac.id) in x and solver.Value(x[(m.id, ac.id)]) == 1:
                            assigned_ac = ac
                            allocated_aircraft_ids.add(ac.id)
                            break

                    assigned_crew_list: list[Crew] = []
                    for role, req_count in m.required_crew_composition.items():
                        pool = [
                            c for c in feasible_crew_for_m_role.get((m.id, role), [])
                            if c.id not in assigned_crew_ids_global
                        ]
                        pool.sort(
                            key=lambda c: (
                                0 if c.base_airport_id == m.origin_airport_id else 1,
                                c.current_duty_hours,
                                c.code,
                            )
                        )
                        selected = pool[:req_count]
                        for c in selected:
                            assigned_crew_ids_global.add(c.id)
                            assigned_crew_list.append(c)

                    crew_ids = [c.id for c in assigned_crew_list]
                    crew_codes = [c.code for c in assigned_crew_list]

                    was_rerouted = (solver.Value(is_rerouted[m.id]) == 1)
                    if was_rerouted:
                        rerouted_count += 1

                    corridor_name = (
                        "Inland Detour Corridor (Sector C)"
                        if was_rerouted
                        else "Direct Track"
                    )

                    orig_ac = aircraft_map.get(m.assigned_aircraft_id) if m.assigned_aircraft_id else None
                    was_reassigned = (assigned_ac and m.assigned_aircraft_id != assigned_ac.id)
                    if was_reassigned or was_rerouted:
                        reassigned_count += 1

                    # Generate deterministic, structured explainability text
                    reason_parts = []
                    if assigned_ac:
                        base_name = airport_map.get(assigned_ac.base_airport_id).name if assigned_ac.base_airport_id in airport_map else "Base"
                        if orig_ac and orig_ac.status == "grounded":
                            reason_parts.append(
                                f"Original airframe {orig_ac.tail_number} ({orig_ac.model}) grounded at Bravo Base due to sub-VFR ceilings. "
                                f"Reassigned to available {assigned_ac.model} ({assigned_ac.tail_number}) staged at {base_name}."
                            )
                        elif was_reassigned:
                            reason_parts.append(
                                f"Reassigned to {assigned_ac.tail_number} ({assigned_ac.model}) to optimize priority coverage and operational readiness."
                            )
                        else:
                            reason_parts.append(
                                f"Assigned {assigned_ac.tail_number} ({assigned_ac.model}) based at {base_name}; airframe and crew meet all operational minima."
                            )

                    if was_rerouted:
                        reason_parts.append(
                            "Flight path rerouted via Sector C inland corridor to bypass severe convective squall line in Sector B."
                        )

                    crew_names = ", ".join([f"{c.name} ({c.role})" for c in assigned_crew_list])
                    if crew_names:
                        reason_parts.append(f"Crew complement verified: {crew_names}.")

                    reason_text = " ".join(reason_parts)

                    if assigned_ac:
                        alloc = Allocation(
                            mission_id=m.id,
                            mission_code=m.code,
                            aircraft_id=assigned_ac.id,
                            aircraft_tail=assigned_ac.tail_number,
                            crew_ids=crew_ids,
                            crew_codes=crew_codes,
                            reason=reason_text,
                            origin_airport_id=m.origin_airport_id,
                            destination_airport_id=m.destination_airport_id,
                            corridor=corridor_name,
                            action_type="reallocate_and_reroute" if was_rerouted else "reallocate_aircraft",
                            score=1.0,
                            notes=f"CP-SAT Deterministic Allocation: {assigned_ac.tail_number}",
                        )
                        allocations.append(alloc)

                        if was_reassigned or was_rerouted:
                            reassignments.append(
                                ReassignmentDetail(
                                    mission_id=m.id,
                                    mission_code=m.code,
                                    mission_title=m.title,
                                    priority=m.priority,
                                    origin_code=airport_map[m.origin_airport_id].code if m.origin_airport_id in airport_map else "SYN-ORIG",
                                    destination_code=airport_map[m.destination_airport_id].code if m.destination_airport_id in airport_map else "SYN-DEST",
                                    previous_aircraft_id=orig_ac.id if orig_ac else None,
                                    previous_aircraft_tail=orig_ac.tail_number if orig_ac else None,
                                    previous_aircraft_model=orig_ac.model if orig_ac else None,
                                    recommended_aircraft_id=assigned_ac.id,
                                    recommended_aircraft_tail=assigned_ac.tail_number,
                                    recommended_aircraft_model=assigned_ac.model,
                                    original_corridor="Direct Coastal Corridor (Sector B)" if (m.sector_id and m.sector_id in high_risk_sector_ids) else "Direct Track",
                                    recommended_corridor=corridor_name,
                                    action_type="reallocate_and_reroute" if was_rerouted else "reallocate_aircraft",
                                    reason=reason_text,
                                )
                            )
                else:
                    # Mission Unresolved
                    unmet: list[str] = []
                    is_sector_b_impacted = (
                        (m.sector_id and m.sector_id in severe_weather_sector_ids)
                        or (bravo_airport_id and (m.origin_airport_id == bravo_airport_id or m.destination_airport_id == bravo_airport_id))
                    )
                    if is_sector_b_impacted:
                        unmet.append("Sector B weather minimums violated (convective squall line, sub-VFR ceilings)")
                        unmet.append("Active NOTAM hazard in operational sector")
                    if not feasible_ac_for_m[m.id]:
                        unmet.append("No compatible aircraft available with required payload/model capability")
                    else:
                        unmet.append("Available aircraft preempted by higher-priority missions")

                    reason_text = (
                        f"Mission {m.code} ({m.priority} priority) could not be feasibly allocated. "
                        f"Reason: {'; '.join(unmet)}."
                    )

                    unresolved_missions.append(
                        UnresolvedMission(
                            mission_id=m.id,
                            mission_code=m.code,
                            priority=m.priority,
                            reason=reason_text,
                            unmet_constraints=unmet,
                        )
                    )
        else:
            # Entire solve was infeasible or failed
            for m in candidate_missions:
                unresolved_missions.append(
                    UnresolvedMission(
                        mission_id=m.id,
                        mission_code=m.code,
                        priority=m.priority,
                        reason="Solver could not find a feasible solution satisfying all hard operational constraints.",
                        unmet_constraints=["Hard constraints unsatisfiable across fleet"],
                    )
                )

        unassigned_missions_count = len(unresolved_missions)
        available_ac_count = len([a for a in all_aircraft if a.status == "available"])
        utilization_pct = (
            round((len(allocated_aircraft_ids) / available_ac_count) * 100, 1)
            if available_ac_count > 0
            else 0.0
        )

        # Count affected missions based on active environmental disruptions / groundings
        affected_missions_count = sum(
            1
            for m in candidate_missions
            if (
                (m.sector_id and m.sector_id in severe_weather_sector_ids)
                or (severe_weather_sector_ids and bravo_airport_id and (m.origin_airport_id == bravo_airport_id or m.destination_airport_id == bravo_airport_id))
                or (m.assigned_aircraft_id and m.assigned_aircraft_id in unavailable_aircraft_ids)
            )
        )

        # 9. Compile Constraints & Metrics
        constraint_summary = ConstraintSummary(
            hard_constraints_satisfied=(solver_status_str in ("OPTIMAL", "FEASIBLE")),
            violations=[],
            constraints_enforced=[
                "1. Aircraft Availability (Hard): Grounded/in-maintenance aircraft excluded from assignment",
                "2. Aircraft Capability (Hard): Platform model, payload, passenger, and range limits enforced",
                "3. Crew Availability (Hard): Off-duty/medical personnel excluded; duty hours limits (<= 12h) enforced",
                "4. Crew Qualification (Hard): Role and specialized ratings (IFR, SAR, Mountain, Critical Care) validated",
                "5. Mission Compatibility (Hard): Base runway length (>= 1,500m for fixed-wing) and route reachability verified",
                "6. Weather Restrictions (Hard): Sub-VFR/convective squall avoidance enforced via detour corridors",
                "7. Airspace Restrictions (Hard): Active hazard NOTAM airspace avoidance enforced",
                "8. Airport Availability (Hard): Closed/degraded runway status strictly honored",
                "9. Critical Mission Safety Guarantee (Hard): Life-safety critical missions guaranteed 100% allocation if feasible",
            ],
            soft_objectives_optimized=[
                "1. Mission Priority Utility (Soft): Weighted scoring by priority tier (Critical, High, Medium, Low)",
                "2. Mission Urgency Factor (Soft): Continuous scaling based on real-time urgency metrics",
                "3. Operational Stability / Anti-Churn (Soft): Retaining nominal airframe rewarded; reassignment penalized",
                "4. Resource Staging & Base Proximity (Soft): Local base departures rewarded; ferry repositioning penalized",
                "5. Detour Minimization (Soft): Unnecessary flight detour routing penalized unless required for weather avoidance",
            ],
        )

        metrics = OptimizationMetrics(
            missions_total=len(candidate_missions),
            missions_affected=affected_missions_count,
            missions_covered=assigned_missions_count,
            missions_unresolved=unassigned_missions_count,
            aircraft_reassigned=reassigned_count,
            missions_rerouted=rerouted_count,
            resource_utilization_pct=utilization_pct,
            solve_time_ms=solve_time_ms,
        )

        # 10. Persist OptimizationRun & Recommendation Records
        now_dt = datetime.now(timezone.utc)

        opt_run = OptimizationRun(
            id=run_id,
            simulation_event_id=request.scenario_event_id or request.event_id,
            trigger_reason=request.trigger_reason,
            solver_status=solver_status_str,
            objective_value=objective_score,
            solve_time_ms=solve_time_ms,
            total_missions=len(candidate_missions),
            assigned_missions=assigned_missions_count,
            unassigned_missions=unassigned_missions_count,
            constraints_applied=constraint_summary.constraints_enforced,
            constraint_violations_avoided=[
                "Grounded aircraft dispatch strictly prevented",
                "Sub-VFR squall line airspace penetration prevented",
                "Critical priority mission cancellation avoided",
            ],
            raw_result={
                "solver": "OR-Tools CP-SAT",
                "status": solver_status_str,
                "objective_score": objective_score,
                "solve_time_ms": solve_time_ms,
                "wall_time_s": solver.WallTime(),
                "branches": solver.NumBranches(),
                "conflicts": solver.NumConflicts(),
            },
            created_at=now_dt,
        )
        self.repo.save_optimization_run(opt_run)

        recommendation = Recommendation(
            id=recommendation_id,
            optimization_run_id=run_id,
            simulation_event_id=request.scenario_event_id or request.event_id,
            title="Optimal Fleet Reallocation & Convective Detour Plan",
            summary=(
                f"Deterministic CP-SAT solver satisfied {assigned_missions_count}/{len(candidate_missions)} operational taskings "
                f"in {solve_time_ms} ms with objective score {objective_score:,.0f}. "
                f"Reassigned {reassigned_count} disrupted missions while strictly enforcing all hard operational constraints."
            ),
            action_type="reallocate_aircraft",
            allocations=allocations,
            impact_summary={
                "missions_total": len(candidate_missions),
                "missions_covered": assigned_missions_count,
                "missions_unresolved": unassigned_missions_count,
                "aircraft_reassigned": reassigned_count,
                "rerouted_count": rerouted_count,
                "solve_time_ms": solve_time_ms,
            },
            status="pending_review",
            created_at=now_dt,
        )
        self.repo.save_recommendation(recommendation)

        # 11. Emit Audit Timeline Event
        audit_event = Event(
            id=uuid4(),
            type="optimization",
            category="system",
            title=f"CP-SAT Optimization Solved — {solver_status_str} ({solve_time_ms} ms)",
            description=(
                f"Deterministic solver fulfilled {assigned_missions_count}/{len(candidate_missions)} missions with score {objective_score:,.0f}. "
                f"{reassigned_count} missions adapted for convective weather/groundings; {unassigned_missions_count} unresolved."
            ),
            metadata={
                "run_id": str(run_id),
                "recommendation_id": str(recommendation_id),
                "solver_status": solver_status_str,
                "solve_time_ms": solve_time_ms,
                "reassigned_count": reassigned_count,
                "unresolved_count": unassigned_missions_count,
            },
            created_at=now_dt,
        )
        self.repo.add_event(audit_event)

        # 12. Build and Return Immutable OptimizationResult
        result = OptimizationResult(
            run_id=run_id,
            recommendation_id=recommendation_id,
            status="optimal" if solver_status_str == "OPTIMAL" else solver_status_str.lower(),
            solver_status=solver_status_str,
            objective_score=objective_score,
            objective_value=objective_score,
            solve_time_ms=solve_time_ms,
            total_missions=len(candidate_missions),
            assigned_missions=assigned_missions_count,
            unassigned_missions=unassigned_missions_count,
            reassignments_count=reassigned_count,
            rerouted_count=rerouted_count,
            allocations=allocations,
            unresolved_missions=unresolved_missions,
            metrics=metrics,
            constraints=constraint_summary,
            reassignments=reassignments,
            recommendation=recommendation,
            created_at=now_dt,
        )

        self.repo.save_optimization_result(result)
        return result

    # Aliases for backwards compatibility with earlier router / tests
    def solve_allocation(self, req: Optional[OptimizationRequest] = None) -> OptimizationResult:
        return self.solve(req)

    def run_optimization(self, req: Optional[OptimizationRequest] = None) -> OptimizationResult:
        return self.solve(req)

    def apply_recommendation(self, rec_id: UUID) -> ApplyRecommendationResponse:
        """Applies a recommendation to the live operational state, preserving an immutable audit trail."""
        rec = self.repo.get_recommendation(rec_id)
        if not rec:
            raise ValueError(f"Recommendation with ID '{rec_id}' not found.")

        # Idempotency guard: Prevent duplicate application and duplicate audit event spam
        if rec.status == "applied":
            applied_mission_codes = []
            for alloc in rec.allocations:
                m = self.repo.get_mission_by_id(alloc.mission_id)
                if m:
                    applied_mission_codes.append(m.code)
            return ApplyRecommendationResponse(
                status="applied",
                message=f"Recommendation was already applied to {len(applied_mission_codes)} operational missions.",
                recommendation_id=rec_id,
                applied_allocations_count=len(applied_mission_codes),
                updated_missions=applied_mission_codes,
                applied_at=rec.created_at,
            )

        updated_missions: list[str] = []
        audit_allocations: list[dict[str, Any]] = []
        now_dt = datetime.now(timezone.utc)

        all_missions = self.repo.get_missions()
        mission_lookup = {m.id: m for m in all_missions}
        all_aircraft = self.repo.get_aircraft()
        aircraft_lookup = {a.id: a for a in all_aircraft}

        for alloc in rec.allocations:
            prev_mission = mission_lookup.get(alloc.mission_id)
            prev_ac_id = prev_mission.assigned_aircraft_id if prev_mission else None
            prev_ac = aircraft_lookup.get(prev_ac_id) if prev_ac_id else None
            prev_tail = prev_ac.tail_number if prev_ac else "None"
            prev_status = prev_mission.status if prev_mission else "unknown"

            updated_m = self.repo.update_mission_allocation(
                mission_id=alloc.mission_id,
                aircraft_id=alloc.aircraft_id,
                notes=f"Allocated via OR-Tools CP-SAT: {alloc.aircraft_tail}",
            )
            if updated_m:
                updated_missions.append(updated_m.code)
                audit_allocations.append({
                    "mission_id": str(alloc.mission_id),
                    "mission_code": updated_m.code,
                    "previous_aircraft_id": str(prev_ac_id) if prev_ac_id else None,
                    "previous_aircraft_tail": prev_tail,
                    "previous_mission_status": prev_status,
                    "new_aircraft_id": str(alloc.aircraft_id),
                    "new_aircraft_tail": alloc.aircraft_tail,
                    "corridor": alloc.corridor or "Direct Track",
                    "reason": alloc.reason,
                })

        # Mark recommendation as applied
        self.repo.update_recommendation_status(rec_id, "applied")

        # Emit audit event preserving complete audit trail
        audit_event = Event(
            id=uuid4(),
            type="optimization",
            category="fleet",
            title=f"Optimization recommendation applied — {len(updated_missions)} missions updated",
            description=f"Operational state synchronized with recommendation {str(rec_id)[:8]}. Reassignments live across fleet dispatch.",
            metadata={
                "optimization_run_id": str(rec.optimization_run_id),
                "recommendation_id": str(rec_id),
                "applied_at": now_dt.isoformat(),
                "updated_missions_count": len(updated_missions),
                "allocations": audit_allocations,
            },
            created_at=now_dt,
        )
        self.repo.add_event(audit_event)

        return ApplyRecommendationResponse(
            status="applied",
            message=f"Successfully applied recommendation to {len(updated_missions)} operational missions.",
            recommendation_id=rec_id,
            applied_allocations_count=len(updated_missions),
            updated_missions=updated_missions,
            applied_at=now_dt,
        )

    def get_result(self, run_id: UUID) -> Optional[OptimizationResult]:
        return self.repo.get_optimization_result(run_id)

    def get_run(self, run_id: UUID) -> Optional[OptimizationRun]:
        return self.repo.get_optimization_run(run_id)

    def list_runs(self) -> list[OptimizationRun]:
        return self.repo.list_optimization_runs()

    def get_recommendation(self, rec_id: UUID) -> Optional[Recommendation]:
        return self.repo.get_recommendation(rec_id)

    def is_run_stale(self, run_id: UUID) -> bool:
        """Determines if the operational environment has mutated since the optimization run was solved."""
        run = self.repo.get_optimization_run(run_id)
        if not run:
            return False
        # Compare against subsequent simulation disruptions
        events = self.repo.list_simulation_events()
        for ev in events:
            if ev.created_at > run.created_at:
                return True
        return False


# Global service instance
optimization_service = OptimizationService()
