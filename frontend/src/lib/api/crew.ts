import { apiFetch } from "./client";
import { Crew, CrewRole, CrewStatus } from "./types";

export interface CrewFilters {
  status?: CrewStatus;
  role?: CrewRole;
  base_airport_id?: string;
}

export async function fetchCrew(filters?: CrewFilters): Promise<Crew[]> {
  return apiFetch<Crew[]>("/api/crew", {
    params: filters as Record<string, string | undefined>,
  });
}

export async function fetchCrewById(id: string): Promise<Crew> {
  return apiFetch<Crew>(`/api/crew/${id}`);
}
