import { apiFetch } from "./client";
import { OperationalEvent, EventCategory, EventType } from "./types";

export interface EventFilters {
  limit?: number;
  category?: EventCategory;
  type?: EventType;
}

export async function fetchEvents(filters?: EventFilters): Promise<OperationalEvent[]> {
  return apiFetch<OperationalEvent[]>("/api/events", {
    params: filters as Record<string, string | number | undefined>,
  });
}
