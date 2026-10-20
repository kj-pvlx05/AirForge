"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Shield,
  Award,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  HeartPulse,
} from "lucide-react";
import { fetchCrew, fetchAirports, Crew, Airport, CrewStatus, CrewRole, ApiError } from "@/lib/api";

const STATUS_CONFIG: Record<
  CrewStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  available: {
    label: "Available",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-400",
  },
  "on-mission": {
    label: "On Mission",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dotClass: "bg-sky-400",
  },
  "off-duty": {
    label: "Off Duty",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
  medical: {
    label: "Medical Hold",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-400",
  },
};

export default function CrewPage() {
  const [crewList, setCrewList] = useState<Crew[]>([]);
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
      const [crewData, airportsData] = await Promise.all([
        fetchCrew(),
        fetchAirports().catch(() => []),
      ]);
      setCrewList(crewData);
      setAirports(airportsData);
    } catch (err) {
      console.error("Crew fetch error:", err);
      const msg = err instanceof ApiError ? err.detail : "Failed to load personnel roster.";
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

  // Filtered crew
  const filteredCrew = useMemo(() => {
    return crewList.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.qualifications.some((q) => q.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.base_airport_id && airportMap.get(c.base_airport_id)?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesRole = roleFilter === "all" || c.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [crewList, searchQuery, statusFilter, roleFilter, airportMap]);

  // KPI metrics
  const totalCount = crewList.length;
  const availableCount = crewList.filter((c) => c.status === "available").length;
  const onMissionCount = crewList.filter((c) => c.status === "on-mission").length;
  const offDutyCount = crewList.filter((c) => c.status === "off-duty").length;
  const medicalCount = crewList.filter((c) => c.status === "medical").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Personnel & Crew</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Flight crew roster, certifications, qualifications, and duty-hour tracking.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh Crew</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Crew
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">{totalCount}</div>
          <span className="text-[11px] text-muted-foreground">Registered personnel</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            Available
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{availableCount}</div>
          <span className="text-[11px] text-emerald-400/70">Ready for sortie</span>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-sky-400">
            On Mission
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">{onMissionCount}</div>
          <span className="text-[11px] text-sky-400/70">Actively deployed</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Off Duty
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-muted-foreground">{offDutyCount}</div>
          <span className="text-[11px] text-muted-foreground">Mandatory rest</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">
            Medical Hold
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{medicalCount}</div>
          <span className="text-[11px] text-rose-400/70">Unfit for flight</span>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, callsign, rank, qualification, or base station…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs">
            {["all", "available", "on-mission", "off-duty", "medical"].map((st) => (
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
            <option value="pilot">Pilot</option>
            <option value="co-pilot">Co-Pilot</option>
            <option value="flight-engineer">Flight Engineer</option>
            <option value="flight-medic">Flight Medic</option>
            <option value="loadmaster">Loadmaster</option>
            <option value="operations-observer">Observer</option>
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

      {/* ── Crew Grid ── */}
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
      ) : filteredCrew.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <Users size={32} className="text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No crew members found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            No personnel match your search filters. Try adjusting your query parameters.
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
          {filteredCrew.map((crew) => {
            const statusConfig = STATUS_CONFIG[crew.status] || STATUS_CONFIG.available;
            const baseName = crew.base_airport_id
              ? airportMap.get(crew.base_airport_id) || "Station Staging"
              : "Station Staging";

            const dutyPct = Math.round((crew.current_duty_hours / (crew.max_duty_hours || 12)) * 100);
            const dutyColor =
              dutyPct > 80
                ? "bg-rose-400"
                : dutyPct > 50
                ? "bg-amber-400"
                : "bg-emerald-400";

            return (
              <div
                key={crew.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-lg hover:shadow-black/20"
              >
                <div>
                  {/* Top: Rank, Name & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                        {crew.rank} · {crew.code}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{crew.name}</h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusConfig.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Role & Base Station */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">
                      {crew.role.replace("-", " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate" title={baseName}>
                      {baseName}
                    </span>
                  </div>

                  {/* Qualifications */}
                  <div className="mt-3.5">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Qualifications
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {crew.qualifications && crew.qualifications.length > 0 ? (
                        crew.qualifications.map((q, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded border border-border/80 bg-background/80 px-2 py-0.5 text-[10px] font-mono text-foreground"
                          >
                            <Award size={10} className="text-primary" />
                            {q}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Standard rating</span>
                      )}
                    </div>
                  </div>

                  {/* Duty Hours Progress */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={12} /> Duty Window ({crew.current_duty_hours} / {crew.max_duty_hours} hrs)
                      </span>
                      <span className="font-mono font-medium text-foreground">{dutyPct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${dutyColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, dutyPct))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: Rest Period */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Mandatory Post-Sortie Rest:</span>
                  <span className="font-mono text-foreground font-medium">
                    {crew.rest_period_hours} hours
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
