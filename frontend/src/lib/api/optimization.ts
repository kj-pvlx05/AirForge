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

/**
 * Triggers the deterministic OR-Tools CP-SAT resource allocation solver (POST /api/optimization/run).
 */
export async function runOptimization(
  req?: OptimizationRequest
): Promise<OptimizationResult> {
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
  return runOptimization(req);
}

/**
 * Lists all historical optimization solver runs.
 */
export async function fetchOptimizationRuns(): Promise<OptimizationRun[]> {
  return apiFetch<OptimizationRun[]>("/api/optimization/runs");
}

/**
 * Retrieves a specific optimization run by its unique identifier.
 */
export async function fetchOptimizationRun(
  runId: string
): Promise<OptimizationRun> {
  return apiFetch<OptimizationRun>(`/api/optimization/runs/${runId}`);
}

/**
 * Retrieves a specific recommendation with its allocations and impact.
 */
export async function fetchRecommendation(
  recommendationId: string
): Promise<Recommendation> {
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
  return apiFetch<ApplyRecommendationResponse>(
    `/api/optimization/apply/${recommendationId}`,
    {
      method: "POST",
    }
  );
}
