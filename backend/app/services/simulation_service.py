"""AEROSYNC — Simulation Engine Service (Phase 6).

Implements the deterministic operational state machine:
EVENT → STATE CHANGE → IMPACT DETECTION → BEFORE/AFTER SNAPSHOT → PERSISTENCE
"""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4
from app.db.repository import repository
from app.services.readiness_service import readiness_service
from app.models import (
    SimulationEvent,
    SimulationScenarioRequest,
    SimulationResult,
    SimulationImpact,
    ImpactedSector,
    ImpactedAircraft,
    ImpactedMission,
    ImpactedRoute,
    OperationalSnapshot,
    Event,
    Sector,
    Airport,
    Mission,
    Aircraft,
    WeatherCondition,
)


class SimulationService:
    def __init__(self, repo=repository, readiness_svc=readiness_service):
        self.repo = repo
        self.readiness_svc = readiness_svc
        self._results_by_id: dict[UUID, SimulationResult] = {}

    def execute_scenario(
        self, scenario_request: SimulationScenarioRequest
    ) -> SimulationResult:
        """Execute a deterministic simulation scenario and record before/after state transitions."""
        scenario = scenario_request.scenario
        target_id = scenario_request.target_id.strip()

        # 1. Validate scenario
        supported_scenarios = [
            "weather_deterioration",
            "aircraft_unavailable",
            "airspace_restriction",
        ]
        if scenario not in supported_scenarios:
            raise ValueError(
                f"Unsupported scenario type: '{scenario}'. Supported scenarios: {supported_scenarios}"
            )

        # 2. Validate target sector
        sectors = self.repo.get_sectors()
        target_sector: Optional[Sector] = None
        for s in sectors:
            if s.code.lower() == target_id.lower() or str(s.id) == target_id:
                target_sector = s
                break

        if not target_sector:
            raise ValueError(f"Target sector '{target_id}' not found.")

        # 3. Capture State Before
        readiness_before = self.readiness_svc.calculate_readiness()
        weather_before_list = self.repo.get_weather(sector_id=target_sector.id)
        current_weather = (
            weather_before_list[0]
            if weather_before_list
            else WeatherCondition(
                id=uuid4(),
                region=target_sector.name,
                sector_id=target_sector.id,
                condition="scattered-clouds",
                severity="none",
                visibility_km=8.5,
                wind_speed_kts=14,
                wind_direction_deg=240,
                ceiling_ft=4200,
                temperature_c=29.0,
                is_vfr=True,
                valid_from=datetime.now(timezone.utc),
                valid_until=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
            )
        )

        state_before = {
            "readiness_score": readiness_before.operational_readiness_pct,
            "readiness_status": readiness_before.status_level,
            "fleet": {
                "total": readiness_before.fleet.total,
                "available": readiness_before.fleet.available,
                "in_mission": readiness_before.fleet.in_mission,
                "maintenance": readiness_before.fleet.maintenance,
                "grounded": readiness_before.fleet.grounded,
            },
            "crew": {
                "total": readiness_before.crew.total,
                "available": readiness_before.crew.available,
                "on_mission": readiness_before.crew.on_mission,
                "off_duty": readiness_before.crew.off_duty,
            },
            "missions": {
                "total": readiness_before.missions.total,
                "active": readiness_before.missions.active,
                "scheduled": readiness_before.missions.scheduled,
                "critical": readiness_before.missions.critical,
                "high": readiness_before.missions.high,
            },
            "sector": {
                "code": target_sector.code,
                "name": target_sector.name,
                "risk_level": target_sector.risk_level,
                "visibility_km": current_weather.visibility_km,
                "ceiling_ft": current_weather.ceiling_ft,
                "wind_speed_kts": current_weather.wind_speed_kts,
                "condition": current_weather.condition,
                "severity": current_weather.severity,
                "is_vfr": current_weather.is_vfr,
            },
        }

        # 4. Impact Detection from actual database relationships
        airports = self.repo.get_airports()
        airport_map = {a.id: a for a in airports}
        target_airport: Optional[Airport] = None
        for a in airports:
            if "bravo" in a.code.lower() or "bravo" in a.name.lower():
                target_airport = a
                break

        target_airport_id = target_airport.id if target_airport else None

        # Identify missions operating through target sector or base
        all_missions = self.repo.get_missions()
        affected_missions: list[Mission] = []
        for m in all_missions:
            in_sector = m.sector_id == target_sector.id
            uses_target_base = (
                target_airport_id is not None
                and (m.origin_airport_id == target_airport_id or m.destination_airport_id == target_airport_id)
            )
            if in_sector or uses_target_base:
                affected_missions.append(m)

        # Identify aircraft assigned to these missions or stationed at Bravo
        all_aircraft = self.repo.get_aircraft()
        aircraft_map = {ac.id: ac for ac in all_aircraft}
        affected_aircraft_ids: set[UUID] = set()

        for m in affected_missions:
            if m.assigned_aircraft_id:
                affected_aircraft_ids.add(m.assigned_aircraft_id)

        # Also aircraft based at Bravo
        for ac in all_aircraft:
            if target_airport_id and ac.base_airport_id == target_airport_id:
                affected_aircraft_ids.add(ac.id)

        affected_aircraft_list = [
            aircraft_map[ac_id] for ac_id in affected_aircraft_ids if ac_id in aircraft_map
        ]

        # 5. Apply State Mutation
        # Deterministic weather parameters
        params = scenario_request.parameters
        mutated_vis_km = float(params.get("visibility_km", 2.5))
        mutated_ceil_ft = int(params.get("ceiling_ft", 1500))
        mutated_wind_kts = int(params.get("wind_speed_kts", 28))
        mutated_condition = "thunderstorm"
        mutated_severity = "severe"
        mutated_is_vfr = False

        # Mutate weather in repository
        self.repo.update_weather_for_sector(
            target_sector.id,
            {
                "condition": mutated_condition,
                "severity": mutated_severity,
                "visibility_km": mutated_vis_km,
                "ceiling_ft": mutated_ceil_ft,
                "wind_speed_kts": mutated_wind_kts,
                "wind_direction_deg": 260,
                "is_vfr": mutated_is_vfr,
            },
        )

        # Mutate sector status and risk in repository
        self.repo.update_sector(
            target_sector.id,
            {
                "risk_level": "high",
                "notes": "Severe convective squall line active. Ceilings below 1,500 ft AGL. VFR flight operations suspended.",
            },
        )

        # Ground 2 aircraft at Bravo without specialized radar due to sub-VFR minimums
        impacted_aircraft_models: list[ImpactedAircraft] = []
        grounded_count = 0
        for ac in affected_aircraft_list:
            if grounded_count < 2 and ac.status == "available":
                self.repo.update_aircraft_status(ac.id, "grounded")
                grounded_count += 1
                impacted_aircraft_models.append(
                    ImpactedAircraft(
                        id=ac.id,
                        tail_number=ac.tail_number,
                        model=ac.model,
                        status_before="available",
                        status_after="grounded",
                        reason="Grounded due to sub-VFR ceilings (1,500 ft < 2,000 ft operational minimum).",
                    )
                )
            else:
                impacted_aircraft_models.append(
                    ImpactedAircraft(
                        id=ac.id,
                        tail_number=ac.tail_number,
                        model=ac.model,
                        status_before=ac.status,
                        status_after=ac.status,
                        reason="Assigned mission corridor impacted by convective turbulence.",
                    )
                )

        # Activate NOTAM in Sector B
        restrictions = self.repo.get_airspace_restrictions(sector_id=target_sector.id)
        for r in restrictions:
            self.repo.update_airspace_restriction_status(r.id, "active")

        # Create audit Event in events feed
        operational_event = Event(
            id=uuid4(),
            type="warning",
            category="weather",
            title=f"Weather deterioration detected — {target_sector.code}",
            description=(
                f"Severe convective squall line detected in {target_sector.name}. "
                f"Visibility dropped to {mutated_vis_km} km, ceiling {mutated_ceil_ft} ft, winds {mutated_wind_kts} kts. "
                f"VFR suspended. {len(affected_missions)} sorties and {len(impacted_aircraft_models)} aircraft affected."
            ),
            metadata={
                "sector": target_sector.code,
                "visibility_km": mutated_vis_km,
                "ceiling_ft": mutated_ceil_ft,
                "wind_speed_kts": mutated_wind_kts,
                "affected_missions_count": len(affected_missions),
                "grounded_aircraft_count": grounded_count,
            },
            created_at=datetime.now(timezone.utc),
        )
        self.repo.add_event(operational_event)

        # 6. Capture State After
        readiness_after = self.readiness_svc.calculate_readiness()

        state_after = {
            "readiness_score": readiness_after.operational_readiness_pct,
            "readiness_status": readiness_after.status_level,
            "fleet": {
                "total": readiness_after.fleet.total,
                "available": readiness_after.fleet.available,
                "in_mission": readiness_after.fleet.in_mission,
                "maintenance": readiness_after.fleet.maintenance,
                "grounded": readiness_after.fleet.grounded,
            },
            "crew": {
                "total": readiness_after.crew.total,
                "available": readiness_after.crew.available,
                "on_mission": readiness_after.crew.on_mission,
                "off_duty": readiness_after.crew.off_duty,
            },
            "missions": {
                "total": readiness_after.missions.total,
                "active": readiness_after.missions.active,
                "scheduled": readiness_after.missions.scheduled,
                "critical": readiness_after.missions.critical,
                "high": readiness_after.missions.high,
            },
            "sector": {
                "code": target_sector.code,
                "name": target_sector.name,
                "risk_level": "high",
                "visibility_km": mutated_vis_km,
                "ceiling_ft": mutated_ceil_ft,
                "wind_speed_kts": mutated_wind_kts,
                "condition": mutated_condition,
                "severity": mutated_severity,
                "is_vfr": mutated_is_vfr,
            },
        }

        # 7. Construct Structured Impact Objects
        impacted_sectors_models = [
            ImpactedSector(
                id=target_sector.id,
                code=target_sector.code,
                name=target_sector.name,
                risk_before=target_sector.risk_level,
                risk_after="high",
                weather_condition_before=current_weather.condition,
                weather_condition_after=mutated_condition,
                ceiling_ft_before=current_weather.ceiling_ft,
                ceiling_ft_after=mutated_ceil_ft,
                visibility_km_before=current_weather.visibility_km,
                visibility_km_after=mutated_vis_km,
                wind_kts_before=current_weather.wind_speed_kts,
                wind_kts_after=mutated_wind_kts,
            )
        ]

        impacted_missions_models: list[ImpactedMission] = []
        impacted_routes_models: list[ImpactedRoute] = []

        for m in affected_missions:
            orig = airport_map.get(m.origin_airport_id)
            dest = airport_map.get(m.destination_airport_id)
            orig_code = orig.code if orig else "SYN-UNK"
            dest_code = dest.code if dest else "SYN-UNK"
            assigned_tail = (
                aircraft_map[m.assigned_aircraft_id].tail_number
                if m.assigned_aircraft_id and m.assigned_aircraft_id in aircraft_map
                else None
            )

            impacted_missions_models.append(
                ImpactedMission(
                    id=m.id,
                    code=m.code,
                    title=m.title,
                    priority=m.priority,
                    assigned_aircraft_id=m.assigned_aircraft_id,
                    assigned_aircraft_tail=assigned_tail,
                    origin_code=orig_code,
                    destination_code=dest_code,
                    impact_reason="Route corridor and operating minima compromised by convective squalls.",
                )
            )

            impacted_routes_models.append(
                ImpactedRoute(
                    mission_code=m.code,
                    origin_code=orig_code,
                    destination_code=dest_code,
                    sector_code=target_sector.code,
                    status="affected",
                )
            )

        impact = SimulationImpact(
            affected_sectors=impacted_sectors_models,
            affected_aircraft=impacted_aircraft_models,
            affected_missions=impacted_missions_models,
            affected_routes=impacted_routes_models,
            summary={
                "affected_sectors_count": len(impacted_sectors_models),
                "affected_aircraft_count": len(impacted_aircraft_models),
                "affected_missions_count": len(impacted_missions_models),
                "affected_routes_count": len(impacted_routes_models),
                "grounded_aircraft_count": grounded_count,
            },
        )

        # 8. Persist Simulation Event Record
        event_id = uuid4()
        now_time = datetime.now(timezone.utc)

        sim_event = SimulationEvent(
            id=event_id,
            scenario_type=scenario,
            title=f"Severe Weather Deterioration — {target_sector.name}",
            description=(
                f"Atmospheric convective storm cell developed in {target_sector.name}. "
                f"Ceilings reduced to {mutated_ceil_ft} ft, visibility to {mutated_vis_km} km. "
                f"{len(affected_missions)} missions and {grounded_count} grounded aircraft requiring reallocation."
            ),
            parameters={
                "target_id": target_sector.code,
                "visibility_km": mutated_vis_km,
                "ceiling_ft": mutated_ceil_ft,
                "wind_speed_kts": mutated_wind_kts,
                "severity": mutated_severity,
            },
            state_before=OperationalSnapshot(
                aircraft_total=state_before["fleet"]["total"],
                aircraft_available=state_before["fleet"]["available"],
                crew_total=state_before["crew"]["total"],
                crew_available=state_before["crew"]["available"],
                missions_active=state_before["missions"]["active"],
                readiness_score=state_before["readiness_score"] / 100.0,
                details=state_before,
            ),
            state_after=OperationalSnapshot(
                aircraft_total=state_after["fleet"]["total"],
                aircraft_available=state_after["fleet"]["available"],
                crew_total=state_after["crew"]["total"],
                crew_available=state_after["crew"]["available"],
                missions_active=state_after["missions"]["active"],
                readiness_score=state_after["readiness_score"] / 100.0,
                details=state_after,
            ),
            affected_aircraft_ids=list(affected_aircraft_ids),
            affected_crew_ids=[],
            affected_mission_ids=[m.id for m in affected_missions],
            status="completed",
            triggered_at=now_time,
            completed_at=now_time,
            created_at=now_time,
        )

        self.repo.save_simulation_event(sim_event)

        # 9. Return Structured Result
        result = SimulationResult(
            event_id=event_id,
            scenario=scenario,
            target=target_sector.code,
            status="applied",
            state_before=state_before,
            event={
                "id": str(event_id),
                "scenario": scenario,
                "target": target_sector.code,
                "title": sim_event.title,
                "description": sim_event.description,
                "parameters": sim_event.parameters,
                "triggered_at": now_time.isoformat(),
            },
            state_after=state_after,
            impact=impact,
            created_at=now_time,
        )

        self._results_by_id[event_id] = result
        return result

    def get_simulation_result(self, event_id: UUID) -> Optional[SimulationResult]:
        """Retrieve simulation result by ID."""
        if event_id in self._results_by_id:
            return self._results_by_id[event_id]

        event = self.repo.get_simulation_event(event_id)
        if not event:
            return None

        # Reconstruct result from persisted SimulationEvent
        sb_details = event.state_before.details if event.state_before.details else {}
        sa_details = event.state_after.details if event.state_after.details else {}

        target_code = event.parameters.get("target_id", "SEC-B")

        return SimulationResult(
            event_id=event.id,
            scenario=event.scenario_type,
            target=target_code,
            status="applied",
            state_before=sb_details,
            event={
                "id": str(event.id),
                "scenario": event.scenario_type,
                "target": target_code,
                "title": event.title,
                "description": event.description,
                "parameters": event.parameters,
                "triggered_at": event.triggered_at.isoformat(),
            },
            state_after=sa_details,
            impact=SimulationImpact(
                summary={
                    "affected_missions_count": len(event.affected_mission_ids),
                    "affected_aircraft_count": len(event.affected_aircraft_ids),
                }
            ),
            created_at=event.created_at,
        )

    def list_simulation_events(self) -> list[SimulationEvent]:
        """List previously executed simulation scenarios."""
        return self.repo.list_simulation_events()

    def reset_simulation(self) -> dict[str, Any]:
        """Reset operational database back to initial synthetic seed baseline."""
        self.repo.reset_state()
        self._results_by_id.clear()

        # Add reset event to audit feed
        reset_event = Event(
            id=uuid4(),
            type="info",
            category="system",
            title="Operational baseline restored (Simulation Reset)",
            description="All environmental observations, sector risks, aircraft availability, and missions restored to seed baseline.",
            metadata={"status": "baseline_restored"},
            created_at=datetime.now(timezone.utc),
        )
        self.repo.add_event(reset_event)

        return {
            "status": "reset",
            "message": "Operational baseline successfully restored.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


simulation_service = SimulationService()
