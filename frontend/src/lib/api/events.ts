import { apiFetch } from "./client";
import { OperationalEvent } from "./types";
import { isDemoModeActive, getDemoStore } from "@/lib/demo/store";

export interface EventFilters {
  limit?: number;
  type?: string;
  category?: string;
}

export async function fetchEvents(filters?: EventFilters): Promise<OperationalEvent[]> {
  if (isDemoModeActive()) {
    let list = getDemoStore().events;
    if (filters?.type) list = list.filter((e) => e.type === filters.type);
    if (filters?.category) list = list.filter((e) => e.category === filters.category);
    return list.slice(0, filters?.limit || 10);
  }
  return apiFetch<OperationalEvent[]>("/api/events", {
    params: filters as Record<string, string | number | undefined>,
  });
}
