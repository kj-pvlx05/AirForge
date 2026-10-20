import { apiFetch } from "./client";
import { SimulationResult, SimulationEventItem } from "./types";
import { isDemoModeActive, triggerDemoSimulation, resetDemoSimulation, getDemoStore } from "@/lib/demo/store";

export interface TriggerSimulationParams {
  scenario: string;
  target_id: string;
  parameters?: Record<string, unknown>;
}

/**
 * Triggers a deterministic operational scenario simulation.
 */
export async function triggerSimulationScenario(
  params: TriggerSimulationParams
): Promise<SimulationResult> {
  if (isDemoModeActive()) {
    return triggerDemoSimulation(params.scenario, params.target_id);
  }
  return apiFetch<SimulationResult>("/api/simulation/events", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Retrieves a previously executed simulation event result with full before/after state snapshots.
 */
export async function fetchSimulationResult(
  eventId: string
): Promise<SimulationResult> {
  if (isDemoModeActive()) {
    const active = getDemoStore().activeSimulation;
    if (active) return active;
  }
  return apiFetch<SimulationResult>(`/api/simulation/events/${eventId}`);
}

export async function fetchSimulationEvents(): Promise<SimulationEventItem[]> {
  if (isDemoModeActive()) {
    const s = getDemoStore();
    return s.events.map((e) => ({
      id: e.id,
      scenario_type: e.category || "weather_deterioration",
      title: e.title || "Simulation Disruption",
      description: e.description || "Operational disruption event recorded",
      parameters: (e.metadata as Record<string, unknown>) || {},
      status: "applied",
      triggered_at: e.created_at,
      created_at: e.created_at,
    }));
  }
  return apiFetch<SimulationEventItem[]>("/api/simulation/events");
}

/**
 * Resets the operational state and environment back to nominal baseline.
 */
export async function resetSimulation(): Promise<{
  status: string;
  message: string;
}> {
  if (isDemoModeActive()) {
    return resetDemoSimulation();
  }
  return apiFetch<{ status: string; message: string }>("/api/simulation/reset", {
    method: "POST",
  });
}
