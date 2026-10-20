"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Zap,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  History,
  Check,
  AlertCircle,
  ExternalLink,
  AlertTriangle,
  CloudRain,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  runOptimization,
  fetchOptimizationResult,
  applyRecommendation,
  fetchOptimizationRuns,
  resetSimulation,
  triggerSimulationScenario,
  fetchSectors,
  analyzeOptimization,
  getOptimizationAnalysis,
  OptimizationResult,
  OptimizationRun,
  Sector,
  ApiError,
  AIExplanationResponse,
} from "@/lib/api";

import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function OptimizationPage() {
  const [solveResult, setSolveResult] = useState<OptimizationResult | null>(null);
  const [runsHistory, setRunsHistory] = useState<OptimizationRun[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIExplanationResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Identify if Sector B is currently degraded / in severe weather
  const sectorB = sectors.find((s) => s.code === "SEC-B");
  const isSectorBDisrupted = sectorB?.risk_level === "high" || sectorB?.risk_level === "critical";

  const reloadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [runs, secList] = await Promise.all([
        fetchOptimizationRuns().catch(() => []),
        fetchSectors().catch(() => []),
      ]);
      setRunsHistory(runs);
      setSectors(secList);

      if (runs.length > 0) {
        try {
          const latestResult = await fetchOptimizationResult(runs[0].id);
          setSolveResult(latestResult);
          if (runs[0].id) {
            getOptimizationAnalysis(runs[0].id)
              .then((res) => setAiAnalysis(res))
              .catch(() => {});
          }
        } catch {
          // Non-blocking fallback
        }
      }
      setLoading(false);
    } catch (err: unknown) {
      console.error("Optimization workspace reload error:", err);
      const msg = err instanceof ApiError ? err.detail : "Failed to load optimization telemetry.";
      setError(msg);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [runs, secList] = await Promise.all([
          fetchOptimizationRuns().catch(() => []),
          fetchSectors().catch(() => []),
        ]);
        if (active) {
          setRunsHistory(runs);
          setSectors(secList);

          if (runs.length > 0) {
            try {
              const latestResult = await fetchOptimizationResult(runs[0].id);
              if (active) {
                setSolveResult(latestResult);
                if (runs[0].id) {
                  getOptimizationAnalysis(runs[0].id)
                    .then((res) => {
                      if (active) setAiAnalysis(res);
                    })
                    .catch(() => {});
                }
              }
            } catch {
              // Non-blocking fallback
            }
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          console.error("Optimization workspace load error:", err);
          const msg = err instanceof ApiError ? err.detail : "Failed to load optimization telemetry.";
          setError(msg);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      active = false;
    };
  }, []);

  const handleRunSolver = async () => {
    try {
      setIsSolving(true);
      setError(null);
      setSuccessMessage(null);
      const result = await runOptimization({
        trigger_reason: "manual_console_run",
        allow_rerouting: true,
      });
      setSolveResult(result);
      setHasApplied(false);
      setAiAnalysis(null);
      const [runs, secList] = await Promise.all([
        fetchOptimizationRuns().catch(() => []),
        fetchSectors().catch(() => []),
      ]);
      setRunsHistory(runs);
      setSectors(secList);
      setSuccessMessage(
        `OR-Tools CP-SAT solver converged with status ${result.solver_status} in ${result.solve_time_ms} ms.`
      );
    } catch (err: unknown) {
      console.error("Solver error:", err);
      setError("Solver execution failed. Check backend console logs.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleApply = async () => {
    if (!solveResult || !solveResult.recommendation_id) return;
    try {
      setIsApplying(true);
      setError(null);
      await applyRecommendation(solveResult.recommendation_id);
      setHasApplied(true);
      setSuccessMessage("Optimal resource allocations successfully applied to live fleet dispatch!");
      const runs = await fetchOptimizationRuns().catch(() => []);
      setRunsHistory(runs);
    } catch (err: unknown) {
      console.error("Apply error:", err);
      setError("Failed to apply allocations.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetBaseline = async () => {
    try {
      setIsResetting(true);
      setError(null);
      setSuccessMessage(null);
      setAiAnalysis(null);
      await resetSimulation();
      setHasApplied(false);
      await reloadData();
      setSuccessMessage("Operational baseline and fleet state restored.");
    } catch (err: unknown) {
      console.error("Reset error:", err);
      setError("Failed to reset operational state.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleTriggerWeatherScenario = async () => {
    try {
      setIsSimulating(true);
      setError(null);
      setSuccessMessage(null);
      setAiAnalysis(null);
      await triggerSimulationScenario({
        scenario: "weather_deterioration",
        target_id: "SEC-B",
      });
      await reloadData();
      setSuccessMessage("Sector B weather deterioration active (convective squall line, 2 aircraft grounded).");
    } catch (err: unknown) {
      console.error("Simulation error:", err);
      setError("Failed to trigger weather scenario.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateAnalysis = async (targetRunId?: string) => {
    const id = targetRunId || solveResult?.run_id;
    if (!id) return;
    try {
      setIsAnalyzing(true);
      setAiError(null);
      const res = await analyzeOptimization({
        optimization_run_id: id,
      });
      setAiAnalysis(res);
    } catch (err: unknown) {
      console.error("AI situation analysis error:", err);
      const msg = err instanceof ApiError ? err.detail : "Failed to generate AI situation analysis.";
      setAiError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Optimization Engine
            </h1>
            <span className="aero-badge-primary text-[11px]">
              OR-Tools CP-SAT
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Deterministic constraint satisfaction & multi-objective integer programming for dynamic air operations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="reset-baseline-btn"
            onClick={() => setShowResetModal(true)}
            disabled={isResetting || isSolving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={13} className={isResetting ? "animate-spin text-primary" : "text-muted-foreground"} />
            <span>Reset Baseline</span>
          </button>

          {!isSectorBDisrupted && (
            <button
              id="simulate-squall-btn"
              onClick={handleTriggerWeatherScenario}
              disabled={isSimulating || isSolving}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-aero-warning/40 bg-aero-warning/10 px-3 py-2 text-xs font-semibold text-aero-warning transition-all hover:bg-aero-warning/20 cursor-pointer disabled:opacity-50"
            >
              <CloudRain size={13} />
              <span>{isSimulating ? "Simulating..." : "Simulate Sector B Squall"}</span>
            </button>
          )}

          <button
            id="run-solver-btn"
            onClick={handleRunSolver}
            disabled={isSolving || isResetting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-primary/90 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSolving ? (
              <>
                <RotateCcw size={13} className="animate-spin" />
                <span>Running Solver...</span>
              </>
            ) : (
              <>
                <Zap size={13} fill="currentColor" />
                <span>Run CP-SAT Optimizer</span>
              </>
            )}
          </button>

          {solveResult?.recommendation_id && (
            <button
              id="apply-fleet-btn"
              onClick={() => setShowApplyModal(true)}
              disabled={isApplying || hasApplied}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                hasApplied
                  ? "bg-aero-success text-white opacity-90 cursor-default"
                  : "bg-aero-success text-white hover:bg-aero-success/90 shadow-sm"
              }`}
            >
              {isApplying ? (
                <>
                  <RotateCcw size={13} className="animate-spin" />
                  <span>Applying...</span>
                </>
              ) : hasApplied ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  <span>Allocations Applied</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  <span>Apply to Fleet</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-aero-critical/30 bg-aero-critical/5 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-aero-critical shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-semibold text-foreground">Solver Error</span>
            <p className="text-muted-foreground mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-aero-success/30 bg-aero-success/5 p-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-aero-success shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-foreground font-medium">
            {successMessage}
          </div>
        </div>
      )}

      {/* FLOW STEP 1: Current Operational Situation */}
      <div className={`aero-card p-4 border-l-4 transition-all ${
        isSectorBDisrupted
          ? "border-l-aero-warning bg-amber-500/[0.02]"
          : "border-l-aero-success bg-green-500/[0.02]"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
              isSectorBDisrupted ? "bg-aero-warning/10 text-aero-warning" : "bg-aero-success/10 text-aero-success"
            }`}>
              {isSectorBDisrupted ? <AlertTriangle size={18} /> : <Compass size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Situation
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isSectorBDisrupted ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"
                }`}>
                  {isSectorBDisrupted ? "Weather Deterioration Active" : "Nominal Baseline State"}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground mt-1">
                {isSectorBDisrupted
                  ? "Severe convective squall line active in Sector B. Ceilings below 1,500 ft AGL. VFR suspended. 2 aircraft grounded at Bravo Base. Active NOTAM search grid."
                  : "All 6 operational sectors within nominal VFR minimums. Fleet and crew available for dispatch."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto">
            <span className="text-muted-foreground">Impacted Sector:</span>
            <span className="font-mono font-bold text-foreground">
              {isSectorBDisrupted ? "SEC-B (Restricted)" : "None (All Nominal)"}
            </span>
          </div>
        </div>
      </div>

      {/* FLOW STEP 2: Solver Status Bar & Mathematically Unambiguous Metrics */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">Solver Engine:</span>
            <span>OR-Tools CP-SAT (Deterministic SAT)</span>
            <span>•</span>
            <span className="font-semibold text-foreground">Status:</span>
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-aero-success">
              <span className="h-1.5 w-1.5 rounded-full bg-aero-success animate-pulse" />
              {solveResult?.solver_status || (loading ? "..." : "OPTIMAL")}
              <span className="text-muted-foreground font-normal">
                ({solveResult?.solve_time_ms ? `${solveResult.solve_time_ms} ms` : "—"})
              </span>
            </span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Objective Utility Score:</span>{" "}
            <span className="font-mono font-bold text-foreground">
              {solveResult ? Math.round(solveResult.objective_score).toLocaleString() : (loading ? "—" : "0")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Total Missions */}
          <div className="aero-card p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Missions
            </span>
            <p className="mt-1 text-lg font-bold text-foreground aero-mono">
              {solveResult ? solveResult.metrics.missions_total : (loading ? "—" : 16)}
            </p>
            <span className="text-[11px] text-muted-foreground">Considered Taskings</span>
          </div>

          {/* 2. Feasible / Recommended */}
          <div className="aero-card p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Feasible / Assigned
            </span>
            <p className="mt-1 text-lg font-bold text-primary aero-mono">
              {solveResult ? solveResult.metrics.missions_covered : (loading ? "—" : 10)}
            </p>
            <span className="text-[11px] text-muted-foreground">Conflict-Free Coverage</span>
          </div>

          {/* 3. Unresolved */}
          <div className="aero-card p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Unresolved
            </span>
            <p className={`mt-1 text-lg font-bold aero-mono ${
              (solveResult?.metrics.missions_unresolved || 0) > 0 ? "text-aero-critical" : "text-aero-success"
            }`}>
              {solveResult ? solveResult.metrics.missions_unresolved : (loading ? "—" : 0)}
            </p>
            <span className="text-[11px] text-muted-foreground">Could Not Allocate</span>
          </div>

          {/* 4. Affected Missions */}
          <div className="aero-card p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Affected Missions
            </span>
            <p className={`mt-1 text-lg font-bold aero-mono ${
              (solveResult?.metrics.missions_affected || 0) > 0 ? "text-aero-warning" : "text-muted-foreground"
            }`}>
              {solveResult ? solveResult.metrics.missions_affected : (loading ? "—" : 0)}
            </p>
            <span className="text-[11px] text-muted-foreground">Disrupted by Event</span>
          </div>

          {/* 5. Reassigned Aircraft */}
          <div className="aero-card p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Reassigned Aircraft
            </span>
            <p className={`mt-1 text-lg font-bold aero-mono ${
              (solveResult?.metrics.aircraft_reassigned || 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            }`}>
              {solveResult ? solveResult.metrics.aircraft_reassigned : (loading ? "—" : 0)}
            </p>
            <span className="text-[11px] text-muted-foreground">Fleet Adjustments</span>
          </div>

          {/* 6. Rerouted Missions */}
          <div className="aero-card p-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Rerouted Missions
            </span>
            <p className={`mt-1 text-lg font-bold aero-mono ${
              ((solveResult?.rerouted_count ?? solveResult?.metrics.missions_rerouted) || 0) > 0 ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground"
            }`}>
              {solveResult ? (solveResult.rerouted_count ?? solveResult.metrics.missions_rerouted ?? 0) : (loading ? "—" : 0)}
            </p>
            <span className="text-[11px] text-muted-foreground">Corridor Detours</span>
          </div>
        </div>
      </div>

      {/* FLOW STEP 3: Recommended Allocations & Resource Changes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Recommended Fleet Allocations
            </h2>
            <p className="text-xs text-muted-foreground">
              {solveResult?.reassignments.length
                ? `${solveResult.reassignments.length} dynamic adjustments generated to bypass disruptions`
                : "Active baseline allocations satisfying all 9 operational constraints"}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>View Operational Map</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {/* If reassignments exist, showcase them with the clear Calm Intelligence card flow */}
        {solveResult && solveResult.reassignments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {solveResult.reassignments.map((r, i) => (
              <div key={i} className="aero-card p-5 space-y-4 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                {/* Mission header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {r.mission_code}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.priority === "critical"
                            ? "bg-red-500/10 text-red-600"
                            : r.priority === "high"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {r.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {r.mission_title}
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-muted-foreground font-mono">
                    {r.origin_code} &rarr; {r.destination_code}
                  </div>
                </div>

                {/* Resource transition strip */}
                <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                      Previous Airframe
                    </span>
                    {r.previous_aircraft_tail ? (
                      <div>
                        <span className="font-mono text-xs text-aero-critical line-through font-semibold">
                          {r.previous_aircraft_tail}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {r.previous_aircraft_model || "Grounded"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </div>

                  <ArrowRight size={16} className="text-muted-foreground shrink-0" />

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                      Recommended Airframe
                    </span>
                    <span className="font-mono text-xs text-aero-success font-bold">
                      {r.recommended_aircraft_tail}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {r.recommended_aircraft_model}
                    </p>
                  </div>
                </div>

                {/* Flight Corridor & Rationale */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Flight Corridor:
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      r.recommended_corridor.includes("Sector C")
                        ? "bg-primary/10 text-primary"
                        : "bg-aero-success/10 text-aero-success"
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span>{r.recommended_corridor}</span>
                    </span>
                  </div>

                  {/* FLOW STEP 5: Why? Structured deterministic reasons */}
                  <div className="rounded-lg bg-surface border border-border p-3 text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground block mb-1">
                      Algorithmic Rationale:
                    </span>
                    {r.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="aero-card p-6 text-center text-xs text-muted-foreground">
            Current fleet allocation is optimal under baseline conditions. No aircraft reassignments required.
          </div>
        )}
      </div>

      {/* FLOW STEP 4: Unresolved Missions Analysis */}
      {solveResult && solveResult.unresolved_missions.length > 0 && (
        <div className="aero-card p-5 space-y-4 border-l-4 border-l-aero-critical bg-red-500/[0.02]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-aero-critical shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Unresolved Missions ({solveResult.unresolved_missions.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Taskings that could not be feasibly assigned under hard constraints
                </p>
              </div>
            </div>

            <span className="aero-badge-critical text-[10px] font-bold">
              Hard Constraint Infeasible
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {solveResult.unresolved_missions.map((um, i) => (
              <div key={i} className="rounded-xl border border-aero-critical/20 bg-surface p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {um.mission_code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                    {um.priority} Priority
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-normal">
                  {um.reason}
                </p>

                {um.unmet_constraints && um.unmet_constraints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {um.unmet_constraints.map((c, ci) => (
                      <span
                        key={ci}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-aero-critical/10 text-aero-critical"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FLOW STEP 5: Gemini AI Situation Analysis & Decision-Support Layer (Phase 8) */}
      <div className="aero-card p-5 space-y-4 border border-[#EAE7F2] bg-white shadow-sm" id="situation-analysis-section">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">
                  Situation Analysis
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  Decision Support
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Controlled natural-language synthesis grounded strictly on CP-SAT optimization results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {aiAnalysis && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F3F0FF] text-primary border border-primary/20">
                <Sparkles size={12} />
                <span>{aiAnalysis.fallback_used ? "Deterministic Fallback" : `Gemini Flash (${aiAnalysis.model})`}</span>
              </span>
            )}
            <button
              onClick={() => handleGenerateAnalysis()}
              disabled={isAnalyzing || !solveResult}
              className="aero-btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-[#F3F0FF] text-primary hover:bg-primary/20 border-primary/20 disabled:opacity-50 transition-colors shadow-none"
              id="generate-ai-analysis-btn"
            >
              <Sparkles size={13} className={isAnalyzing ? "animate-spin" : ""} />
              <span>{isAnalyzing ? "Analyzing..." : aiAnalysis ? "Regenerate Analysis" : "Generate Situation Analysis"}</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {aiError && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* Calm Loading State */}
        {isAnalyzing && (
          <div className="rounded-xl border border-border bg-[#FAFAFC] p-8 text-center space-y-2.5">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary">
              <Sparkles size={18} className="animate-spin" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Synthesizing Operational Situation Analysis via Gemini Flash...
            </p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Analyzing authoritative CP-SAT optimization allocations, flight corridor reroutes, airframe reassignments, and constraint audit metrics.
            </p>
          </div>
        )}

        {/* Empty State (Ready to Generate) */}
        {!aiAnalysis && !isAnalyzing && (
          <div className="rounded-xl border border-dashed border-border bg-[#FAFAFC] p-7 text-center space-y-3">
            <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
              <Sparkles size={16} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-foreground">
                No Situation Analysis Generated Yet
              </h3>
              <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                Request an objective natural-language explanation of the current CP-SAT optimization result, affected flight corridors, constraint boundaries, and operator action items.
              </p>
            </div>
            <div>
              <button
                onClick={() => handleGenerateAnalysis()}
                disabled={!solveResult}
                className="aero-btn-primary text-xs inline-flex items-center gap-2 py-1.5 px-3.5 shadow-sm"
                id="empty-generate-analysis-btn"
              >
                <Sparkles size={13} />
                <span>Generate Situation Analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* Populated Situation Analysis Panel */}
        {aiAnalysis && !isAnalyzing && (
          <div className="space-y-4">
            {/* Headline & Summary */}
            <div className="rounded-xl border border-[#EAE7F2] bg-white p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-foreground">
                  {aiAnalysis.explanation.headline}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-aero-success/10 text-aero-success">
                  Confidence: {aiAnalysis.explanation.confidence}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {aiAnalysis.explanation.situation_summary}
              </p>
            </div>

            {/* Key Changes & Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-[#EAE7F2] bg-[#FAFAFC] p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                  <span>Key Operational Changes</span>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {aiAnalysis.explanation.key_changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#EAE7F2] bg-[#FAFAFC] p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Compass size={13} className="text-primary shrink-0" />
                  <span>Why This Happened (CP-SAT Rationale)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {aiAnalysis.explanation.optimization_summary}
                </p>
                {aiAnalysis.explanation.allocation_insights.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <span className="text-[11px] font-semibold text-foreground block">Allocation Insights:</span>
                    {aiAnalysis.explanation.allocation_insights.slice(0, 3).map((ins, idx) => (
                      <p key={idx} className="text-[11px] text-muted-foreground leading-normal pl-2 border-l-2 border-primary/30">
                        {ins}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Unresolved Missions & Operator Attention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-red-200/60 bg-red-500/[0.02] p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <AlertCircle size={13} className="text-aero-critical shrink-0" />
                  <span>Unresolved Missions Analysis</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {aiAnalysis.explanation.unresolved_analysis.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-aero-critical mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200/60 bg-amber-500/[0.02] p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span>Operator Attention Required</span>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {aiAnalysis.explanation.operator_attention.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Audit & Grounding Footer Note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#EAE7F2] text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary shrink-0" />
                <span>Generated by Gemini • Based on CP-SAT result (Run ID: {solveResult?.run_id.slice(0, 8)}...)</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                Version: {aiAnalysis.prompt_version} • Generated: {new Date(aiAnalysis.generated_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FLOW STEP 6: Constraint Formulation & Mathematical Audit */}
      <div className="aero-card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Mathematical Formulation & Constraint Audit
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground aero-mono">
            OR-Tools CP-SAT (Deterministic SAT)
          </span>
        </div>

        {/* Precise Crew Methodology Architecture Note */}
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-semibold">Crew Resolution Methodology:</strong>{" "}
          CP-SAT determines conflict-free mission/aircraft allocations and aggregate crew feasibility; a deterministic qualification/rest-aware assignment step selects specific crew personnel while strictly verifying duty hours (&le; 12h) and mandatory ratings.
        </div>

        {/* Section A: Hard Constraints (Inviolable) */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Hard Constraints (Strict Operational Safety — Inviolable)
            </span>
            <span className="aero-badge-success text-[10px] font-bold">100% Enforced</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>1. Aircraft Availability (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Grounded & maintenance airframes excluded: <code className="bg-muted px-1 rounded">x[m, a] == 0</code>.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>2. Capability & Model Match (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Model compatibility, cargo payload, passenger capacity, and range verified.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>3. Crew Availability & Limits (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Duty hours &le; 12h, rest periods, single mission capacity per crew member.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>4. Crew Qualifications (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Role matching; mandatory IFR, SAR_CERT, MOUNTAIN_OPS, and CRITICAL_CARE ratings.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>5. Runway Bounds (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Fixed-wing transports restricted to runway lengths &ge; 1,500 m.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>6. Weather Restrictions (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sub-VFR squall line avoidance via inland detour corridor (Sector C).
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>7. Airspace & NOTAM (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Active hazard airspace prohibited for non-emergency transits.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>8. Airport Availability (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Closed or obstructed bases strictly rejected for departures and arrivals.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CheckCircle2 size={13} className="text-aero-success shrink-0" />
                <span>9. Critical Mission Safety Guarantee (Hard)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Life-safety critical medevac & disaster response missions guaranteed 100% allocation if feasible.
              </p>
            </div>
          </div>
        </div>

        {/* Section B: Soft Optimization Objectives */}
        <div className="space-y-2.5 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Soft Objectives (Multi-Objective Utility Maximization)
            </span>
            <span className="aero-badge-primary text-[10px] font-bold">Weighted Tuning</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
              <div className="text-xs font-semibold text-foreground">
                1. Mission Priority Utility
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Critical (+20,000), High (+10,000), Medium (+4,000), Low (+1,000) reward tiers.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
              <div className="text-xs font-semibold text-foreground">
                2. Mission Urgency Factor
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Continuous priority multiplier: <code className="bg-muted px-1 rounded">+20 &times; urgency_score</code>.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
              <div className="text-xs font-semibold text-foreground">
                3. Fleet Stability (Anti-Churn)
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Airframe retention bonus (+100) vs unnecessary reassignment penalty (-40).
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
              <div className="text-xs font-semibold text-foreground">
                4. Base Staging Proximity
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Same-station departure reward (+60) vs cross-base ferry penalty (-30).
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
              <div className="text-xs font-semibold text-foreground">
                5. Detour Minimization
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Direct tracks preferred (-35 detour penalty unless forced by hazard airspace).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Solver Audit Log */}
      <div className="aero-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border p-4 bg-surface">
          <History size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Optimization Solver Audit Log
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4">Run ID</th>
                <th className="py-2.5 px-3">Trigger Reason</th>
                <th className="py-2.5 px-3">Solver Status</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Missions (Assigned / Total)</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runsHistory.length > 0 ? (
                runsHistory.map((run) => (
                  <tr key={run.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-muted-foreground text-[11px]">
                      {run.id.slice(0, 8)}...
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {run.trigger_reason}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="aero-badge-success text-[10px]">
                        {run.solver_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 aero-mono text-muted-foreground">
                      {run.solve_time_ms} ms
                    </td>
                    <td className="py-2.5 px-3 aero-mono font-medium text-foreground">
                      {run.assigned_missions} / {run.total_missions}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground text-[11px]">
                      {new Date(run.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No historical runs logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modals for Destructive Operations */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Operational Baseline"
        description="Are you sure you want to restore the nominal operational baseline? Active weather disruptions, grounded airframes, and flight corridor detours will be reset to nominal conditions. Historical optimization runs and AI analysis records will remain preserved."
        confirmText="Reset Baseline"
        confirmButtonId="confirm-reset-btn"
        variant="warning"
        isLoading={isResetting}
        onConfirm={async () => {
          setShowResetModal(false);
          await handleResetBaseline();
        }}
        onCancel={() => setShowResetModal(false)}
      />

      <ConfirmModal
        isOpen={showApplyModal}
        title="Apply Recommended Fleet Allocations"
        description="Are you sure you want to commit these recommended airframe reassignments and corridor detours to live fleet dispatch? The solver recommendation and optimization run will remain recorded for historical audit compliance."
        confirmText="Apply to Fleet"
        confirmButtonId="confirm-apply-btn"
        variant="primary"
        isLoading={isApplying}
        onConfirm={async () => {
          setShowApplyModal(false);
          await handleApply();
        }}
        onCancel={() => setShowApplyModal(false)}
      />
    </div>
  );
}
