import { apiFetch } from "./client";
import { ReadinessReport } from "./types";

export async function fetchReadiness(): Promise<ReadinessReport> {
  return apiFetch<ReadinessReport>("/api/readiness");
}
