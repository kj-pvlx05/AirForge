"""AEROSYNC — Readiness Service.

Calculates aggregated operational readiness metrics across fleet, crew, and active missions.
"""

from datetime import datetime, timezone
from app.db.repository import repository
from app.models import (
    ReadinessReport,
    FleetReadiness,
    CrewReadiness,
    MissionReadiness,
)


class ReadinessService:
    def __init__(self, repo=repository):
        self.repo = repo

    def calculate_readiness(self) -> ReadinessReport:
        aircraft = self.repo.get_aircraft()
        crew = self.repo.get_crew()
        missions = self.repo.get_missions()

        # Fleet breakdown
        total_ac = len(aircraft)
        avail_ac = len([a for a in aircraft if a.status == "available"])
        in_mission_ac = len([a for a in aircraft if a.status == "in-mission"])
        maint_ac = len([a for a in aircraft if a.status == "maintenance"])
        grounded_ac = len([a for a in aircraft if a.status == "grounded"])
        ac_pct = round((avail_ac / total_ac * 100), 1) if total_ac > 0 else 0.0

        # Crew breakdown
        total_crw = len(crew)
        avail_crw = len([c for c in crew if c.status == "available"])
        on_mission_crw = len([c for c in crew if c.status == "on-mission"])
        off_duty_crw = len([c for c in crew if c.status == "off-duty"])
        med_crw = len([c for c in crew if c.status == "medical"])
        crw_pct = round((avail_crw / total_crw * 100), 1) if total_crw > 0 else 0.0

        # Mission breakdown
        total_msn = len(missions)
        active_msn = len([m for m in missions if m.status == "active"])
        scheduled_msn = len([m for m in missions if m.status == "scheduled"])
        crit_msn = len([m for m in missions if m.priority == "critical" and m.status in ("active", "scheduled")])
        high_msn = len([m for m in missions if m.priority == "high" and m.status in ("active", "scheduled")])

        # Overall composite readiness: 50% fleet availability + 50% crew availability
        overall_pct = round((ac_pct * 0.5) + (crw_pct * 0.5))

        status_level = "nominal"
        if overall_pct < 60:
            status_level = "degraded"
        elif overall_pct < 80:
            status_level = "caution"

        return ReadinessReport(
            operational_readiness_pct=overall_pct,
            status_level=status_level,
            fleet=FleetReadiness(
                total=total_ac,
                available=avail_ac,
                in_mission=in_mission_ac,
                maintenance=maint_ac,
                grounded=grounded_ac,
                availability_pct=ac_pct,
            ),
            crew=CrewReadiness(
                total=total_crw,
                available=avail_crw,
                on_mission=on_mission_crw,
                off_duty=off_duty_crw,
                medical=med_crw,
                availability_pct=crw_pct,
            ),
            missions=MissionReadiness(
                total=total_msn,
                active=active_msn,
                scheduled=scheduled_msn,
                critical=crit_msn,
                high=high_msn,
            ),
            generated_at=datetime.now(timezone.utc),
        )


readiness_service = ReadinessService()
