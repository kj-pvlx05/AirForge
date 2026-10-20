"""AEROSYNC — Data Repository Layer.

Handles data access logic.
Primary source: Supabase PostgreSQL (via Supabase client).
Development / Test fallback: In-memory `OperationalStore` (when credentials are absent or database is unreachable).
"""

import logging
from typing import Optional
from uuid import UUID
from app.config import settings
from app.db.store import store
from app.db.supabase import is_supabase_configured, get_service_client, get_anon_client
from app.models import (
    Airport,
    Sector,
    Aircraft,
    Crew,
    Mission,
    WeatherCondition,
    AirspaceRestriction,
    SimulationEvent,
    OptimizationRun,
    OptimizationResult,
    Recommendation,
    Event,
    AIAnalysisRecord,
)

logger = logging.getLogger("aerosync.repository")


class OperationalRepository:
    """Unified repository routing queries to Supabase with development store fallback."""

    def __init__(self):
        self._local_store = store

    @property
    def local_store(self):
        """Access in-memory store. Strictly prohibited in production to prevent silent fallbacks."""
        if settings.is_production:
            raise RuntimeError(
                "Production persistence error: Silent fallback to in-memory store is prohibited in production mode."
            )
        return self._local_store

    def _handle_db_error(self, err: Exception, context: str):
        """Handle database query/mutation failure. Never silently mask in production."""
        logger.error("Supabase operation failed [%s]: %s", context, str(err))
        if settings.is_production:
            raise RuntimeError(f"Database operation failed in production ({context}): {str(err)}")

    def _assert_production_persistence(self, client: Optional[Any], context: str):
        """Assert that Supabase persistence is active and configured in production."""
        if settings.is_production:
            if not is_supabase_configured():
                raise RuntimeError(f"Database operation failed in production ({context}): Supabase is not configured.")
            if client is None:
                raise RuntimeError(f"Database operation failed in production ({context}): Supabase client unavailable.")

    def _forbid_production_fallback(self, context: str):
        """Disallow silent fallback to in-memory store in production."""
        if settings.is_production:
            raise RuntimeError(f"Database operation failed in production ({context}): Silent fallback to in-memory store is prohibited.")

    # -------------------------------------------------------------------------
    # Airports
    # -------------------------------------------------------------------------
    def get_airports(self) -> list[Airport]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("airports").select("*").order("code").execute()
                    if res.data is not None:
                        return [Airport(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "get_airports")
        if settings.is_production:
            self._forbid_production_fallback("get_airports")
        return self.local_store.get_airports()

    def get_airport_by_id(self, airport_id: UUID) -> Optional[Airport]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("airports").select("*").eq("id", str(airport_id)).execute()
                    if res.data:
                        return Airport(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_airport_by_id")
        if settings.is_production:
            self._forbid_production_fallback("get_airport_by_id")
        return self.local_store.get_airport(airport_id)

    # -------------------------------------------------------------------------
    # Sectors
    # -------------------------------------------------------------------------
    def get_sectors(self) -> list[Sector]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("sectors").select("*").order("code").execute()
                    if res.data is not None:
                        return [Sector(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "get_sectors")
        if settings.is_production:
            self._forbid_production_fallback("get_sectors")
        return self.local_store.get_sectors()

    def get_sector_by_id(self, sector_id: UUID) -> Optional[Sector]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("sectors").select("*").eq("id", str(sector_id)).execute()
                    if res.data:
                        return Sector(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_sector_by_id")
        if settings.is_production:
            self._forbid_production_fallback("get_sector_by_id")
        return self.local_store.get_sector(sector_id)

    # -------------------------------------------------------------------------
    # Aircraft
    # -------------------------------------------------------------------------
    def get_aircraft(
        self,
        status: Optional[str] = None,
        role: Optional[str] = None,
        base_airport_id: Optional[UUID] = None,
    ) -> list[Aircraft]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    query = client.table("aircraft").select("*")
                    if status:
                        query = query.eq("status", status)
                    if role:
                        query = query.eq("role", role)
                    if base_airport_id:
                        query = query.eq("base_airport_id", str(base_airport_id))
                    res = query.order("tail_number").execute()
                    if res.data is not None:
                        return [Aircraft(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "supabase_operation")

        # Local fallback with filters
        aircraft_list = self.local_store.get_aircraft(status=status)
        if role:
            aircraft_list = [a for a in aircraft_list if a.role == role]
        if base_airport_id:
            aircraft_list = [a for a in aircraft_list if a.base_airport_id == base_airport_id]
        return aircraft_list

    def get_aircraft_by_id(self, aircraft_id: UUID) -> Optional[Aircraft]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("aircraft").select("*").eq("id", str(aircraft_id)).execute()
                    if res.data:
                        return Aircraft(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_aircraft_by_id")
        if settings.is_production:
            self._forbid_production_fallback("get_aircraft_by_id")
        return self.local_store.get_aircraft_by_id(aircraft_id)

    # -------------------------------------------------------------------------
    # Crew
    # -------------------------------------------------------------------------
    def get_crew(
        self,
        status: Optional[str] = None,
        role: Optional[str] = None,
        base_airport_id: Optional[UUID] = None,
    ) -> list[Crew]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    query = client.table("crew").select("*")
                    if status:
                        query = query.eq("status", status)
                    if role:
                        query = query.eq("role", role)
                    if base_airport_id:
                        query = query.eq("base_airport_id", str(base_airport_id))
                    res = query.order("code").execute()
                    if res.data is not None:
                        return [Crew(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "supabase_operation")

        crew_list = self.local_store.get_crew(status=status, role=role)
        if base_airport_id:
            crew_list = [c for c in crew_list if c.base_airport_id == base_airport_id]
        return crew_list

    def get_crew_by_id(self, crew_id: UUID) -> Optional[Crew]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("crew").select("*").eq("id", str(crew_id)).execute()
                    if res.data:
                        return Crew(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_crew_by_id")
        if settings.is_production:
            self._forbid_production_fallback("get_crew_by_id")
        return self.local_store.get_crew_by_id(crew_id)

    # -------------------------------------------------------------------------
    # Missions
    # -------------------------------------------------------------------------
    def get_missions(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        mission_type: Optional[str] = None,
    ) -> list[Mission]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    query = client.table("missions").select("*")
                    if status:
                        query = query.eq("status", status)
                    if priority:
                        query = query.eq("priority", priority)
                    if mission_type:
                        query = query.eq("type", mission_type)
                    res = query.order("scheduled_start").execute()
                    if res.data is not None:
                        return [Mission(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "supabase_operation")

        missions = self.local_store.get_missions(status=status, priority=priority)
        if mission_type:
            missions = [m for m in missions if m.type == mission_type]
        return missions

    def get_mission_by_id(self, mission_id: UUID) -> Optional[Mission]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("missions").select("*").eq("id", str(mission_id)).execute()
                    if res.data:
                        return Mission(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_mission_by_id")
        if settings.is_production:
            self._forbid_production_fallback("get_mission_by_id")
        return self.local_store.get_mission_by_id(mission_id)

    # -------------------------------------------------------------------------
    # Environment (Weather & Restrictions)
    # -------------------------------------------------------------------------
    def get_weather(
        self,
        sector_id: Optional[UUID] = None,
        airport_id: Optional[UUID] = None,
    ) -> list[WeatherCondition]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    query = client.table("weather_conditions").select("*")
                    if sector_id:
                        query = query.eq("sector_id", str(sector_id))
                    if airport_id:
                        query = query.eq("airport_id", str(airport_id))
                    res = query.order("created_at", desc=True).execute()
                    if res.data is not None:
                        return [WeatherCondition(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "supabase_operation")

        weather = self.local_store.get_weather()
        if sector_id:
            weather = [w for w in weather if w.sector_id == sector_id]
        if airport_id:
            weather = [w for w in weather if w.airport_id == airport_id]
        return weather

    def get_airspace_restrictions(
        self,
        sector_id: Optional[UUID] = None,
        status: Optional[str] = None,
    ) -> list[AirspaceRestriction]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    query = client.table("airspace_restrictions").select("*")
                    if sector_id:
                        query = query.eq("sector_id", str(sector_id))
                    if status:
                        query = query.eq("status", status)
                    res = query.order("active_from", desc=True).execute()
                    if res.data is not None:
                        return [AirspaceRestriction(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "supabase_operation")

        restrictions = self.local_store.get_airspace_restrictions()
        if sector_id:
            restrictions = [r for r in restrictions if r.sector_id == sector_id]
        if status:
            restrictions = [r for r in restrictions if r.status == status]
        return restrictions

    # -------------------------------------------------------------------------
    # Events Log
    # -------------------------------------------------------------------------
    def get_events(
        self,
        limit: int = 20,
        category: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> list[Event]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    query = client.table("events").select("*")
                    if category:
                        query = query.eq("category", category)
                    if event_type:
                        query = query.eq("type", event_type)
                    res = query.order("created_at", desc=True).limit(limit).execute()
                    if res.data is not None:
                        return [Event(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "supabase_operation")

        # Local store
        from app.db.seed_data import NOW
        from datetime import timedelta
        # If local store events are empty, provide baseline events
        if not self.local_store.events:
            self.local_store.events = [
                Event(
                    id=UUID("40000000-0000-0000-0000-000000000001"),
                    type="info",
                    category="system",
                    title="AEROSYNC Operational Session Initialized",
                    description="Decision-support prototype connected to operational data streams.",
                    metadata={"version": "0.1.0", "mode": "synthetic"},
                    created_at=NOW - timedelta(minutes=45),
                ),
                Event(
                    id=UUID("40000000-0000-0000-0000-000000000002"),
                    type="info",
                    category="fleet",
                    title="Fleet Readiness Diagnostic Complete",
                    description="18 of 22 aircraft available across 5 staging stations.",
                    metadata={"available": 18, "total": 22},
                    created_at=NOW - timedelta(minutes=30),
                ),
                Event(
                    id=UUID("40000000-0000-0000-0000-000000000003"),
                    type="warning",
                    category="weather",
                    title="Convective Activity Monitored in Sector B",
                    description="Atmospheric sensors indicate rising humidity and localized wind gusts up to 18 kts near Bravo Base.",
                    metadata={"sector": "SEC-B", "gusts_kts": 18},
                    created_at=NOW - timedelta(minutes=15),
                ),
                Event(
                    id=UUID("40000000-0000-0000-0000-000000000004"),
                    type="optimization",
                    category="mission",
                    title="Baseline Resource Allocation Computed",
                    description="OR-Tools CP-SAT solver successfully assigned 15 active missions in 48ms.",
                    metadata={"solver": "CP-SAT", "solve_time_ms": 48},
                    created_at=NOW - timedelta(minutes=5),
                ),
            ]

        evts = self.local_store.events
        if category:
            evts = [e for e in evts if e.category == category]
        if event_type:
            evts = [e for e in evts if e.type == event_type]
        return evts[:limit]

    def add_event(self, event: Event) -> Event:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    payload = event.model_dump(mode="json")
                    client.table("events").insert(payload).execute()
                    if settings.is_production:
                        return event
                except Exception as exc:
                    self._handle_db_error(exc, "add_event")
        else:
            self._forbid_production_fallback("add_event")
        return self.local_store.add_event(event)

    # -------------------------------------------------------------------------
    # State Mutations & Simulation Scenarios
    # -------------------------------------------------------------------------
    def update_sector(self, sector_id: UUID, update_data: dict) -> Optional[Sector]:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    res = client.table("sectors").update(update_data).eq("id", str(sector_id)).execute()
                    if settings.is_production:
                        return Sector(**res.data[0]) if res.data else None
                except Exception as exc:
                    self._handle_db_error(exc, "update_sector")
        else:
            self._forbid_production_fallback("update_sector")
        return self.local_store.update_sector(sector_id, update_data)

    def update_weather_for_sector(self, sector_id: UUID, update_data: dict) -> Optional[WeatherCondition]:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    res = client.table("weather_conditions").update(update_data).eq("sector_id", str(sector_id)).execute()
                    if settings.is_production:
                        return WeatherCondition(**res.data[0]) if res.data else None
                except Exception as exc:
                    self._handle_db_error(exc, "update_weather_for_sector")
        else:
            self._forbid_production_fallback("update_weather_for_sector")
        return self.local_store.update_weather_for_sector(sector_id, update_data)

    def update_aircraft_status(self, aircraft_id: UUID, new_status: str) -> Optional[Aircraft]:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    res = client.table("aircraft").update({"status": new_status}).eq("id", str(aircraft_id)).execute()
                    if settings.is_production:
                        return Aircraft(**res.data[0]) if res.data else None
                except Exception as exc:
                    self._handle_db_error(exc, "update_aircraft_status")
        else:
            self._forbid_production_fallback("update_aircraft_status")
        return self.local_store.update_aircraft_status(aircraft_id, new_status)

    def update_crew_status(self, crew_id: UUID, new_status: str) -> Optional[Crew]:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    res = client.table("crew").update({"status": new_status}).eq("id", str(crew_id)).execute()
                    if settings.is_production:
                        return Crew(**res.data[0]) if res.data else None
                except Exception as exc:
                    self._handle_db_error(exc, "update_crew_status")
        else:
            self._forbid_production_fallback("update_crew_status")
        return self.local_store.update_crew_status(crew_id, new_status)

    def update_airspace_restriction_status(self, restriction_id: UUID, new_status: str) -> Optional[AirspaceRestriction]:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    res = client.table("airspace_restrictions").update({"status": new_status}).eq("id", str(restriction_id)).execute()
                    if settings.is_production:
                        return AirspaceRestriction(**res.data[0]) if res.data else None
                except Exception as exc:
                    self._handle_db_error(exc, "update_airspace_restriction_status")
        else:
            self._forbid_production_fallback("update_airspace_restriction_status")
        return self.local_store.update_airspace_restriction_status(restriction_id, new_status)

    def save_simulation_event(self, event: SimulationEvent) -> SimulationEvent:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    payload = event.model_dump(mode="json")
                    client.table("simulation_events").insert(payload).execute()
                except Exception as exc:
                    self._handle_db_error(exc, "supabase_operation")
        return self.local_store.save_simulation_event(event)

    def get_simulation_event(self, event_id: UUID) -> Optional[SimulationEvent]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("simulation_events").select("*").eq("id", str(event_id)).execute()
                    if res.data:
                        return SimulationEvent(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_simulation_event")
        if settings.is_production:
            self._forbid_production_fallback("get_simulation_event")
        return self.local_store.get_simulation_event(event_id)

    def list_simulation_events(self) -> list[SimulationEvent]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("simulation_events").select("*").order("triggered_at", desc=True).execute()
                    if res.data is not None:
                        return [SimulationEvent(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "list_simulation_events")
        if settings.is_production:
            self._forbid_production_fallback("list_simulation_events")
        return self.local_store.list_simulation_events()

    def reset_state(self):
        """Reset repository back to the synthetic seed baseline."""
        if settings.is_production:
            raise RuntimeError("Simulation reset is permanently forbidden in production environments.")
        self.local_store.reset_to_seed()

    def save_optimization_run(self, run: OptimizationRun) -> OptimizationRun:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    payload = run.model_dump(mode="json")
                    client.table("optimization_runs").insert(payload).execute()
                    if settings.is_production:
                        return run
                except Exception as exc:
                    self._handle_db_error(exc, "save_optimization_run")
        else:
            self._forbid_production_fallback("save_optimization_run")
        return self.local_store.save_optimization_run(run)

    def get_optimization_run(self, run_id: UUID) -> Optional[OptimizationRun]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("optimization_runs").select("*").eq("id", str(run_id)).execute()
                    if res.data:
                        return OptimizationRun(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_optimization_run")
        if settings.is_production:
            self._forbid_production_fallback("get_optimization_run")
        return self.local_store.get_optimization_run(run_id)

    def list_optimization_runs(self) -> list[OptimizationRun]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("optimization_runs").select("*").order("created_at", desc=True).execute()
                    if res.data is not None:
                        return [OptimizationRun(**row) for row in res.data]
                except Exception as exc:
                    self._handle_db_error(exc, "list_optimization_runs")
        if settings.is_production:
            self._forbid_production_fallback("list_optimization_runs")
        return self.local_store.list_optimization_runs()

    def save_optimization_result(self, result: OptimizationResult) -> OptimizationResult:
        run = OptimizationRun(
            id=result.run_id,
            simulation_event_id=None,
            trigger_reason="operational_optimization",
            solver_status=result.solver_status,
            objective_value=result.objective_score,
            solve_time_ms=result.solve_time_ms,
            total_missions=result.metrics.missions_total,
            assigned_missions=result.metrics.missions_covered,
            unassigned_missions=result.metrics.missions_unresolved,
            constraints_applied=result.constraints.constraints_enforced,
            constraint_violations_avoided=[],
            raw_result=result.model_dump(mode="json"),
            created_at=result.created_at,
        )
        self.save_optimization_run(run)
        if result.recommendation:
            self.save_recommendation(result.recommendation)
        if settings.is_production:
            return result
        return self.local_store.save_optimization_result(result)

    def get_optimization_result(self, run_id: UUID) -> Optional[OptimizationResult]:
        if not settings.is_production:
            res = self.local_store.get_optimization_result(run_id)
            if res:
                return res
        run = self.get_optimization_run(run_id)
        if run and run.raw_result:
            try:
                return OptimizationResult(**run.raw_result)
            except Exception as exc:
                self._handle_db_error(exc, "get_optimization_result")
        return None

    def save_recommendation(self, rec: Recommendation) -> Recommendation:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    payload = rec.model_dump(mode="json")
                    client.table("recommendations").insert(payload).execute()
                    if settings.is_production:
                        return rec
                except Exception as exc:
                    self._handle_db_error(exc, "save_recommendation")
        else:
            self._forbid_production_fallback("save_recommendation")
        return self.local_store.save_recommendation(rec)

    def get_recommendation(self, rec_id: UUID) -> Optional[Recommendation]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("recommendations").select("*").eq("id", str(rec_id)).execute()
                    if res.data:
                        return Recommendation(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_recommendation")
        if settings.is_production:
            self._forbid_production_fallback("get_recommendation")
        return self.local_store.get_recommendation(rec_id)

    def get_recommendation_by_run_id(self, run_id: UUID) -> Optional[Recommendation]:
        if not settings.is_production:
            return self.local_store.get_recommendation_by_run_id(run_id)
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("recommendations").select("*").eq("optimization_run_id", str(run_id)).limit(1).execute()
                    if res.data:
                        return Recommendation(**res.data[0])
                except Exception as exc:
                    self._handle_db_error(exc, "get_recommendation_by_run_id")
        return None

    def update_recommendation_status(self, rec_id: UUID, new_status: str) -> Optional[Recommendation]:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    res = client.table("recommendations").update({"status": new_status}).eq("id", str(rec_id)).execute()
                    if settings.is_production:
                        return Recommendation(**res.data[0]) if res.data else None
                except Exception as exc:
                    self._handle_db_error(exc, "update_recommendation_status")
        else:
            self._forbid_production_fallback("update_recommendation_status")
        return self.local_store.update_recommendation_status(rec_id, new_status)

    def update_mission_allocation(
        self,
        mission_id: UUID,
        aircraft_id: Optional[UUID],
        notes: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Optional[Mission]:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    updates: dict = {}
                    if aircraft_id is not None:
                        updates["assigned_aircraft_id"] = str(aircraft_id)
                    if notes is not None:
                        updates["notes"] = notes
                    if status is not None:
                        updates["status"] = status
                    res = client.table("missions").update(updates).eq("id", str(mission_id)).execute()
                    if settings.is_production:
                        return Mission(**res.data[0]) if res.data else None
                except Exception as exc:
                    self._handle_db_error(exc, "update_mission_allocation")
        else:
            self._forbid_production_fallback("update_mission_allocation")
        return self.local_store.update_mission_allocation(mission_id, aircraft_id, notes, status)

    # -------------------------------------------------------------------------
    # AI Situation Analysis Persistence (Phase 8)
    # -------------------------------------------------------------------------
    def save_ai_analysis(self, analysis: AIAnalysisRecord) -> AIAnalysisRecord:
        if is_supabase_configured():
            client = get_service_client()
            if client:
                try:
                    payload = analysis.model_dump(mode="json")
                    client.table("ai_analysis").insert(payload).execute()
                    if settings.is_production:
                        return analysis
                except Exception as exc:
                    self._handle_db_error(exc, "save_ai_analysis")
        else:
            self._forbid_production_fallback("save_ai_analysis")
        return self.local_store.save_ai_analysis(analysis)

    def get_ai_analysis(self, analysis_id: UUID) -> Optional[AIAnalysisRecord]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = client.table("ai_analysis").select("*").eq("id", str(analysis_id)).execute()
                    if res.data:
                        return AIAnalysisRecord(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_ai_analysis")
        if settings.is_production:
            self._forbid_production_fallback("get_ai_analysis")
        return self.local_store.get_ai_analysis(analysis_id)

    def get_ai_analysis_by_run_id(self, run_id: UUID) -> Optional[AIAnalysisRecord]:
        if is_supabase_configured():
            client = get_service_client() or get_anon_client()
            if client:
                try:
                    res = (
                        client.table("ai_analysis")
                        .select("*")
                        .eq("optimization_run_id", str(run_id))
                        .order("generated_at", desc=True)
                        .limit(1)
                        .execute()
                    )
                    if res.data:
                        return AIAnalysisRecord(**res.data[0])
                    if settings.is_production:
                        return None
                except Exception as exc:
                    self._handle_db_error(exc, "get_ai_analysis_by_run_id")
        if settings.is_production:
            self._forbid_production_fallback("get_ai_analysis_by_run_id")
        return self.local_store.get_ai_analysis_by_run_id(run_id)

    def list_ai_analyses(self) -> list[AIAnalysisRecord]:
        return self.local_store.list_ai_analyses()



# Global repository instance
repository = OperationalRepository()
