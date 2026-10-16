"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Plane,
  CloudSun,
  Layers,
  RotateCcw,
  Activity,
  Play,
  Eye,
  CloudRain,
  Wind,
} from "lucide-react";
import {
  ReadinessReport,
  SimulationResult,
  OptimizationSolveResponse,
} from "@/lib/api";
import { Cpu, Check, Clock, Zap, CornerDownRight } from "lucide-react";

interface SituationPanelProps {
  readiness: ReadinessReport | null;
  loading: boolean;
  onExploreScenario?: () => void;
  simulationResult?: SimulationResult | null;
  onRunSimulation?: () => Promise<void>;
  onResetSimulation?: () => Promise<void>;
  isSimulating?: boolean;
  optimizationResult?: OptimizationSolveResponse | null;
  isOptimizing?: boolean;
  onSolveOptimization?: () => Promise<void>;
  onApplyRecommendation?: () => Promise<void>;
  isApplyingRecommendation?: boolean;
  hasAppliedRecommendation?: boolean;
}

export function SituationPanel({
  readiness,
  loading,
  onExploreScenario,
  simulationResult,
  onRunSimulation,
  onResetSimulation,
  isSimulating = false,
  optimizationResult = null,
  isOptimizing = false,
  onSolveOptimization,
  onApplyRecommendation,
  isApplyingRecommendation = false,
  hasAppliedRecommendation = false,
}: SituationPanelProps) {
  const [userTab, setUserTab] = useState<"overview" | "simulation" | "recommendation" | null>(null);
  const activeTab = userTab ?? (optimizationResult ? "recommendation" : simulationResult ? "simulation" : "overview");

  if (loading || !readiness) {
    return (
      <div className="aero-card flex flex-col h-full animate-pulse p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="h-4 w-4 bg-muted rounded-full" />
          <div className="h-4 w-36 bg-muted rounded" />
        </div>
        <div className="mt-6 space-y-4">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const { operational_readiness_pct, fleet, crew } = readiness;
  const isSimulationActive = Boolean(simulationResult || fleet.grounded > 1);

  return (
    <div className="aero-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-surface">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Sparkles size={14} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              Situation Analysis
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Autonomous telemetry & operational simulation
            </p>
          </div>
        </div>

        {/* Status pill */}
        {isSimulationActive ? (
          <span className="aero-badge-warning text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-aero-warning animate-pulse" />
            Simulation Active
          </span>
        ) : (
          <span className="aero-badge-success text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-aero-success animate-pulse" />
            Nominal Posture
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-5 pt-2 bg-muted/30">
        <button
          onClick={() => setUserTab("overview")}
          className={`pb-2 text-xs font-medium border-b-2 transition-all mr-4 cursor-pointer ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Operational Posture
        </button>

        <button
          onClick={() => setUserTab("simulation")}
          className={`pb-2 text-xs font-medium border-b-2 transition-all mr-4 cursor-pointer flex items-center gap-1.5 ${
            activeTab === "simulation"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Simulation</span>
          {isSimulationActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-aero-warning" />
          )}
        </button>

        <button
          onClick={() => setUserTab("recommendation")}
          className={`pb-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "recommendation"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Recommendation
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === "overview" && (
          <>
            {/* Status Card */}
            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-1 ${isSimulationActive ? "bg-aero-warning/10 text-aero-warning" : "bg-aero-success/10 text-aero-success"}`}>
                  {isSimulationActive ? (
                    <AlertTriangle size={16} strokeWidth={2} />
                  ) : (
                    <CheckCircle2 size={16} strokeWidth={2} />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    {isSimulationActive
                      ? "Operational event mutation active"
                      : "Operations are currently nominal"}
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {isSimulationActive
                      ? "Sector B weather deterioration active. 2 aircraft sub-VFR grounded and route corridors degraded."
                      : "Baseline resource coverage is maintained across all 5 staging stations. High-priority medevac sorties have dedicated primary units."}
                  </p>
                </div>
              </div>
            </div>

            {/* Structured Telemetry Snapshot */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Telemetry Summary
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-aero-primary" />
                    Overall Readiness
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground aero-mono">
                    {operational_readiness_pct}%
                  </p>
                  <span className={`text-[10px] font-medium ${operational_readiness_pct >= 85 ? "text-aero-success" : "text-aero-warning"}`}>
                    {operational_readiness_pct >= 85 ? "Nominal baseline" : "Degraded due to weather"}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Plane size={12} className="text-aero-primary" />
                    Fleet Availability
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground aero-mono">
                    {fleet.available} / {fleet.total}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {fleet.grounded > 0 ? `${fleet.grounded} grounded` : `${fleet.maintenance} in maintenance`}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Layers size={12} className="text-aero-primary" />
                    Crew Availability
                  </span>
                  <p className="mt-1 text-lg font-semibold text-foreground aero-mono">
                    {crew.available} / {crew.total}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {crew.off_duty + crew.medical} resting / medical
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CloudSun size={12} className="text-aero-primary" />
                    Weather State
                  </span>
                  <p className="mt-1 text-sm font-semibold text-foreground truncate">
                    {isSimulationActive ? "Squall Active" : "Stable"}
                  </p>
                  <span className={`text-[10px] font-medium ${isSimulationActive ? "text-aero-critical" : "text-aero-warning"}`}>
                    {isSimulationActive ? "Sector B Watch Active" : "Sector B Advisory"}
                  </span>
                </div>
              </div>
            </div>

            {/* Environmental Watch Notice */}
            <div className={`rounded-xl border p-3.5 ${isSimulationActive ? "border-aero-critical/30 bg-aero-critical/5" : "border-aero-warning/30 bg-aero-warning/5"}`}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={15} className={`shrink-0 mt-0.5 ${isSimulationActive ? "text-aero-critical" : "text-aero-warning"}`} />
                <div className="text-[12px]">
                  <span className="font-semibold text-foreground">
                    {isSimulationActive ? "Sector B Squall Alert Active" : "Sector B Environmental Advisory"}
                  </span>
                  <p className="mt-0.5 text-muted-foreground leading-normal">
                    {isSimulationActive
                      ? "Ceilings dropped to 1,500 ft AGL. Sub-VFR grounding enforced on Bravo Base. Corridors impacted."
                      : "Convective clouds detected along coastal approaches. If ceilings drop below 1,500 ft, optimizer will trigger alternate route reallocations."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "simulation" && (
          <div className="space-y-3.5">
            {simulationResult ? (
              <>
                <div className="rounded-xl border border-aero-warning/30 bg-aero-warning/5 p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Weather Deterioration Detected
                    </span>
                    <span className="aero-badge-warning text-[10px]">Applied</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sector B convective event applied. Ceilings degraded below VFR limits.
                  </p>
                </div>

                {/* Compact BEFORE → EVENT → AFTER Table */}
                <div className="rounded-xl border border-border bg-card p-3 space-y-2.5 text-xs">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Operational State Transition
                  </span>

                  <div className="grid grid-cols-3 gap-1.5 pb-1 border-b border-border/60 text-[11px] font-medium text-muted-foreground">
                    <span>Metric</span>
                    <span className="text-center">Before</span>
                    <span className="text-right">After</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 items-center text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye size={11} /> Visibility
                    </span>
                    <span className="text-center text-foreground aero-mono">
                      {simulationResult.state_before.sector?.visibility_km ?? 8.5} km
                    </span>
                    <span className="text-right font-semibold text-aero-critical aero-mono">
                      {simulationResult.state_after.sector?.visibility_km ?? 2.5} km
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 items-center text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CloudRain size={11} /> Ceiling
                    </span>
                    <span className="text-center text-foreground aero-mono">
                      {simulationResult.state_before.sector?.ceiling_ft?.toLocaleString() ?? "4,200"} ft
                    </span>
                    <span className="text-right font-semibold text-aero-critical aero-mono">
                      {simulationResult.state_after.sector?.ceiling_ft?.toLocaleString() ?? "1,500"} ft
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 items-center text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Wind size={11} /> Surface Winds
                    </span>
                    <span className="text-center text-foreground aero-mono">
                      {simulationResult.state_before.sector?.wind_speed_kts ?? 14} kt
                    </span>
                    <span className="text-right font-semibold text-aero-warning aero-mono">
                      {simulationResult.state_after.sector?.wind_speed_kts ?? 28} kt
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 items-center text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ShieldCheck size={11} /> Sector Risk
                    </span>
                    <span className="text-center text-aero-success font-medium">Nominal</span>
                    <span className="text-right font-semibold text-aero-critical">Watch / High</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 items-center text-[12px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Activity size={11} /> Readiness
                    </span>
                    <span className="text-center text-foreground aero-mono">
                      {simulationResult.state_before.readiness_score}%
                    </span>
                    <span className="text-right font-semibold text-aero-critical aero-mono">
                      {simulationResult.state_after.readiness_score}%
                    </span>
                  </div>
                </div>

                {/* Impact Count Summary */}
                <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Calculated Backend Impact
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground">Missions</span>
                      <p className="font-bold text-foreground aero-mono mt-0.5">
                        {simulationResult.impact.affected_missions.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground">Aircraft</span>
                      <p className="font-bold text-aero-critical aero-mono mt-0.5">
                        {simulationResult.impact.affected_aircraft.filter((a) => a.status_after === "grounded").length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground">Routes</span>
                      <p className="font-bold text-foreground aero-mono mt-0.5">
                        {simulationResult.impact.affected_routes.length}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-2">
                <CloudSun size={24} className="mx-auto text-muted-foreground" />
                <h4 className="text-xs font-semibold text-foreground">
                  No Active Simulation Event
                </h4>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto">
                  Click the button below to trigger the deterministic Weather Deterioration scenario in Sector B.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "recommendation" && (
          <div className="space-y-4">
            {optimizationResult ? (
              <>
                {/* Active Recommendation Card */}
                <div className="rounded-xl border border-primary/20 bg-primary-vsoft/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="aero-badge-success text-[10px]">
                      OR-Tools {optimizationResult.solver_status}
                    </span>
                    <span className="text-[11px] text-muted-foreground aero-mono flex items-center gap-1">
                      <Clock size={11} />
                      {optimizationResult.solve_time_ms} ms
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      {optimizationResult.recommendation.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {optimizationResult.recommendation.summary}
                    </p>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-2.5 text-center text-xs">
                    <div className="rounded-lg bg-surface/80 p-1.5 border border-border">
                      <span className="text-[10px] text-muted-foreground">Assigned</span>
                      <p className="font-bold text-foreground aero-mono">
                        {optimizationResult.assigned_missions}/{optimizationResult.total_missions}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface/80 p-1.5 border border-border">
                      <span className="text-[10px] text-muted-foreground">Reassigned</span>
                      <p className="font-bold text-primary aero-mono">
                        {optimizationResult.reassignments_count}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface/80 p-1.5 border border-border">
                      <span className="text-[10px] text-muted-foreground">Objective</span>
                      <p className="font-bold text-aero-success aero-mono">
                        {optimizationResult.objective_value.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Apply Button */}
                  {onApplyRecommendation && (
                    <button
                      onClick={onApplyRecommendation}
                      disabled={isApplyingRecommendation || hasAppliedRecommendation}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                        hasAppliedRecommendation
                          ? "bg-aero-success text-white opacity-90 cursor-default"
                          : "bg-primary text-white hover:bg-primary/90 shadow-sm"
                      }`}
                    >
                      {isApplyingRecommendation ? (
                        <>
                          <RotateCcw size={12} className="animate-spin" />
                          <span>Applying Allocations...</span>
                        </>
                      ) : hasAppliedRecommendation ? (
                        <>
                          <Check size={13} strokeWidth={2.5} />
                          <span>Applied to Fleet</span>
                        </>
                      ) : (
                        <>
                          <Zap size={12} fill="currentColor" />
                          <span>Apply Recommendation to Fleet</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Reassignments List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Optimal Reallocations ({optimizationResult.reassignments.length})</span>
                    <span className="text-[10px] text-aero-success font-normal lowercase">Deterministic</span>
                  </span>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {optimizationResult.reassignments.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-card p-2.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground text-[11px]">
                            {r.mission_code}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                              r.priority === "critical"
                                ? "bg-red-500/10 text-red-600"
                                : r.priority === "high"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {r.priority}
                          </span>
                        </div>

                        <div className="text-[11px] text-muted-foreground">
                          {r.mission_title}
                        </div>

                        {/* Tail change */}
                        <div className="flex items-center gap-1.5 text-[11px] bg-muted/30 rounded p-1.5 border border-border/50">
                          {r.previous_aircraft_tail ? (
                            <>
                              <span className="text-aero-critical line-through font-mono">
                                {r.previous_aircraft_tail}
                              </span>
                              <CornerDownRight size={12} className="text-muted-foreground shrink-0" />
                            </>
                          ) : null}
                          <span className="text-aero-success font-bold font-mono">
                            {r.recommended_aircraft_tail}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({r.recommended_aircraft_model})
                          </span>
                        </div>

                        {/* Corridor Detour */}
                        {r.recommended_corridor && (
                          <div className="text-[10px] text-primary flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>Routing: {r.recommended_corridor}</span>
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground leading-normal italic">
                          {r.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
                <Cpu size={24} className="mx-auto text-primary" />
                <h4 className="text-xs font-semibold text-foreground">
                  CP-SAT Solver Ready
                </h4>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                  Solve for optimal resource allocations respecting airframe grounding, weather constraints, and priority weights.
                </p>
                {onSolveOptimization && (
                  <button
                    onClick={onSolveOptimization}
                    disabled={isOptimizing}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary/90 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isOptimizing ? (
                      <>
                        <RotateCcw size={12} className="animate-spin" />
                        <span>Solving CP-SAT Model...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={12} fill="currentColor" />
                        <span>Run Optimization Solver</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Interactive Actions */}
      <div className="border-t border-border p-3.5 bg-surface flex flex-col gap-2">
        {isSimulationActive ? (
          <div className="flex gap-2">
            <button
              onClick={onResetSimulation}
              disabled={isSimulating}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw size={13} className={isSimulating ? "animate-spin text-primary" : "text-muted-foreground"} />
              <span>Reset Baseline</span>
            </button>
            <button
              onClick={onExploreScenario}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-primary/90 shadow-sm cursor-pointer"
            >
              <span>Workspace</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-primary/90 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <RotateCcw size={13} className="animate-spin" />
                <span>Simulating Weather Squall...</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>Run Weather Deterioration Scenario</span>
              </>
            )}
          </button>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>Flagship Scenario:</span>
          <span className="text-primary font-medium">Sector B Deterioration</span>
        </div>
      </div>
    </div>
  );
}
