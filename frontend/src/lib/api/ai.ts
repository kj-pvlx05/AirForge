import { apiFetch } from "./client";
import { AIAnalyzeRequest, AIExplanationResponse } from "./types";

/**
 * Request structured situation analysis from Gemini Flash / deterministic fallback.
 * (POST /api/ai/analyze)
 */
export async function analyzeOptimization(
  payload: AIAnalyzeRequest
): Promise<AIExplanationResponse> {
  return apiFetch<AIExplanationResponse>("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Retrieve persisted situation analysis for a specific optimization run.
 * (GET /api/ai/analysis/{run_id})
 */
export async function getOptimizationAnalysis(
  runId: string
): Promise<AIExplanationResponse> {
  return apiFetch<AIExplanationResponse>(`/api/ai/analysis/${runId}`);
}
