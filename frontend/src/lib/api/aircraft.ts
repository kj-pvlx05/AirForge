import { apiFetch } from "./client";
import { Aircraft, AircraftRole, AircraftStatus } from "./types";
import { isDemoModeActive, getDemoStore } from "@/lib/demo/store";

export interface AircraftFilters {
  status?: AircraftStatus;
  role?: AircraftRole;
  base_airport_id?: string;
}

export async function fetchAircraft(filters?: AircraftFilters): Promise<Aircraft[]> {
  if (isDemoModeActive()) {
    let list = getDemoStore().aircraft;
    if (filters?.status) list = list.filter((a) => a.status === filters.status);
    if (filters?.role) list = list.filter((a) => a.role === filters.role);
    if (filters?.base_airport_id) list = list.filter((a) => a.base_airport_id === filters.base_airport_id);
    return list;
  }
  return apiFetch<Aircraft[]>("/api/aircraft", {
    params: filters as Record<string, string | undefined>,
  });
}

export async function fetchAircraftById(id: string): Promise<Aircraft> {
  if (isDemoModeActive()) {
    const found = getDemoStore().aircraft.find((a) => a.id === id);
    if (found) return found;
  }
  return apiFetch<Aircraft>(`/api/aircraft/${id}`);
}
