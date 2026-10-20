"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart3,
  RefreshCw,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Plane,
  Users,
  Target,
  Clock,
  CheckCircle2,
  Activity,
  FileText,
  Calendar,
} from "lucide-react";
import {
  fetchReadiness,
  fetchAircraft,
  fetchCrew,
  fetchMissions,
  fetchEvents,
  ReadinessReport,
  Aircraft,
  Crew,
  Mission,
  OperationalEvent,
  ApiError,
} from "@/lib/api";

export default function ReportsPage() {
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [readinessData, aircraftData, crewData, missionsData, eventsData] =
        await Promise.all([
          fetchReadiness(),
          fetchAircraft().catch(() => []),
          fetchCrew().catch(() => []),
          fetchMissions().catch(() => []),
          fetchEvents({ limit: 12 }).catch(() => []),
        ]);
      setReadiness(readinessData);
      setAircraft(aircraftData);
      setCrew(crewData);
      setMissions(missionsData);
      setEvents(eventsData);
    } catch (err) {
      console.error("Reports fetch error:", err);
      const msg = err instanceof ApiError ? err.detail : "Failed to load operational telemetry.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate metrics
  const totalFlightHours = useMemo(
    () => aircraft.reduce((acc, a) => acc + (a.flight_hours || 0), 0),
    [aircraft]
  );
  const avgDutyHours = useMemo(() => {
    if (crew.length === 0) return 0;
    const sum = crew.reduce((acc, c) => acc + (c.current_duty_hours || 0), 0);
    return (sum / crew.length).toFixed(1);
  }, [crew]);

  const readinessScore = readiness?.operational_readiness_pct ?? 0;
  const statusLevel = readiness?.status_level ?? "degraded";

  const statusColor =
    statusLevel === "nominal"
      ? "text-emerald-400"
      : statusLevel === "caution"
      ? "text-amber-400"
      : "text-rose-400";

  const statusBg =
    statusLevel === "nominal"
      ? "bg-emerald-500/10 border-emerald-500/20"
      : statusLevel === "caution"
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-rose-500/10 border-rose-500/20";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Mission readiness indicators, resource utilization telemetry, and operational audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
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

      {/* ── Readiness Summary Banner ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            {/* Big Circular Score */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-border bg-background">
              <div className="text-center">
                <span className={`text-2xl font-bold font-mono ${statusColor}`}>
                  {loading ? "…" : error ? "—" : `${readinessScore}%`}
                </span>
                <span className="block text-[9px] uppercase font-semibold text-muted-foreground">
                  Readiness
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusBg} ${statusColor}`}
                >
                  Status: {loading ? "Probing" : error ? "Disconnected" : statusLevel}
                </span>
                <span className="text-xs text-muted-foreground">
                  Generated: {readiness?.generated_at ? new Date(readiness.generated_at).toLocaleString() : "Live"}
                </span>
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Air Operation Force Availability Matrix
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Aggregated operational readiness derived from real-time fleet airworthiness, crew duty-hour limits, and active sortie requirements.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 border-t border-border/60 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 text-center">
            <div>
              <span className="text-[11px] text-muted-foreground block">Fleet Availability</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {readiness?.fleet?.availability_pct ?? 0}%
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {readiness?.fleet?.available ?? 0} of {readiness?.fleet?.total ?? 0} ready
              </span>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block">Crew Availability</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {readiness?.crew?.availability_pct ?? 0}%
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {readiness?.crew?.available ?? 0} of {readiness?.crew?.total ?? 0} on call
              </span>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block">Critical Sorties</span>
              <span className="text-lg font-bold font-mono text-rose-400">
                {readiness?.missions?.critical ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                of {readiness?.missions?.total ?? 0} active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Breakdown Panels ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fleet Breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Plane size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Fleet Telemetry</h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{aircraft.length} airframes</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cumulative Fleet Flight Hours:</span>
              <span className="font-mono font-bold text-foreground">
                {totalFlightHours.toFixed(1)} hrs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Hours per Airframe:</span>
              <span className="font-mono font-medium text-foreground">
                {aircraft.length ? (totalFlightHours / aircraft.length).toFixed(1) : 0} hrs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Airframes Grounded / AOG:</span>
              <span className="font-mono font-medium text-rose-400">
                {aircraft.filter((a) => a.status === "grounded").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">In Scheduled Maintenance:</span>
              <span className="font-mono font-medium text-amber-400">
                {aircraft.filter((a) => a.status === "maintenance").length}
              </span>
            </div>
          </div>
        </div>

        {/* Crew Telemetry */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Personnel Telemetry</h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{crew.length} crew</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Active Duty Hours:</span>
              <span className="font-mono font-bold text-foreground">{avgDutyHours} hrs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Personnel Available for Tasking:</span>
              <span className="font-mono font-medium text-emerald-400">
                {crew.filter((c) => c.status === "available").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Personnel Currently Airborne:</span>
              <span className="font-mono font-medium text-sky-400">
                {crew.filter((c) => c.status === "on-mission").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Personnel on Medical Stand-down:</span>
              <span className="font-mono font-medium text-rose-400">
                {crew.filter((c) => c.status === "medical").length}
              </span>
            </div>
          </div>
        </div>

        {/* Mission Demands */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Sortie Demands</h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{missions.length} sorties</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Missions in Flight:</span>
              <span className="font-mono font-bold text-emerald-400">
                {missions.filter((m) => m.status === "active").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Scheduled / Awaiting Allocations:</span>
              <span className="font-mono font-medium text-sky-400">
                {missions.filter((m) => m.status === "scheduled").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Medevac & SAR Critical Sorties:</span>
              <span className="font-mono font-medium text-rose-400">
                {missions.filter((m) => m.type === "medevac" || m.type === "search-and-rescue").length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Completed Operations:</span>
              <span className="font-mono font-medium text-muted-foreground">
                {missions.filter((m) => m.status === "completed").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Audit Trail & Event Stream ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Operational Audit Log</h3>
          </div>
          <span className="text-xs text-muted-foreground">Last {events.length} timeline events</span>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No activity records logged.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {events.map((evt) => (
              <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {evt.category}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{evt.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{evt.description}</p>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground shrink-0 self-start sm:self-center">
                  {new Date(evt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
