"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Plane,
  Search,
  Filter,
  RefreshCw,
  Fuel,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Gauge,
  Users,
  Weight,
} from "lucide-react";
import { fetchAircraft, fetchAirports, Aircraft, Airport, AircraftStatus, AircraftRole, ApiError } from "@/lib/api";

const STATUS_CONFIG: Record<
  AircraftStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  available: {
    label: "Available",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-400",
  },
  "in-mission": {
    label: "In Mission",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dotClass: "bg-sky-400",
  },
  maintenance: {
    label: "Maintenance",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-400",
  },
  grounded: {
    label: "Grounded",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-400",
  },
};

export default function FleetPage() {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [aircraftData, airportsData] = await Promise.all([
        fetchAircraft(),
        fetchAirports().catch(() => []),
      ]);
      setAircraftList(aircraftData);
      setAirports(airportsData);
    } catch (err) {
      console.error("Fleet fetch error:", err);
      const msg = err instanceof ApiError ? err.detail : "Failed to load aircraft fleet data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lookup base airport map
  const airportMap = useMemo(() => {
    const map = new Map<string, string>();
    airports.forEach((a) => map.set(a.id, `${a.code} — ${a.name}`));
    return map;
  }, [airports]);

  // Filtered aircraft
  const filteredAircraft = useMemo(() => {
    return aircraftList.filter((a) => {
      const matchesSearch =
        a.tail_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.base_airport_id && airportMap.get(a.base_airport_id)?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesRole = roleFilter === "all" || a.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [aircraftList, searchQuery, statusFilter, roleFilter, airportMap]);

  // KPI calculations
  const totalCount = aircraftList.length;
  const availableCount = aircraftList.filter((a) => a.status === "available").length;
  const inMissionCount = aircraftList.filter((a) => a.status === "in-mission").length;
  const maintenanceCount = aircraftList.filter((a) => a.status === "maintenance").length;
  const groundedCount = aircraftList.filter((a) => a.status === "grounded").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Fleet Management</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Operational aircraft inventory, airframe telemetry, status, and maintenance schedules.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Airframes
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">{totalCount}</div>
          <span className="text-[11px] text-muted-foreground">Active inventory</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            Mission Ready
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{availableCount}</div>
          <span className="text-[11px] text-emerald-400/70">Immediate tasking</span>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-sky-400">
            In Mission
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">{inMissionCount}</div>
          <span className="text-[11px] text-sky-400/70">Airborne / En route</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
            Maintenance
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">{maintenanceCount}</div>
          <span className="text-[11px] text-amber-400/70">Inspections / Repair</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">
            Grounded
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{groundedCount}</div>
          <span className="text-[11px] text-rose-400/70">Weather / AOG hold</span>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tail number, model, type, or home base…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs">
            {["all", "available", "in-mission", "maintenance", "grounded"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                  statusFilter === st
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "all" ? "All Status" : st.replace("-", " ")}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none capitalize"
          >
            <option value="all">All Roles</option>
            <option value="transport">Transport</option>
            <option value="medevac">Medevac</option>
            <option value="search-and-rescue">Search & Rescue</option>
            <option value="disaster-relief">Disaster Relief</option>
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

      {/* ── Aircraft Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 rounded bg-muted" />
                <div className="h-5 w-16 rounded bg-muted" />
              </div>
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAircraft.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <Plane size={32} className="text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No aircraft found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            No airframes match your active search or filters. Try adjusting your query parameters.
          </p>
          {(searchQuery || statusFilter !== "all" || roleFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setRoleFilter("all");
              }}
              className="mt-4 text-xs text-primary hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAircraft.map((aircraft) => {
            const statusConfig = STATUS_CONFIG[aircraft.status] || STATUS_CONFIG.available;
            const baseName = aircraft.base_airport_id
              ? airportMap.get(aircraft.base_airport_id) || "Unassigned Station"
              : "Unassigned Station";

            const fuelColor =
              aircraft.fuel_level_percent > 60
                ? "bg-emerald-400"
                : aircraft.fuel_level_percent > 30
                ? "bg-amber-400"
                : "bg-rose-400";

            return (
              <div
                key={aircraft.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-lg hover:shadow-black/20"
              >
                <div>
                  {/* Top: Tail Number & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Plane size={15} />
                      </div>
                      <span className="font-mono text-sm font-bold tracking-tight text-foreground">
                        {aircraft.tail_number}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusConfig.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Model & Type */}
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-foreground">{aircraft.model}</h3>
                    <p className="text-[12px] text-muted-foreground">{aircraft.type}</p>
                  </div>

                  {/* Operational Role Badge */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {aircraft.role.replace("-", " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate" title={baseName}>
                      {baseName}
                    </span>
                  </div>

                  {/* Specs Strip */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Range</span>
                      <div className="text-xs font-semibold font-mono text-foreground">
                        {aircraft.max_range_km} km
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Payload</span>
                      <div className="text-xs font-semibold font-mono text-foreground">
                        {aircraft.max_payload_kg.toLocaleString()} kg
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Capacity</span>
                      <div className="text-xs font-semibold font-mono text-foreground">
                        {aircraft.max_passengers} pax
                      </div>
                    </div>
                  </div>

                  {/* Telemetry: Fuel & Flight Hours */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Fuel size={12} /> Fuel Level
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {aircraft.fuel_level_percent}% ({aircraft.fuel_capacity_liters} L)
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${fuelColor}`}
                          style={{ width: `${Math.min(100, Math.max(0, aircraft.fuel_level_percent))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={12} /> Airframe Flight Time
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {aircraft.flight_hours.toFixed(1)} hrs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Maintenance Info */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Wrench size={11} /> Next Due:
                  </span>
                  <span className="font-mono text-foreground">
                    {aircraft.next_maintenance_due
                      ? new Date(aircraft.next_maintenance_due).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Unscheduled"}
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
