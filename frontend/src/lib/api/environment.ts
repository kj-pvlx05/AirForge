import { apiFetch } from "./client";
import { Airport, EnvironmentState, Sector } from "./types";

export async function fetchEnvironment(): Promise<EnvironmentState> {
  return apiFetch<EnvironmentState>("/api/environment");
}

export async function fetchAirports(): Promise<Airport[]> {
  return apiFetch<Airport[]>("/api/airports");
}

export async function fetchSectors(): Promise<Sector[]> {
  return apiFetch<Sector[]>("/api/sectors");
}
