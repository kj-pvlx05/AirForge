"""AEROSYNC — Operational Data Store & State Repository.

Architecture:
  - If Supabase credentials are configured, delegates queries to Supabase.
  - If Supabase is not configured (e.g. offline testing or local dev),
    operates on an in-memory transactional snapshot initialized from synthetic seed data.
"""

from typing import Optional
from uuid import UUID
from app.db.supabase import is_supabase_configured, get_service_client, get_anon_client
from app.db.seed_data import (
    build_seed_airports,
    build_seed_sectors,
    build_seed_aircraft,
    build_seed_crew,
    build_seed_missions,
    build_seed_weather,
    build_seed_maintenance,
    build_seed_airspace_restrictions,
)
from app.models import (
    Airport,
    Sector,
    Aircraft,
    Crew,
    Mission,
    WeatherCondition,
    MaintenanceRecord,
    AirspaceRestriction,
    SimulationEvent,
    OptimizationRun,
    OptimizationResult,
    Recommendation,
    Event,
    AIAnalysisRecord,
)


class OperationalStore:
    """Thread-safe in-memory operational repository with optional Supabase pass-through."""

    def __init__(self):
        self.reset_to_seed()

    def reset_to_seed(self):
        """Reset in-memory state to the synthetic baseline seed data."""
        self.airports: dict[UUID, Airport] = {a.id: a for a in build_seed_airports()}
        self.sectors: dict[UUID, Sector] = {s.id: s for s in build_seed_sectors()}
        self.aircraft: dict[UUID, Aircraft] = {ac.id: ac for ac in build_seed_aircraft()}
        self.crew: dict[UUID, Crew] = {c.id: c for c in build_seed_crew()}
        self.missions: dict[UUID, Mission] = {m.id: m for m in build_seed_missions()}
        self.weather: dict[UUID, WeatherCondition] = {w.id: w for w in build_seed_weather()}
        self.maintenance: dict[UUID, MaintenanceRecord] = {m.id: m for m in build_seed_maintenance()}
        self.restrictions: dict[UUID, AirspaceRestriction] = {r.id: r for r in build_seed_airspace_restrictions()}
        if not hasattr(self, "simulation_events"):
            self.simulation_events: dict[UUID, SimulationEvent] = {}
        if not hasattr(self, "optimization_runs"):
            self.optimization_runs: dict[UUID, OptimizationRun] = {}
        if not hasattr(self, "optimization_results"):
            self.optimization_results: dict[UUID, OptimizationResult] = {}
        if not hasattr(self, "recommendations"):
            self.recommendations: dict[UUID, Recommendation] = {}
        if not hasattr(self, "ai_analyses"):
            self.ai_analyses: dict[UUID, AIAnalysisRecord] = {}
        if not hasattr(self, "events"):
            self.events: list[Event] = []

    # --- Query Methods ---
    def get_airports(self) -> list[Airport]:
        return list(self.airports.values())

    def get_airport(self, airport_id: UUID) -> Optional[Airport]:
        return self.airports.get(airport_id)

    def get_sectors(self) -> list[Sector]:
        return list(self.sectors.values())

    def get_sector(self, sector_id: UUID) -> Optional[Sector]:
        return self.sectors.get(sector_id)

    def get_aircraft(self, status: Optional[str] = None) -> list[Aircraft]:
        if status:
            return [ac for ac in self.aircraft.values() if ac.status == status]
        return list(self.aircraft.values())

    def get_aircraft_by_id(self, aircraft_id: UUID) -> Optional[Aircraft]:
        return self.aircraft.get(aircraft_id)

    def get_crew(self, status: Optional[str] = None, role: Optional[str] = None) -> list[Crew]:
        crew_list = list(self.crew.values())
        if status:
            crew_list = [c for c in crew_list if c.status == status]
        if role:
            crew_list = [c for c in crew_list if c.role == role]
        return crew_list

    def get_crew_by_id(self, crew_id: UUID) -> Optional[Crew]:
        return self.crew.get(crew_id)

    def get_missions(self, status: Optional[str] = None, priority: Optional[str] = None) -> list[Mission]:
        missions_list = list(self.missions.values())
        if status:
            missions_list = [m for m in missions_list if m.status == status]
        if priority:
            missions_list = [m for m in missions_list if m.priority == priority]
        return missions_list

    def get_mission_by_id(self, mission_id: UUID) -> Optional[Mission]:
        return self.missions.get(mission_id)

    def get_weather(self) -> list[WeatherCondition]:
        return list(self.weather.values())

    def get_maintenance_records(self) -> list[MaintenanceRecord]:
        return list(self.maintenance.values())

    def get_airspace_restrictions(self) -> list[AirspaceRestriction]:
        return list(self.restrictions.values())

    def get_readiness_metrics(self) -> dict:
        total_ac = len(self.aircraft)
        avail_ac = len([a for a in self.aircraft.values() if a.status == "available"])
        total_crw = len(self.crew)
        avail_crw = len([c for c in self.crew.values() if c.status == "available"])
        active_msn = len([m for m in self.missions.values() if m.status in ("active", "scheduled")])

        ac_ratio = (avail_ac / total_ac) if total_ac > 0 else 0.0
        crw_ratio = (avail_crw / total_crw) if total_crw > 0 else 0.0
        overall_readiness = round((ac_ratio * 0.5 + crw_ratio * 0.5) * 100)

        return {
            "aircraft_total": total_ac,
            "aircraft_available": avail_ac,
            "crew_total": total_crw,
            "crew_available": avail_crw,
            "missions_active": active_msn,
            "operational_readiness_pct": overall_readiness,
        }

    # --- Mutation Methods ---
    def update_aircraft_status(self, aircraft_id: UUID, new_status: str) -> Optional[Aircraft]:
        if aircraft_id in self.aircraft:
            ac = self.aircraft[aircraft_id]
            updated = ac.model_copy(update={"status": new_status})
            self.aircraft[aircraft_id] = updated
            return updated
        return None

    def update_crew_status(self, crew_id: UUID, new_status: str) -> Optional[Crew]:
        if crew_id in self.crew:
            c = self.crew[crew_id]
            updated = c.model_copy(update={"status": new_status})
            self.crew[crew_id] = updated
            return updated
        return None

    def update_sector(self, sector_id: UUID, update_data: dict) -> Optional[Sector]:
        if sector_id in self.sectors:
            sec = self.sectors[sector_id]
            updated = sec.model_copy(update=update_data)
            self.sectors[sector_id] = updated
            return updated
        return None

    def update_weather_for_sector(self, sector_id: UUID, update_data: dict) -> Optional[WeatherCondition]:
        for w_id, w in self.weather.items():
            if w.sector_id == sector_id:
                updated = w.model_copy(update=update_data)
                self.weather[w_id] = updated
                return updated
        return None

    def update_airspace_restriction_status(self, restriction_id: UUID, new_status: str) -> Optional[AirspaceRestriction]:
        if restriction_id in self.restrictions:
            r = self.restrictions[restriction_id]
            updated = r.model_copy(update={"status": new_status})
            self.restrictions[restriction_id] = updated
            return updated
        return None

    def save_simulation_event(self, event: SimulationEvent) -> SimulationEvent:
        self.simulation_events[event.id] = event
        return event

    def get_simulation_event(self, event_id: UUID) -> Optional[SimulationEvent]:
        return self.simulation_events.get(event_id)

    def list_simulation_events(self) -> list[SimulationEvent]:
        return sorted(
            list(self.simulation_events.values()),
            key=lambda e: e.triggered_at,
            reverse=True,
        )

    def add_event(self, event: Event) -> Event:
        self.events.insert(0, event)
        return event

    def save_optimization_run(self, run: OptimizationRun) -> OptimizationRun:
        self.optimization_runs[run.id] = run
        return run

    def get_optimization_run(self, run_id: UUID) -> Optional[OptimizationRun]:
        return self.optimization_runs.get(run_id)

    def list_optimization_runs(self) -> list[OptimizationRun]:
        return sorted(
            list(self.optimization_runs.values()),
            key=lambda r: r.created_at,
            reverse=True,
        )

    def save_optimization_result(self, result: OptimizationResult) -> OptimizationResult:
        self.optimization_results[result.run_id] = result
        return result

    def get_optimization_result(self, run_id: UUID) -> Optional[OptimizationResult]:
        return self.optimization_results.get(run_id)

    def save_recommendation(self, rec: Recommendation) -> Recommendation:
        self.recommendations[rec.id] = rec
        return rec

    def get_recommendation(self, rec_id: UUID) -> Optional[Recommendation]:
        return self.recommendations.get(rec_id)

    def get_recommendation_by_run_id(self, run_id: UUID) -> Optional[Recommendation]:
        for rec in self.recommendations.values():
            if rec.optimization_run_id == run_id:
                return rec
        return None

    def update_recommendation_status(self, rec_id: UUID, new_status: str) -> Optional[Recommendation]:
        if rec_id in self.recommendations:
            rec = self.recommendations[rec_id]
            updated = rec.model_copy(update={"status": new_status})
            self.recommendations[rec_id] = updated
            return updated
        return None

    def update_mission_allocation(
        self,
        mission_id: UUID,
        aircraft_id: Optional[UUID],
        notes: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Optional[Mission]:
        if mission_id in self.missions:
            m = self.missions[mission_id]
            updates: dict = {}
            if aircraft_id is not None:
                updates["assigned_aircraft_id"] = aircraft_id
            if notes is not None:
                updates["notes"] = notes
            if status is not None:
                updates["status"] = status
            updated = m.model_copy(update=updates)
            self.missions[mission_id] = updated
            return updated
        return None

    def save_ai_analysis(self, analysis: AIAnalysisRecord) -> AIAnalysisRecord:
        self.ai_analyses[analysis.id] = analysis
        return analysis

    def get_ai_analysis(self, analysis_id: UUID) -> Optional[AIAnalysisRecord]:
        return self.ai_analyses.get(analysis_id)

    def get_ai_analysis_by_run_id(self, run_id: UUID) -> Optional[AIAnalysisRecord]:
        for a in sorted(self.ai_analyses.values(), key=lambda x: x.generated_at, reverse=True):
            if a.optimization_run_id == run_id:
                return a
        return None

    def list_ai_analyses(self) -> list[AIAnalysisRecord]:
        return sorted(
            list(self.ai_analyses.values()),
            key=lambda a: a.generated_at,
            reverse=True,
        )



# Global singleton instance
store = OperationalStore()
