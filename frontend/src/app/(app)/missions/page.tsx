"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Target,
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Plane,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Weight,
  UserCheck,
} from "lucide-react";
import {
  fetchMissions,
  fetchAirports,
  fetchAircraft,
  Mission,
  Airport,
  Aircraft,
  MissionStatus,
  MissionPriority,
  MissionType,
  ApiError,
} from "@/lib/api";
import { setDemoMode } from "@/lib/demo/store";

const PRIORITY_CONFIG: Record<
  MissionPriority,
  { label: string; badgeClass: string }
> = {
  critical: {
    label: "Critical",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  },
  high: {
    label: "High",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  low: {
    label: "Low",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
};

const STATUS_CONFIG: Record<
  MissionStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  scheduled: {
    label: "Scheduled",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dotClass: "bg-sky-400",
  },
  active: {
    label: "Active (En Route)",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-400",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-400",
  },
  reassigned: {
    label: "Reassigned",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-400",
  },
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [missionsData, airportsData, aircraftData] = await Promise.all([
        fetchMissions(),
        fetchAirports().catch(() => []),
        fetchAircraft().catch(() => []),
      ]);
      setMissions(missionsData);
      setAirports(airportsData);
      setAircraftList(aircraftData);
    } catch (err) {
      console.error("Missions fetch error:", err);
      const msg = err instanceof ApiError ? err.detail : "Failed to load missions.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lookup maps
  const airportMap = useMemo(() => {
    const map = new Map<string, string>();
    airports.forEach((a) => map.set(a.id, `${a.code} (${a.name})`));
    return map;
  }, [airports]);

  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraftList.forEach((a) => map.set(a.id, a));
    return map;
  }, [aircraftList]);

  // Filtered missions
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      const originName = airportMap.get(m.origin_airport_id) || "";
      const destName = airportMap.get(m.destination_airport_id) || "";
      const matchesSearch =
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        originName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        destName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || m.priority === priorityFilter;
      const matchesType = typeFilter === "all" || m.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [missions, searchQuery, statusFilter, priorityFilter, typeFilter, airportMap]);

  // KPI metrics
  const totalCount = missions.length;
  const activeCount = missions.filter((m) => m.status === "active").length;
  const scheduledCount = missions.filter((m) => m.status === "scheduled").length;
  const criticalCount = missions.filter((m) => m.priority === "critical").length;
  const highCount = missions.filter((m) => m.priority === "high").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Missions & Tasks</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Flight sortie scheduling, airframe/crew allocations, and mission lifecycle.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh Missions</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Sorties
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {loading ? "…" : error ? "—" : totalCount}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {error ? "Backend offline" : "Active registry"}
          </span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            Active Airborne
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {loading ? "…" : error ? "—" : activeCount}
          </div>
          <span className="text-[11px] text-emerald-400/70">
            {error ? "Unavailable" : "En route to target"}
          </span>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-sky-400">
            Scheduled
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
            {loading ? "…" : error ? "—" : scheduledCount}
          </div>
          <span className="text-[11px] text-sky-400/70">
            {error ? "Unavailable" : "Awaiting departure"}
          </span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">
            Critical Priority
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            {loading ? "…" : error ? "—" : criticalCount}
          </div>
          <span className="text-[11px] text-rose-400/70">
            {error ? "Unavailable" : "Immediate tasking"}
          </span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
            High Priority
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {loading ? "…" : error ? "—" : highCount}
          </div>
          <span className="text-[11px] text-amber-400/70">
            {error ? "Unavailable" : "Elevated urgency"}
          </span>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search mission code, title, type, or bases…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs">
            {["all", "scheduled", "active", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                  statusFilter === st
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "all" ? "All Status" : st}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none capitalize"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none capitalize"
          >
            <option value="all">All Types</option>
            <option value="medevac">Medevac</option>
            <option value="search-and-rescue">Search & Rescue</option>
            <option value="disaster-relief">Disaster Relief</option>
            <option value="transport">Transport</option>
            <option value="training">Training</option>
            <option value="standby">Standby</option>
          </select>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="rounded bg-red-500/20 px-2.5 py-1 text-[11px] font-medium hover:bg-red-500/30 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Missions Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-28 rounded bg-muted" />
                <div className="h-5 w-20 rounded bg-muted" />
              </div>
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : error && missions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-card p-12 text-center">
          <AlertTriangle size={32} className="text-rose-400 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Mission Operations Unavailable</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {error}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={loadData}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
            >
              Retry Connection
            </button>
            <button
              onClick={() => {
                setDemoMode(true);
                window.location.reload();
              }}
              className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition cursor-pointer"
            >
              Switch to Demo Mode
            </button>
          </div>
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <Target size={32} className="text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No missions found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            No sorties match your active filters. Try adjusting your query parameters.
          </p>
          {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setTypeFilter("all");
              }}
              className="mt-4 text-xs text-primary hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredMissions.map((mission) => {
            const priorityConfig = PRIORITY_CONFIG[mission.priority] || PRIORITY_CONFIG.low;
            const statusConfig = STATUS_CONFIG[mission.status] || STATUS_CONFIG.scheduled;
            const originBase = airportMap.get(mission.origin_airport_id) || "Origin Point";
            const destBase = airportMap.get(mission.destination_airport_id) || "Target Zone";
            const assignedAirframe = mission.assigned_aircraft_id
              ? aircraftMap.get(mission.assigned_aircraft_id)
              : null;

            return (
              <div
                key={mission.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-lg hover:shadow-black/20"
              >
                <div>
                  {/* Top: Code, Title, Priority & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {mission.code}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {mission.type.replace("-", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityConfig.badgeClass}`}
                      >
                        {priorityConfig.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusConfig.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-foreground">{mission.title}</h3>

                  {/* Route: Origin -> Destination */}
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 p-3 text-xs">
                    <div className="flex-1 truncate">
                      <span className="text-[10px] text-muted-foreground uppercase block font-mono">
                        Origin Base
                      </span>
                      <span className="font-medium text-foreground truncate block">{originBase}</span>
                    </div>

                    <ArrowRight size={14} className="text-muted-foreground shrink-0" />

                    <div className="flex-1 truncate text-right">
                      <span className="text-[10px] text-muted-foreground uppercase block font-mono">
                        Destination Base
                      </span>
                      <span className="font-medium text-foreground truncate block">{destBase}</span>
                    </div>
                  </div>

                  {/* Mission Requirements & Payload */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded border border-border/40 bg-background/40 p-2">
                      <span className="text-[10px] text-muted-foreground block">Payload</span>
                      <span className="font-mono font-medium text-foreground">
                        {mission.cargo_weight_kg > 0 ? `${mission.cargo_weight_kg} kg` : "Zero cargo"}
                      </span>
                    </div>
                    <div className="rounded border border-border/40 bg-background/40 p-2">
                      <span className="text-[10px] text-muted-foreground block">Personnel / Pax</span>
                      <span className="font-mono font-medium text-foreground">
                        {mission.passenger_count > 0 ? `${mission.passenger_count} pax` : "None"}
                      </span>
                    </div>
                    <div className="rounded border border-border/40 bg-background/40 p-2">
                      <span className="text-[10px] text-muted-foreground block">Urgency Score</span>
                      <span className="font-mono font-medium text-primary">
                        {mission.urgency_score} / 100
                      </span>
                    </div>
                  </div>

                  {/* Allocation Details */}
                  <div className="mt-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Plane size={12} /> Assigned Airframe:
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {assignedAirframe ? (
                          <span className="text-emerald-400">
                            {assignedAirframe.tail_number} ({assignedAirframe.model})
                          </span>
                        ) : mission.required_aircraft_model ? (
                          <span className="text-amber-400">
                            Required: {mission.required_aircraft_model} (Unassigned)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Pending allocation</span>
                        )}
                      </span>
                    </div>

                    {mission.required_crew_composition && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users size={12} /> Crew Composition:
                        </span>
                        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                          {Object.entries(mission.required_crew_composition).map(([role, qty]) => (
                            <span key={role} className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                              {qty} {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Timeline Window */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Start:{" "}
                    {new Date(mission.scheduled_start).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                  <span>
                    ETA:{" "}
                    {new Date(mission.scheduled_end).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
