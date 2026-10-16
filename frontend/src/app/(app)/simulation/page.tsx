"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Play,
  RotateCcw,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  triggerSimulationScenario,
  resetSimulation,
  fetchSimulationEvents,
  fetchSimulationResult,
  SimulationResult,
  SimulationEventItem,
} from "@/lib/api";
import { BeforeAfterCard, ImpactDetails } from "@/components/simulation";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const SCENARIOS = [
  {
    id: "weather_deterioration",
    title: "Weather Deterioration (Flagship)",
    target: "SEC-B",
    targetLabel: "Sector B · Coastal Air Corridor (Bravo Base)",
    category: "Weather",
    description:
      "Severe convective squall line reduces visibility to 2.5 km and ceiling to 1,500 ft AGL. Sub-VFR flight suspensions ground 2 unequipped aircraft at Bravo Base.",
    enabled: true,
  },
  {
    id: "aircraft_unavailable",
    title: "Unscheduled Technical Grounding",
    target: "AS-LM01",
    targetLabel: "AeroLift M1 · Alpha Base",
    category: "Fleet",
    description:
      "Avionics diagnostic alert grounds primary high-priority medevac transport. Triggers resource reassignment.",
    enabled: false,
    badge: "Phase 7",
  },
  {
    id: "airspace_restriction",
    title: "Search Grid NOTAM Activation",
    target: "SEC-D",
    targetLabel: "Sector D · Eastern Relief Zone",
    category: "Airspace",
    description:
      "Maritime SAR grid restricts civilian transit between 500 ft and 4,000 ft AGL.",
    enabled: false,
    badge: "Phase 7",
  },
  {
    id: "new_high_priority_task",
    title: "Urgent Flood Evacuation Surge",
    target: "SYN-DELTA",
    targetLabel: "Delta Relief Camp",
    category: "Missions",
    description:
      "Emergent flash flood creates 3 critical passenger evacuation sorties requiring heavy-lift helicopters.",
    enabled: false,
    badge: "Phase 7",
  },
];

export default function SimulationPage() {
  const [selectedScenario, setSelectedScenario] = useState("weather_deterioration");
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [auditEvents, setAuditEvents] = useState<SimulationEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      const events = await fetchSimulationEvents();
      setAuditEvents(events);
    } catch (err) {
      console.warn("Could not refresh simulation history:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const events = await fetchSimulationEvents();
        if (!active) return;
        setAuditEvents(events);
        if (events.length > 0) {
          const latest = events[0];
          if (latest.status === "applied" || latest.status === "completed") {
            try {
              const fullResult = await fetchSimulationResult(latest.id);
              if (active) setSimulationResult(fullResult);
            } catch {
              // Ignore if result fetch fails
            }
          }
        }
      } catch (err) {
        console.warn("Could not load simulation history:", err);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await triggerSimulationScenario({
        scenario: selectedScenario,
        target_id: "SEC-B",
      });
      setSimulationResult(res);
      setSuccessMessage(
        "Simulation successfully executed. State mutation applied and operational impact detected."
      );
      await refreshHistory();
    } catch (err: unknown) {
      console.error("Simulation trigger failed:", err);
      setError("Failed to execute simulation scenario. Verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await resetSimulation();
      setSimulationResult(null);
      setSuccessMessage("Operational environment restored to nominal baseline.");
      await refreshHistory();
    } catch (err: unknown) {
      console.error("Reset failed:", err);
      setError("Failed to reset operational state.");
    } finally {
      setIsResetting(false);
    }
  };

  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenario) || SCENARIOS[0];

  return (
    <div className="flex flex-col gap-6 max-w-[1720px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Simulation Center
            </h1>
            <span className="aero-badge-primary text-[11px]">Phase 6</span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Trigger deterministic operational events, mutate real-time backend state, and observe system-wide impact before constraint optimization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {simulationResult && (
            <button
              id="sim-reset-btn"
              onClick={() => setShowResetModal(true)}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw size={13} className={isResetting ? "animate-spin text-primary" : "text-muted-foreground"} />
              <span>Reset Baseline</span>
            </button>
          )}

          <Link
            href="/dashboard?inspect=sec-b"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-all"
          >
            <MapPin size={13} className="text-primary" />
            <span>Inspect Map</span>
          </Link>
        </div>
      </div>

      {/* Status Banners */}
      {successMessage && (
        <div className="rounded-xl border border-aero-success/30 bg-aero-success/5 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 size={16} className="text-aero-success shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-aero-critical/30 bg-aero-critical/5 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <AlertTriangle size={16} className="text-aero-critical shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Layout: Scenario Selection & Execution Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5 items-stretch">
        {/* 1. Scenario Catalog Card */}
        <div className="aero-card flex flex-col justify-between p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <FlaskConical size={15} className="text-primary" />
                Operational Scenario Catalog
              </span>
              <span className="text-[11px] text-muted-foreground">
                Select an operational disturbance
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  disabled={!sc.enabled}
                  onClick={() => setSelectedScenario(sc.id)}
                  className={`rounded-xl border p-3.5 text-left transition-all flex flex-col justify-between ${
                    selectedScenario === sc.id
                      ? "border-primary bg-primary-vsoft/60 shadow-xs ring-1 ring-primary/20"
                      : sc.enabled
                      ? "border-border bg-card hover:border-primary/40 cursor-pointer"
                      : "border-border/60 bg-muted/20 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {sc.category}
                      </span>
                      {sc.badge && (
                        <span className="aero-badge-neutral text-[9px]">{sc.badge}</span>
                      )}
                      {sc.enabled && selectedScenario === sc.id && (
                        <span className="aero-badge-primary text-[9px]">Selected</span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-foreground">
                      {sc.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {sc.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground aero-mono flex items-center gap-1">
                    <MapPin size={10} />
                    <span>{sc.target}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Deterministic Execution Engine</span>
            <span className="text-foreground font-medium">Zero Stochastic Noise</span>
          </div>
        </div>

        {/* 2. Scenario Trigger & Parameters Panel */}
        <div className="aero-card flex flex-col justify-between p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                Scenario Parameters & Execution
              </span>
              <span className="aero-badge-neutral text-[10px]">Deterministic</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border bg-background/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {activeScenario.title}
                  </span>
                  <span className="aero-badge-warning text-[10px]">
                    {activeScenario.target}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {activeScenario.description}
                </p>
                <div className="text-[11px] text-primary font-medium flex items-center gap-1">
                  <MapPin size={12} />
                  <span>Target: {activeScenario.targetLabel}</span>
                </div>
              </div>

              {/* Exact Mutation Parameters */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Configured State Transitions
                </span>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between pb-1 border-b border-border/40">
                    <span className="text-muted-foreground">Visibility:</span>
                    <span className="font-semibold text-foreground aero-mono">
                      8.5 km → <span className="text-aero-critical">2.5 km</span>
                    </span>
                  </div>

                  <div className="flex justify-between pb-1 border-b border-border/40">
                    <span className="text-muted-foreground">Cloud Ceiling:</span>
                    <span className="font-semibold text-foreground aero-mono">
                      4,200 ft → <span className="text-aero-critical">1,500 ft</span>
                    </span>
                  </div>

                  <div className="flex justify-between pb-1 border-b border-border/40">
                    <span className="text-muted-foreground">Wind Velocity:</span>
                    <span className="font-semibold text-foreground aero-mono">
                      14 kt → <span className="text-aero-warning">28 kt (Gusting 35)</span>
                    </span>
                  </div>

                  <div className="flex justify-between pb-1 border-b border-border/40">
                    <span className="text-muted-foreground">Airspace Risk Level:</span>
                    <span className="font-semibold text-foreground">
                      Nominal → <span className="text-aero-critical">High / Watch</span>
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flight Rules Status:</span>
                    <span className="font-semibold text-foreground">
                      VFR Allowed → <span className="text-aero-critical">Sub-VFR Suspended</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-primary/90 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCcw size={14} className="animate-spin" />
                  <span>Mutating Operational State...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Run Weather Deterioration Simulation</span>
                </>
              )}
            </button>

            {simulationResult && (
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98] cursor-pointer"
              >
                <RotateCcw size={14} className={isResetting ? "animate-spin text-primary" : "text-muted-foreground"} />
                <span>Reset to Baseline</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Result Section: BEFORE → EVENT → AFTER */}
      {simulationResult ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                Simulation Execution Result
                <span className="aero-badge-success text-[10px]">Applied</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full immutable state comparison and backend relational impact detection.
              </p>
            </div>

            <Link
              href="/dashboard?inspect=sec-b"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <span>View mutated sectors on MapLibre</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* BEFORE → EVENT → AFTER Component */}
          <BeforeAfterCard result={simulationResult} />

          {/* Detailed Relational Impact Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers size={14} className="text-primary" />
                Operational Impact Breakdown
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Missions, aircraft, and routes identified via database foreign keys
              </span>
            </div>
            <ImpactDetails impact={simulationResult.impact} />
          </div>
        </div>
      ) : (
        <div className="aero-card flex flex-col items-center justify-center gap-3 p-12 text-center border-dashed">
          <div className="rounded-full bg-primary-vsoft p-4 text-primary">
            <FlaskConical size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Awaiting Scenario Execution
          </h3>
          <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
            Click <strong>&quot;Run Weather Deterioration Simulation&quot;</strong> above to mutate Sector B&apos;s weather state, calculate affected sorties and grounded aircraft, and inspect the before/after operational state transition.
          </p>
          <div className="mt-1 flex gap-2">
            <span className="aero-badge-neutral text-[10px]">Sector B: Coastal Corridor</span>
            <span className="aero-badge-neutral text-[10px]">Target: Bravo Base</span>
            <span className="aero-badge-neutral text-[10px]">Deterministic Output</span>
          </div>
        </div>
      )}

      {/* Audit History Log */}
      <div className="aero-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">
              Simulation Audit Feed
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground aero-mono">
            {auditEvents.length} recorded events
          </span>
        </div>

        {auditEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Scenario</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Event ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 text-muted-foreground aero-mono">
                      {new Date(evt.triggered_at || evt.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-2 font-medium text-foreground">
                      {evt.scenario_type}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {evt.title}
                    </td>
                    <td className="py-2">
                      <span className="aero-badge-success text-[10px]">
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-2 aero-mono text-muted-foreground text-[11px]">
                      {evt.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            No simulation runs recorded in current session.
          </p>
        )}
      </div>

      {/* Confirmation Modal for Simulation Baseline Reset */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Restore Simulation Baseline"
        description="Are you sure you want to restore the nominal baseline? Active weather squalls, grounded airframes, and flight corridor detours will be reset to nominal conditions. Simulation event history remains recorded."
        confirmText="Restore Baseline"
        confirmButtonId="confirm-sim-reset-btn"
        variant="warning"
        isLoading={isResetting}
        onConfirm={async () => {
          setShowResetModal(false);
          await handleReset();
        }}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
}
