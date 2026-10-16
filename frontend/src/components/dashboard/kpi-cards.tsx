"use client";

import { Plane, Users, Target, Activity } from "lucide-react";
import { ReadinessReport } from "@/lib/api";

interface KpiCardsProps {
  data: ReadinessReport | null;
  loading: boolean;
}

export function KpiCards({ data, loading }: KpiCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aero-card p-5 animate-pulse flex flex-col justify-between h-[116px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </div>
            <div>
              <div className="h-7 w-24 bg-muted rounded mt-2" />
              <div className="h-3 w-16 bg-muted rounded mt-1.5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: "Aircraft",
      value: `${data.fleet.available} / ${data.fleet.total}`,
      sub: "Available for Sorties",
      subDetail: `${data.fleet.maintenance} in maintenance, ${data.fleet.grounded} grounded`,
      icon: Plane,
      accent: "text-aero-primary",
      badgeClass: "aero-badge-primary",
      badgeText: `${data.fleet.availability_pct.toFixed(0)}% Ready`,
    },
    {
      label: "Crew",
      value: `${data.crew.available} / ${data.crew.total}`,
      sub: "Available Personnel",
      subDetail: `${data.crew.off_duty} off-duty, ${data.crew.medical} medical`,
      icon: Users,
      accent: "text-aero-primary",
      badgeClass: "aero-badge-success",
      badgeText: `${data.crew.availability_pct.toFixed(0)}% Ready`,
    },
    {
      label: "Missions",
      value: `${data.missions.active + data.missions.scheduled}`,
      sub: `${data.missions.active} Active · ${data.missions.scheduled} Scheduled`,
      subDetail: `${data.missions.critical} critical, ${data.missions.high} high priority`,
      icon: Target,
      accent: "text-aero-success",
      badgeClass: data.missions.critical > 0 ? "aero-badge-warning" : "aero-badge-neutral",
      badgeText: `${data.missions.critical} Critical`,
    },
    {
      label: "Operational Readiness",
      value: `${data.operational_readiness_pct}%`,
      sub: "Composite Operational Posture",
      subDetail: data.status_level.toUpperCase() + " STATUS",
      icon: Activity,
      accent: "text-aero-primary",
      badgeClass:
        data.operational_readiness_pct >= 80
          ? "aero-badge-success"
          : data.operational_readiness_pct >= 60
          ? "aero-badge-warning"
          : "aero-badge-critical",
      badgeText: data.status_level.toUpperCase(),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="aero-card p-5 flex flex-col justify-between transition-all duration-200 hover:border-aero-primary-light/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted-foreground tracking-tight">
              {kpi.label}
            </span>
            <div className="flex items-center gap-2">
              <span className={kpi.badgeClass}>{kpi.badgeText}</span>
              <kpi.icon size={15} className={kpi.accent} strokeWidth={1.75} />
            </div>
          </div>

          <div className="mt-2.5">
            <p className="text-2xl font-semibold tracking-tight text-foreground aero-mono">
              {kpi.value}
            </p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[12px] text-muted-foreground font-medium">
                {kpi.sub}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80 truncate">
              {kpi.subDetail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
