import { apiFetch } from "./client";
import { Aircraft, AircraftRole, AircraftStatus } from "./types";

export interface AircraftFilters {
  status?: AircraftStatus;
  role?: AircraftRole;
  base_airport_id?: string;
}

export async function fetchAircraft(filters?: AircraftFilters): Promise<Aircraft[]> {
  return apiFetch<Aircraft[]>("/api/aircraft", {
    params: filters as Record<string, string | undefined>,
  });
}

export async function fetchAircraftById(id: string): Promise<Aircraft> {
  return apiFetch<Aircraft>(`/api/aircraft/${id}`);
}
