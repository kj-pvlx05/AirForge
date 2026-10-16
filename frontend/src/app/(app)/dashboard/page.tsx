"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import {
  fetchReadiness,
  fetchMissions,
  fetchEvents,
  fetchAirports,
  fetchSectors,
  fetchAircraft,
  fetchEnvironment,
  ReadinessReport,
  Mission,
  OperationalEvent,
  Airport,
  Sector,
  Aircraft,
  WeatherCondition,
  AirspaceRestriction,
  ApiError,
  SimulationResult,
  triggerSimulationScenario,
  resetSimulation,
  solveOptimization,
  applyRecommendation,
  OptimizationSolveResponse,
} from "@/lib/api";
import { RotateCcw } from "lucide-react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { SituationPanel } from "@/components/dashboard/situation-panel";
import { OperationalMap } from "@/components/dashboard/operational-map";
import { ActiveMissions } from "@/components/dashboard/active-missions";
import { RecentEvents } from "@/components/dashboard/recent-events";

import { SelectedFeature } from "@/components/dashboard/map/types";

export default function DashboardPage() {
  const router = useRouter();

  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [weather, setWeather] = useState<WeatherCondition[]>([]);
  const [restrictions, setRestrictions] = useState<AirspaceRestriction[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [optimizationResult, setOptimizationResult] = useState<OptimizationSolveResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isApplyingRecommendation, setIsApplyingRecommendation] = useState(false);
  const [hasAppliedRecommendation, setHasAppliedRecommendation] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        readinessData,
        missionsData,
        eventsData,
        airportsData,
        sectorsData,
        aircraftData,
        environmentData,
      ] = await Promise.all([
        fetchReadiness(),
        fetchMissions(),
        fetchEvents({ limit: 6 }),
        fetchAirports(),
        fetchSectors(),
        fetchAircraft(),
        fetchEnvironment().catch(() => ({ weather: [], restrictions: [], sectors: [] })),
      ]);

      setReadiness(readinessData);
      setMissions(missionsData);
      setEvents(eventsData);
      setAirports(airportsData);
      setSectors(sectorsData);
      setAircraft(aircraftData);
      setWeather(environmentData.weather || []);
      setRestrictions(environmentData.restrictions || []);
    } catch (err: unknown) {
      console.error("Dashboard fetch error:", err);
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
          ? err.message
          : "Unable to connect to FastAPI backend server. Ensure backend is running on port 8000.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSolveOptimization = useCallback(async () => {
    try {
      setIsOptimizing(true);
      setError(null);
      const res = await solveOptimization({
        trigger_reason: simulationResult ? "weather_deterioration_sector_b" : "manual_optimization",
        simulation_event_id: simulationResult?.event_id,
        allow_rerouting: true,
      });
      setOptimizationResult(res);
      setHasAppliedRecommendation(false);
    } catch (err: unknown) {
      console.error("Optimization solve error:", err);
      setError("Failed to run OR-Tools CP-SAT optimizer. Check backend logs.");
    } finally {
      setIsOptimizing(false);
    }
  }, [simulationResult]);

  const handleApplyRecommendation = useCallback(async () => {
    if (!optimizationResult) return;
    try {
      setIsApplyingRecommendation(true);
      setError(null);
      await applyRecommendation(optimizationResult.recommendation_id);
      setHasAppliedRecommendation(true);
      await loadDashboardData();
    } catch (err: unknown) {
      console.error("Apply recommendation error:", err);
      setError("Failed to apply recommendation allocations.");
    } finally {
      setIsApplyingRecommendation(false);
    }
  }, [optimizationResult, loadDashboardData]);

  const handleRunSimulation = useCallback(async () => {
    try {
      setIsSimulating(true);
      setError(null);
      const res = await triggerSimulationScenario({
        scenario: "weather_deterioration",
        target_id: "SEC-B",
      });
      setSimulationResult(res);
      await loadDashboardData();

      // Automatically compute optimal CP-SAT remediations for mutated state
      try {
        const optRes = await solveOptimization({
          trigger_reason: "weather_deterioration_sector_b",
          simulation_event_id: res.event_id,
          allow_rerouting: true,
        });
        setOptimizationResult(optRes);
        setHasAppliedRecommendation(false);
      } catch (optErr) {
        console.warn("Auto-optimization solve deferred:", optErr);
      }
    } catch (err: unknown) {
      console.error("Simulation run error:", err);
      setError("Failed to apply simulation event. Ensure backend is running.");
    } finally {
      setIsSimulating(false);
    }
  }, [loadDashboardData]);

  const handleResetSimulation = useCallback(async () => {
    try {
      setIsSimulating(true);
      setError(null);
      await resetSimulation();
      setSimulationResult(null);
      setOptimizationResult(null);
      setHasAppliedRecommendation(false);
      await loadDashboardData();
    } catch (err: unknown) {
      console.error("Simulation reset error:", err);
      setError("Failed to reset operational state.");
    } finally {
      setIsSimulating(false);
    }
  }, [loadDashboardData]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [
          readinessData,
          missionsData,
          eventsData,
          airportsData,
          sectorsData,
          aircraftData,
          environmentData,
        ] = await Promise.all([
          fetchReadiness(),
          fetchMissions(),
          fetchEvents({ limit: 6 }),
          fetchAirports(),
          fetchSectors(),
          fetchAircraft(),
          fetchEnvironment().catch(() => ({ weather: [], restrictions: [], sectors: [] })),
        ]);

        if (active) {
          setReadiness(readinessData);
          setMissions(missionsData);
          setEvents(eventsData);
          setAirports(airportsData);
          setSectors(sectorsData);
          setAircraft(aircraftData);
          setWeather(environmentData.weather || []);
          setRestrictions(environmentData.restrictions || []);
          setLoading(false);

          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const inspectParam = params.get("inspect");
            if (inspectParam === "sector" || inspectParam === "sec-b") {
              const secB = sectorsData.find((s) => s.code === "SEC-B");
              if (secB) {
                const wB = (environmentData.weather || []).find((w: WeatherCondition) =>
                  w.region.includes("Sector B")
                );
                setSelectedFeature({
                  type: "sector",
                  id: secB.id,
                  data: {
                    ...secB,
                    weather_condition: wB?.condition || "scattered-clouds",
                    ceiling_ft: wB?.ceiling_ft || 4200,
                    visibility_km: wB?.visibility_km || 8.5,
                    wind_speed_kts: wB?.wind_speed_kts || 14,
                    is_watch: true,
                  },
                });
              }
            } else if (inspectParam === "base" || inspectParam === "bravo") {
              const airB = airportsData.find((a) => a.code === "SYN-BRAVO");
              if (airB) {
                setSelectedFeature({
                  type: "airport",
                  id: airB.id,
                  data: airB,
                });
              }
            }
          }
        }
      } catch (err: unknown) {
        if (active) {
          const message =
            err instanceof ApiError
              ? err.detail
              : err instanceof Error
              ? err.message
              : "Unable to connect to backend.";
          setError(message);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      active = false;
    };
  }, []);

  const isSimulated = Boolean(
    simulationResult ||
    weather.some((w) => w.condition === "thunderstorm" || (w.sector_id && w.visibility_km < 3.0)) ||
    sectors.some((s) => s.code === "SEC-B" && s.risk_level === "high") ||
    (readiness && readiness.fleet.grounded > 1)
  );

  return (
    <div className="flex flex-col gap-5 max-w-[1720px] mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Operational Overview
            {isSimulated && (
              <span className="aero-badge-warning text-[11px] font-normal">
                Simulation Active
              </span>
            )}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Real-time synchronization across fleet inventory, crew qualifications, and active sorties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSimulated && (
            <button
              onClick={() => handleResetSimulation()}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-aero-warning/40 bg-aero-warning/10 px-3 py-1.5 text-xs font-medium text-aero-warning transition-all hover:bg-aero-warning/20 active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw size={13} className={isSimulating ? "animate-spin" : ""} />
              <span>Reset Baseline</span>
            </button>
          )}

          <button
            onClick={() => loadDashboardData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-primary" : "text-muted-foreground"} />
            <span>Sync State</span>
          </button>
        </div>
      </div>

      {/* Error state if backend fails */}
      {error && (
        <div className="rounded-xl border border-aero-warning/40 bg-aero-warning/5 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-aero-warning shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-semibold text-foreground">Operational Data Sync Warning</span>
            <p className="text-muted-foreground mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="text-xs font-medium text-primary hover:underline cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Alert Banner: Only shows when relevant */}
      <AlertBanner
        message={
          isSimulated
            ? "Weather deterioration active in Sector B · 2 aircraft sub-VFR grounded"
            : "Weather deterioration monitored near Sector B · Convective squalls forecast"
        }
        detail={
          isSimulated
            ? "Visibility 2.5 km, Ceilings 1,500 ft. Sub-VFR groundings active on Bravo Base. Corridors impacted."
            : "4 aircraft and 3 scheduled missions in coastal corridor potentially impacted."
        }
        onActionClick={() => {
          const secB = sectors.find((s) => s.code === "SEC-B");
          const weatherB = weather.find(
            (w) => w.region.includes("Sector B") || w.sector_id === secB?.id
          );
          if (secB) {
            setSelectedFeature({
              type: "sector",
              id: secB.id,
              data: {
                ...secB,
                weather_condition: weatherB?.condition || (isSimulated ? "thunderstorm" : "scattered-clouds"),
                ceiling_ft: weatherB?.ceiling_ft || (isSimulated ? 1500 : 4200),
                visibility_km: weatherB?.visibility_km || (isSimulated ? 2.5 : 8.5),
                wind_speed_kts: weatherB?.wind_speed_kts || (isSimulated ? 28 : 14),
                is_watch: true,
              },
            });
          }
        }}
      />

      {/* 1. Operational Summary KPIs (Populated from /api/readiness) */}
      <KpiCards data={readiness} loading={loading} />

      {/* 2. Primary Workspace: Map (Visual Focus) + Situation Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-4 items-stretch min-h-[500px]">
        {/* Central Operational Map */}
        <OperationalMap
          airports={airports}
          sectors={sectors}
          aircraft={aircraft}
          missions={missions}
          weather={weather}
          restrictions={restrictions}
          loading={loading}
          selectedFeature={selectedFeature}
          onSelectFeature={setSelectedFeature}
        />

        {/* Right Situation Analysis Panel */}
        <div className="h-full min-h-[460px]">
          <SituationPanel
            readiness={readiness}
            loading={loading}
            onExploreScenario={() => router.push("/optimization")}
            simulationResult={simulationResult}
            onRunSimulation={handleRunSimulation}
            onResetSimulation={handleResetSimulation}
            isSimulating={isSimulating}
            optimizationResult={optimizationResult}
            isOptimizing={isOptimizing}
            onSolveOptimization={handleSolveOptimization}
            onApplyRecommendation={handleApplyRecommendation}
            isApplyingRecommendation={isApplyingRecommendation}
            hasAppliedRecommendation={hasAppliedRecommendation}
          />
        </div>
      </div>

      {/* 3. Lower Content: Active Missions + Operational Events Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-stretch">
        <div className="h-full min-h-[380px]">
          <ActiveMissions missions={missions} loading={loading} />
        </div>

        <div className="h-full min-h-[380px]">
          <RecentEvents events={events} loading={loading} />
        </div>
      </div>
    </div>
  );
}
