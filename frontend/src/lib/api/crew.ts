import { apiFetch } from "./client";
import { Crew, CrewRole, CrewStatus } from "./types";
import { isDemoModeActive, getDemoStore } from "@/lib/demo/store";

export interface CrewFilters {
  status?: CrewStatus;
  role?: CrewRole;
  base_airport_id?: string;
}

export async function fetchCrew(filters?: CrewFilters): Promise<Crew[]> {
  if (isDemoModeActive()) {
    let list = getDemoStore().crew;
    if (filters?.status) list = list.filter((c) => c.status === filters.status);
    if (filters?.role) list = list.filter((c) => c.role === filters.role);
    if (filters?.base_airport_id) list = list.filter((c) => c.base_airport_id === filters.base_airport_id);
    return list;
  }
  return apiFetch<Crew[]>("/api/crew", {
    params: filters as Record<string, string | undefined>,
  });
}

export async function fetchCrewById(id: string): Promise<Crew> {
  if (isDemoModeActive()) {
    const found = getDemoStore().crew.find((c) => c.id === id);
    if (found) return found;
  }
  return apiFetch<Crew>(`/api/crew/${id}`);
}
