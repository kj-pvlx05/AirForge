import { apiFetch } from "./client";
import { ReadinessReport } from "./types";
import { isDemoModeActive, getDemoReadinessReport } from "@/lib/demo/store";

export async function fetchReadiness(): Promise<ReadinessReport> {
  if (isDemoModeActive()) {
    return getDemoReadinessReport();
  }
  return apiFetch<ReadinessReport>("/api/readiness");
}
