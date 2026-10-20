import { apiFetch } from "./client";
import { SimulationResult, SimulationEventItem } from "./types";

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
  return apiFetch<SimulationResult>(`/api/simulation/events/${eventId}`);
}

/**
 * Lists simulation event audit records.
 */
export async function fetchSimulationEvents(): Promise<SimulationEventItem[]> {
  return apiFetch<SimulationEventItem[]>("/api/simulation/events");
}

/**
 * Resets the operational state and environment back to nominal baseline (Demo/Development).
 */
export async function resetSimulation(): Promise<{
  status: string;
  message: string;
}> {
  return apiFetch<{ status: string; message: string }>("/api/simulation/reset", {
    method: "POST",
  });
}
