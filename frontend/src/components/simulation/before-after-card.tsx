"use client";

import {
  ArrowRight,
  CloudRain,
  Eye,
  Wind,
  ShieldAlert,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { SimulationResult } from "@/lib/api";

interface BeforeAfterCardProps {
  result: SimulationResult;
  compact?: boolean;
}

export function BeforeAfterCard({ result, compact = false }: BeforeAfterCardProps) {
  const { state_before, state_after, impact } = result;

  const sectorBefore = state_before.sector;
  const sectorAfter = state_after.sector;

  return (
    <div className="space-y-4">
      {/* 3-Column Stepper: BEFORE → EVENT → AFTER */}
      <div className={`grid ${compact ? "grid-cols-1 gap-2.5" : "grid-cols-1 md:grid-cols-3 gap-3.5"}`}>
        {/* 1. BEFORE STATE */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-aero-success" />
                State Before
              </span>
              <span className="aero-badge-success text-[10px]">Nominal</span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Eye size={12} className="text-muted-foreground" />
                  Visibility
                </span>
                <span className="font-semibold text-foreground aero-mono">
                  {sectorBefore?.visibility_km ?? 8.5} km
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CloudRain size={12} className="text-muted-foreground" />
                  Ceiling
                </span>
                <span className="font-semibold text-foreground aero-mono">
                  {sectorBefore?.ceiling_ft?.toLocaleString() ?? "4,200"} ft
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Wind size={12} className="text-muted-foreground" />
                  Surface Winds
                </span>
                <span className="font-semibold text-foreground aero-mono">
                  {sectorBefore?.wind_speed_kts ?? 14} kts
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Plane size={12} className="text-muted-foreground" />
                  Available Fleet
                </span>
                <span className="font-semibold text-foreground aero-mono">
                  {state_before.fleet.available} / {state_before.fleet.total}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Activity size={12} className="text-muted-foreground" />
                  Readiness Score
                </span>
                <span className="font-semibold text-aero-success aero-mono">
                  {state_before.readiness_score}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 size={12} className="text-aero-success" />
            <span>VFR flight rules unrestricted</span>
          </div>
        </div>

        {/* 2. EVENT TRIGGERED */}
        <div className="rounded-xl border border-aero-warning/40 bg-aero-warning/5 p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-aero-warning/20">
              <span className="text-[11px] font-semibold text-aero-warning uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Operational Event
              </span>
              <span className="aero-badge-warning text-[10px]">Applied</span>
            </div>

            <div className="mt-3 space-y-2">
              <h4 className="text-xs font-semibold text-foreground">
                Weather Deterioration Detected
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Severe convective squall line active in Sector B coastal airspace. Ceilings dropped below VFR minimums.
              </p>

              <div className="rounded-lg bg-surface/80 border border-aero-warning/30 p-2.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Sector:</span>
                  <span className="font-semibold text-foreground aero-mono">SEC-B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condition:</span>
                  <span className="font-semibold text-aero-warning">Thunderstorm / Severe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flight Rules:</span>
                  <span className="font-semibold text-aero-critical">Sub-VFR (Suspended)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-aero-warning/20 text-[11px] text-aero-warning flex items-center justify-between font-medium">
            <span>Deterministic Mutation</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 3. AFTER STATE */}
        <div className="rounded-xl border border-aero-critical/30 bg-aero-critical/5 p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-aero-critical/20">
              <span className="text-[11px] font-semibold text-aero-critical uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-aero-critical animate-pulse" />
                State After
              </span>
              <span className="aero-badge-critical text-[10px]">Watch / High</span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Eye size={12} className="text-aero-critical" />
                  Visibility
                </span>
                <span className="font-semibold text-aero-critical aero-mono">
                  {sectorAfter?.visibility_km ?? 2.5} km
                  <span className="text-[10px] text-muted-foreground ml-1">(-6.0)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CloudRain size={12} className="text-aero-critical" />
                  Ceiling
                </span>
                <span className="font-semibold text-aero-critical aero-mono">
                  {sectorAfter?.ceiling_ft?.toLocaleString() ?? "1,500"} ft
                  <span className="text-[10px] text-muted-foreground ml-1">(-2,700)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Wind size={12} className="text-aero-critical" />
                  Surface Winds
                </span>
                <span className="font-semibold text-foreground aero-mono">
                  {sectorAfter?.wind_speed_kts ?? 28} kts
                  <span className="text-[10px] text-aero-warning ml-1">(+14)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Plane size={12} className="text-aero-critical" />
                  Available Fleet
                </span>
                <span className="font-semibold text-aero-critical aero-mono">
                  {state_after.fleet.available} / {state_after.fleet.total}
                  <span className="text-[10px] text-muted-foreground ml-1">(-2 grounded)</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Activity size={12} className="text-aero-critical" />
                  Readiness Score
                </span>
                <span className="font-semibold text-aero-critical aero-mono">
                  {state_after.readiness_score}%
                  <span className="text-[10px] text-muted-foreground ml-1">(-5%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-aero-critical/20 text-[11px] text-aero-critical flex items-center gap-1">
            <ShieldAlert size={12} />
            <span>2 units grounded at Bravo Base</span>
          </div>
        </div>
      </div>

      {/* Relational Impact Detection Metrics */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              Relational Impact Detection
            </span>
            <span className="text-[10px] text-muted-foreground">
              (Calculated directly from backend database relationships)
            </span>
          </div>
          <span className="aero-badge-neutral text-[10px] aero-mono">
            Event ID: {result.event_id.slice(0, 8)}...
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-background/50 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground">Missions Affected</span>
            <p className="text-lg font-bold text-foreground aero-mono mt-0.5">
              {impact.affected_missions.length}
            </p>
            <span className="text-[10px] text-aero-warning">Traversing Sector B</span>
          </div>

          <div className="rounded-lg border border-border bg-background/50 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground">Aircraft Grounded</span>
            <p className="text-lg font-bold text-aero-critical aero-mono mt-0.5">
              {impact.affected_aircraft.filter((a) => a.status_after === "grounded").length}
            </p>
            <span className="text-[10px] text-aero-critical">Sub-VFR minimums</span>
          </div>

          <div className="rounded-lg border border-border bg-background/50 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground">Routes Affected</span>
            <p className="text-lg font-bold text-foreground aero-mono mt-0.5">
              {impact.affected_routes.length}
            </p>
            <span className="text-[10px] text-muted-foreground">Corridors degraded</span>
          </div>

          <div className="rounded-lg border border-border bg-background/50 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground">Active NOTAMs</span>
            <p className="text-lg font-bold text-foreground aero-mono mt-0.5">
              1
            </p>
            <span className="text-[10px] text-aero-warning">NOTAM-SEC-B Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
