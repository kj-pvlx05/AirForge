import { apiFetch } from "./client";
import { Airport, EnvironmentState, Sector } from "./types";
import { isDemoModeActive, getDemoStore } from "@/lib/demo/store";

export async function fetchEnvironment(): Promise<EnvironmentState> {
  if (isDemoModeActive()) {
    const s = getDemoStore();
    return {
      weather: s.weather,
      restrictions: s.restrictions,
      sectors: s.sectors,
      timestamp: new Date().toISOString(),
    };
  }
  return apiFetch<EnvironmentState>("/api/environment");
}

export async function fetchAirports(): Promise<Airport[]> {
  if (isDemoModeActive()) {
    return getDemoStore().airports;
  }
  return apiFetch<Airport[]>("/api/airports");
}

export async function fetchSectors(): Promise<Sector[]> {
  if (isDemoModeActive()) {
    return getDemoStore().sectors;
  }
  return apiFetch<Sector[]>("/api/sectors");
}
