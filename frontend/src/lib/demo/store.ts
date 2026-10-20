"use client";

import seedData from "./seed.json";
import { DEMO_PROFILES, DemoProfile, getProfileById } from "./profiles";
import {
  ReadinessReport,
  Airport,
  Sector,
  Aircraft,
  Crew,
  Mission,
  OperationalEvent,
  WeatherCondition,
  AirspaceRestriction,
  OptimizationResult,
  OptimizationRequest,
  SimulationResult,
  ApplyRecommendationResponse,
} from "../api/types";

export interface DemoStoreState {
  airports: Airport[];
  sectors: Sector[];
  aircraft: Aircraft[];
  crew: Crew[];
  missions: Mission[];
  weather: WeatherCondition[];
  restrictions: AirspaceRestriction[];
  events: OperationalEvent[];
  activeSimulation: SimulationResult | null;
  optimizationRuns: OptimizationResult[];
  appliedRecommendations: string[];
}

const DEMO_STORAGE_KEY = "aerosync_demo_store_v1";
const DEMO_MODE_KEY = "aerosync_demo_mode_active";
const DEMO_PROFILE_KEY = "aerosync_demo_profile_id";

function getInitialState(): DemoStoreState {
  return {
    airports: (seedData.airports as unknown) as Airport[],
    sectors: (seedData.sectors as unknown) as Sector[],
    aircraft: (seedData.aircraft as unknown) as Aircraft[],
    crew: (seedData.crew as unknown) as Crew[],
    missions: (seedData.missions as unknown) as Mission[],
    weather: (seedData.weather as unknown) as WeatherCondition[],
    restrictions: (seedData.restrictions as unknown) as AirspaceRestriction[],
    events: [
      {
        id: "ev-demo-01",
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: "info",
        category: "system",
        title: "Operational Staging Synchronized",
        description: "5 airports, 22 airframes, and 32 crew personnel online in synthetic theater.",
        metadata: { entities: ["SYN-ALPHA", "SYN-BRAVO", "SYN-CHARLIE"] },
      },
      {
        id: "ev-demo-02",
        created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        type: "warning",
        category: "weather",
        title: "Convective Squall Warning",
        description: "Coastal Sector B reporting wind gusts to 38kt, cloud base dropping to 900ft AGL.",
        metadata: { entities: ["SEC-B", "SYN-BRAVO"] },
      },
      {
        id: "ev-demo-03",
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: "info",
        category: "mission",
        title: "Sortie DELTA-RELIEF-01 Airborne",
        description: "AL-104 dispatched from Bravo Forward Base for rapid flood relief staging.",
        metadata: { entities: ["AL-104", "SYN-BRAVO"] },
      },
    ],
    activeSimulation: null,
    optimizationRuns: [],
    appliedRecommendations: [],
  };
}

export function isDemoModeActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_MODE_KEY) === "true";
}

export function setDemoMode(active: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_MODE_KEY, active ? "true" : "false");
  window.dispatchEvent(new CustomEvent("aerosync_demo_change", { detail: { active } }));
}

export function getActiveDemoProfile(): DemoProfile {
  if (typeof window === "undefined") return DEMO_PROFILES[0];
  const storedId = localStorage.getItem(DEMO_PROFILE_KEY);
  return getProfileById(storedId || "commander");
}

export function setActiveDemoProfile(profileId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_PROFILE_KEY, profileId);
  window.dispatchEvent(
    new CustomEvent("aerosync_demo_profile_change", {
      detail: getProfileById(profileId),
    })
  );
}

export function getDemoStore(): DemoStoreState {
  if (typeof window === "undefined") return getInitialState();
  const raw = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) {
    const init = getInitialState();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  try {
    return JSON.parse(raw) as DemoStoreState;
  } catch {
    const init = getInitialState();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(init));
    return init;
  }
}

export function saveDemoStore(state: DemoStoreState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("aerosync_demo_store_update", { detail: state }));
}

export function resetDemoStore(): void {
  if (typeof window === "undefined") return;
  const init = getInitialState();
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(init));
  window.dispatchEvent(new CustomEvent("aerosync_demo_store_update", { detail: init }));
  window.dispatchEvent(new CustomEvent("aerosync_demo_reset"));
}

/* ── Synthetic Read Handlers ── */

export function getDemoReadinessReport(): ReadinessReport {
  const s = getDemoStore();
  const totalFleet = s.aircraft.length;
  const availableFleet = s.aircraft.filter((a) => a.status === "available").length;
  const maintenanceFleet = s.aircraft.filter((a) => a.status === "maintenance").length;
  const groundedFleet = s.aircraft.filter((a) => a.status === "grounded").length;
  const inMissionFleet = s.aircraft.filter((a) => a.status === "in-mission").length;

  const totalCrew = s.crew.length;
  const availableCrew = s.crew.filter((c) => c.status === "available").length;
  const onMissionCrew = s.crew.filter((c) => c.status === "on-mission").length;
  const offDutyCrew = s.crew.filter((c) => c.status === "off-duty").length;
  const medicalCrew = s.crew.filter((c) => c.status === "medical").length;

  const activeMissions = s.missions.filter((m) => m.status === "active").length;
  const scheduledMissions = s.missions.filter((m) => m.status === "scheduled").length;
  const criticalMissions = s.missions.filter((m) => m.priority === "critical").length;
  const highMissions = s.missions.filter((m) => m.priority === "high").length;

  const fleetPct = totalFleet > 0 ? (availableFleet / totalFleet) * 100 : 0;
  const crewPct = totalCrew > 0 ? (availableCrew / totalCrew) * 100 : 0;
  const operationalReadinessPct = Math.round(fleetPct * 0.5 + crewPct * 0.5);

  const statusLevel: "nominal" | "caution" | "degraded" =
    operationalReadinessPct >= 80 ? "nominal" : operationalReadinessPct >= 60 ? "caution" : "degraded";

  return {
    operational_readiness_pct: operationalReadinessPct,
    status_level: statusLevel,
    fleet: {
      available: availableFleet,
      total: totalFleet,
      maintenance: maintenanceFleet,
      grounded: groundedFleet,
      in_mission: inMissionFleet,
      availability_pct: fleetPct,
    },
    crew: {
      available: availableCrew,
      total: totalCrew,
      on_mission: onMissionCrew,
      off_duty: offDutyCrew,
      medical: medicalCrew,
      availability_pct: crewPct,
    },
    missions: {
      total: s.missions.length,
      active: activeMissions,
      scheduled: scheduledMissions,
      critical: criticalMissions,
      high: highMissions,
    },
    generated_at: new Date().toISOString(),
  };
}

/* ── Synthetic Mutation Handlers (No Supabase writes) ── */

export function triggerDemoSimulation(scenario: string, target_id: string): SimulationResult {
  const s = getDemoStore();

  const sectorIndex = s.sectors.findIndex((sec) => sec.code === target_id || sec.id === target_id);

  if (sectorIndex >= 0) {
    s.sectors[sectorIndex].risk_level = "high";
    s.sectors[sectorIndex].status = "restricted";
  }

  const eventId = `sim-demo-${Date.now()}`;
  const simEvent: OperationalEvent = {
    id: eventId,
    created_at: new Date().toISOString(),
    type: "critical",
    category: "weather",
    title: `Simulation: ${scenario.replace(/_/g, " ").toUpperCase()}`,
    description: `Hazard injected into ${target_id}. Operational risk elevated; flight corridors affected.`,
    metadata: { scenario, target: target_id },
  };

  s.events.unshift(simEvent);

  const result: SimulationResult = {
    event_id: eventId,
    scenario,
    target: target_id,
    status: "applied",
    state_before: {
      readiness_score: 82.5,
      readiness_status: "nominal",
      fleet: {
        total: 22,
        available: 16,
        in_mission: 3,
        maintenance: 2,
        grounded: 1,
      },
      crew: {
        total: 32,
        available: 24,
        on_mission: 4,
        off_duty: 4,
      },
      missions: {
        total: 16,
        active: 3,
        scheduled: 11,
        critical: 4,
        high: 6,
      },
    },
    event: { id: eventId, scenario, target_id },
    state_after: {
      readiness_score: 64.0,
      readiness_status: "caution",
      fleet: {
        total: 22,
        available: 14,
        in_mission: 3,
        maintenance: 2,
        grounded: 3,
      },
      crew: {
        total: 32,
        available: 21,
        on_mission: 4,
        off_duty: 4,
      },
      missions: {
        total: 16,
        active: 2,
        scheduled: 9,
        critical: 4,
        high: 6,
      },
    },
    impact: {
      affected_sectors: [
        {
          id: "sec-b",
          code: "SEC-B",
          name: "Sector B - Coastal Corridor",
          risk_before: "medium",
          risk_after: "high",
          weather_condition_before: "scattered-clouds",
          weather_condition_after: "thunderstorm",
          ceiling_ft_before: 4200,
          ceiling_ft_after: 1500,
          visibility_km_before: 8.5,
          visibility_km_after: 2.5,
          wind_kts_before: 14,
          wind_kts_after: 28,
        },
      ],
      affected_aircraft: [
        {
          id: "a1000000-0000-0000-0000-000000000004",
          tail_number: "AL-104",
          model: "AeroLift M1",
          status_before: "available",
          status_after: "grounded",
          reason: "Sub-VFR weather hold at Bravo Forward Base",
        },
      ],
      affected_missions: [
        {
          id: "m0000000-0000-0000-0000-000000000004",
          code: "MSN-004",
          title: "Coastal Medevac Transfer",
          priority: "critical",
          origin_code: "SYN-BRAVO",
          destination_code: "SYN-ALPHA",
          impact_reason: "Route intersects convective squall line in Sector B",
        },
      ],
      affected_routes: [],
      summary: { missions_delayed: 2, aircraft_grounded: 2 },
    },
    created_at: new Date().toISOString(),
  };

  s.activeSimulation = result;
  saveDemoStore(s);
  return result;
}

export function resetDemoSimulation(): { status: string; message: string } {
  const s = getDemoStore();
  s.sectors.forEach((sec) => {
    if (sec.code === "SEC-B") {
      sec.risk_level = "medium";
      sec.status = "active";
    }
  });
  s.activeSimulation = null;
  saveDemoStore(s);
  return { status: "success", message: "Demo simulation reset to baseline state." };
}

export function solveDemoOptimization(options?: OptimizationRequest): OptimizationResult {
  const s = getDemoStore();
  const runId = `opt-demo-${Date.now()}`;
  const recId = `rec-demo-${Date.now()}`;

  const response: OptimizationResult = {
    run_id: runId,
    recommendation_id: recId,
    status: "optimal",
    solver_status: "OPTIMAL",
    objective_score: 94.8,
    objective_value: 94.8,
    solve_time_ms: 84,
    total_missions: 16,
    assigned_missions: 16,
    unassigned_missions: 0,
    reassignments_count: 2,
    rerouted_count: 1,
    allocations: [
      {
        mission_id: "m0000000-0000-0000-0000-000000000004",
        mission_code: "MSN-004",
        aircraft_id: "a1000000-0000-0000-0000-000000000002",
        aircraft_tail: "AL-102",
        reason: "Bypass convective squall in Sector B via Central Corridor C",
        corridor: "CORRIDOR-C",
        action_type: "reroute",
        score: 95.0,
      },
    ],
    unresolved_missions: [],
    metrics: {
      missions_total: 16,
      missions_affected: 2,
      missions_covered: 16,
      missions_unresolved: 0,
      aircraft_reassigned: 2,
      missions_rerouted: 1,
      resource_utilization_pct: 94.8,
      solve_time_ms: 84,
    },
    constraints: {
      hard_constraints_satisfied: true,
      violations: [],
      constraints_enforced: [
        "Aircraft range limits",
        "VFR weather minimums",
        "Crew duty-hour limits",
        "Station maintenance capacity",
      ],
    },
    reassignments: [
      {
        mission_id: "m0000000-0000-0000-0000-000000000004",
        mission_code: "MSN-004",
        mission_title: "Coastal Medevac Transfer",
        priority: "critical",
        origin_code: "SYN-BRAVO",
        destination_code: "SYN-ALPHA",
        recommended_aircraft_id: "a1000000-0000-0000-0000-000000000002",
        recommended_aircraft_tail: "AL-102",
        recommended_aircraft_model: "AeroLift H2",
        original_corridor: "CORRIDOR-B",
        recommended_corridor: "CORRIDOR-C",
        action_type: "reroute",
        reason: "Avoid convective squalls while preserving fuel reserves.",
      },
    ],
    recommendation: {
      id: recId,
      optimization_run_id: runId,
      title: "Optimal Reroute and Airframe Reassignment",
      summary:
        "CP-SAT solver converged with 94.8% efficiency. Reroutes MSN-004 via Corridor C to bypass convective weather.",
      action_type: "reroute_mission",
      allocations: [
        {
          mission_id: "m0000000-0000-0000-0000-000000000004",
          mission_code: "MSN-004",
          aircraft_id: "a1000000-0000-0000-0000-000000000002",
          aircraft_tail: "AL-102",
          reason: "Bypass convective squall in Sector B via Central Corridor C",
          corridor: "CORRIDOR-C",
          action_type: "reroute",
          score: 95.0,
        },
      ],
      impact_summary: {
        readiness_delta: 7.5,
        delay_minutes: 12,
        risk_mitigation: "severe_convective_hazard_avoided",
      },
      ai_explanation:
        "By dynamically shifting coastal transit from Sector B to Central Corridor C, flight exposure to convective squalls is eliminated while keeping total en-route delay under 15 minutes.",
      status: "pending_review",
      created_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };

  s.optimizationRuns.unshift(response);
  saveDemoStore(s);
  return response;
}

export function applyDemoRecommendation(recommendation_id: string): ApplyRecommendationResponse {
  const s = getDemoStore();
  if (!s.appliedRecommendations.includes(recommendation_id)) {
    s.appliedRecommendations.push(recommendation_id);
  }

  s.events.unshift({
    id: `ev-apply-${Date.now()}`,
    created_at: new Date().toISOString(),
    type: "info",
    category: "system",
    title: "Optimization Recommendation Applied (Demo State)",
    description: `Recommendation ${recommendation_id} executed locally. Fleet disposition updated.`,
    metadata: { recommendation_id },
  });

  saveDemoStore(s);
  return {
    status: "applied",
    message: "Recommendation applied to local demo state. Supabase was not mutated.",
    recommendation_id,
    applied_allocations_count: 1,
    updated_missions: ["m0000000-0000-0000-0000-000000000004"],
    applied_at: new Date().toISOString(),
  };
}
