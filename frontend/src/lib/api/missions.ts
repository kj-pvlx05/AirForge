import { apiFetch } from "./client";
import { Mission, MissionPriority, MissionStatus, MissionType } from "./types";
import { isDemoModeActive, getDemoStore } from "@/lib/demo/store";

export interface MissionFilters {
  status?: MissionStatus;
  priority?: MissionPriority;
  type?: MissionType;
}

export async function fetchMissions(filters?: MissionFilters): Promise<Mission[]> {
  if (isDemoModeActive()) {
    let list = getDemoStore().missions;
    if (filters?.status) list = list.filter((m) => m.status === filters.status);
    if (filters?.priority) list = list.filter((m) => m.priority === filters.priority);
    if (filters?.type) list = list.filter((m) => m.type === filters.type);
    return list;
  }
  return apiFetch<Mission[]>("/api/missions", {
    params: filters as Record<string, string | undefined>,
  });
}

export async function fetchMissionById(id: string): Promise<Mission> {
  if (isDemoModeActive()) {
    const found = getDemoStore().missions.find((m) => m.id === id);
    if (found) return found;
  }
  return apiFetch<Mission>(`/api/missions/${id}`);
}
