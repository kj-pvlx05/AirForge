import { apiFetch } from "./client";
import { Mission, MissionPriority, MissionStatus, MissionType } from "./types";

export interface MissionFilters {
  status?: MissionStatus;
  priority?: MissionPriority;
  type?: MissionType;
}

export async function fetchMissions(filters?: MissionFilters): Promise<Mission[]> {
  return apiFetch<Mission[]>("/api/missions", {
    params: filters as Record<string, string | undefined>,
  });
}

export async function fetchMissionById(id: string): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${id}`);
}
