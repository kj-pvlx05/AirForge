import { apiFetch } from "./client";
import {
  OptimizationRequest,
  OptimizationResult,
  OptimizationSolveRequest,
  OptimizationSolveResponse,
  OptimizationRun,
  Recommendation,
  ApplyRecommendationResponse,
} from "./types";
import {
  isDemoModeActive,
  solveDemoOptimization,
  applyDemoRecommendation,
  getDemoStore,
} from "@/lib/demo/store";

/**
 * Triggers the deterministic OR-Tools CP-SAT resource allocation solver (POST /api/optimization/run).
 */
export async function runOptimization(
  req?: OptimizationRequest
): Promise<OptimizationResult> {
  if (isDemoModeActive()) {
    return solveDemoOptimization(req);
  }
  return apiFetch<OptimizationResult>("/api/optimization/run", {
    method: "POST",
    body: JSON.stringify(req || {}),
  });
}

/**
 * Triggers the deterministic OR-Tools CP-SAT resource allocation solver (alias).
 */
export async function solveOptimization(
  req?: OptimizationSolveRequest
): Promise<OptimizationSolveResponse> {
  if (isDemoModeActive()) {
    return solveDemoOptimization(req);
  }
  return runOptimization(req);
}

/**
 * Lists all historical optimization solver runs.
 */
export async function fetchOptimizationRuns(): Promise<OptimizationRun[]> {
  if (isDemoModeActive()) {
    const runs = getDemoStore().optimizationRuns;
    return runs.map((r) => ({
      id: r.run_id,
      simulation_event_id: null,
      trigger_reason: "demo_optimization",
      solver_status: r.solver_status,
      objective_value: r.objective_value,
      solve_time_ms: r.solve_time_ms,
      total_missions: r.total_missions,
      assigned_missions: r.assigned_missions,
      unassigned_missions: r.unassigned_missions,
      constraints_applied: r.constraints.constraints_enforced,
      constraint_violations_avoided: [],
      created_at: r.created_at,
    }));
  }
  return apiFetch<OptimizationRun[]>("/api/optimization/runs");
}

/**
 * Retrieves a specific optimization run by its unique identifier.
 */
export async function fetchOptimizationRun(
  runId: string
): Promise<OptimizationRun> {
  if (isDemoModeActive()) {
    const runs = await fetchOptimizationRuns();
    const found = runs.find((r) => r.id === runId);
    if (found) return found;
  }
  return apiFetch<OptimizationRun>(`/api/optimization/runs/${runId}`);
}

/**
 * Retrieves the complete OptimizationResult (allocations, metrics, recommendation) for a run.
 */
export async function fetchOptimizationResult(
  runId: string
): Promise<OptimizationResult> {
  if (isDemoModeActive()) {
    const s = getDemoStore();
    const found = s.optimizationRuns.find((r) => r.run_id === runId);
    if (found) return found;
    if (s.optimizationRuns.length > 0) return s.optimizationRuns[0];
  }
  return apiFetch<OptimizationResult>(`/api/optimization/results/${runId}`);
}

/**
 * Retrieves a specific recommendation with its allocations and impact.
 */
export async function fetchRecommendation(
  recommendationId: string
): Promise<Recommendation> {
  if (isDemoModeActive()) {
    const s = getDemoStore();
    for (const run of s.optimizationRuns) {
      if (run.recommendation.id === recommendationId) {
        return run.recommendation;
      }
    }
  }
  return apiFetch<Recommendation>(
    `/api/optimization/recommendations/${recommendationId}`
  );
}

/**
 * Applies a recommendation to live operational state, mutating mission airframe allocations.
 */
export async function applyRecommendation(
  recommendationId: string
): Promise<ApplyRecommendationResponse> {
  if (isDemoModeActive()) {
    return applyDemoRecommendation(recommendationId);
  }
  return apiFetch<ApplyRecommendationResponse>(
    `/api/optimization/apply/${recommendationId}`,
    {
      method: "POST",
    }
  );
}
