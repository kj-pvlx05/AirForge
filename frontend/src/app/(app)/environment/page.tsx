"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  Wind,
  Eye,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  Compass,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  fetchEnvironment,
  EnvironmentState,
  WeatherCondition,
  AirspaceRestriction,
  Sector,
  WeatherSeverity,
  SectorRiskLevel,
  ApiError,
} from "@/lib/api";

const SEVERITY_CONFIG: Record<
  WeatherSeverity,
  { label: string; badgeClass: string }
> = {
  none: {
    label: "Nominal",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  moderate: {
    label: "Moderate",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  severe: {
    label: "Severe Squall",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

const RISK_CONFIG: Record<
  SectorRiskLevel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  low: {
    label: "Low Risk",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-400",
  },
  medium: {
    label: "Medium Risk",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dotClass: "bg-sky-400",
  },
  high: {
    label: "High Risk",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-400",
  },
  critical: {
    label: "Critical Risk",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-400",
  },
};

export default function EnvironmentPage() {
  const [envData, setEnvData] = useState<EnvironmentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"weather" | "notams" | "sectors">("weather");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEnvironment();
      setEnvData(data);
    } catch (err) {
      console.error("Environment fetch error:", err);
      const msg = err instanceof ApiError ? err.detail : "Failed to load environmental intelligence.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPIs
  const weatherList = envData?.weather || [];
  const restrictions = envData?.restrictions || [];
  const sectors = envData?.sectors || [];

  const totalSectors = sectors.length;
  const severeCount = weatherList.filter((w) => w.severity === "severe").length;
  const vfrCount = weatherList.filter((w) => w.is_vfr).length;
  const activeRestrictionsCount = restrictions.filter((r) => r.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Environment & Airspace</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Real-time meteorological observations, operational sector risk levels, and NOTAM restrictions.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh Weather</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Monitored Sectors
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">{totalSectors}</div>
          <span className="text-[11px] text-muted-foreground">Active air corridors</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            VFR Clear
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{vfrCount}</div>
          <span className="text-[11px] text-emerald-400/70">Unrestricted visual flight</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">
            Convective Squalls
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{severeCount}</div>
          <span className="text-[11px] text-rose-400/70">VFR suspended</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
            Active NOTAMs
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">{activeRestrictionsCount}</div>
          <span className="text-[11px] text-amber-400/70">Airspace restrictions</span>
        </div>
      </div>

      {/* ── Tab Bar & Search ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border bg-card p-1 text-xs">
          <button
            onClick={() => setActiveTab("weather")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              activeTab === "weather"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cloud size={13} />
            <span>Weather Stations ({weatherList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("notams")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              activeTab === "notams"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert size={13} />
            <span>NOTAM Restrictions ({restrictions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("sectors")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
              activeTab === "sectors"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass size={13} />
            <span>Operational Sectors ({sectors.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:w-72">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search region, condition, NOTAM…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
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

      {/* ── Tab Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : activeTab === "weather" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weatherList
            .filter(
              (w) =>
                w.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                w.condition.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((weather) => {
              const severity = SEVERITY_CONFIG[weather.severity] || SEVERITY_CONFIG.none;
              const isSevere = weather.severity === "severe";

              return (
                <div
                  key={weather.id}
                  className={`flex flex-col justify-between rounded-xl border bg-card p-5 transition ${
                    isSevere
                      ? "border-rose-500/40 shadow-lg shadow-rose-950/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div>
                    {/* Top: Region & Badges */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{weather.region}</h3>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            weather.is_vfr
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {weather.is_vfr ? "VFR Open" : "Sub-VFR (IFR Only)"}
                        </span>
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${severity.badgeClass}`}
                        >
                          {severity.label}
                        </span>
                      </div>
                    </div>

                    {/* Condition Name */}
                    <div className="mt-2.5 flex items-center gap-2">
                      {weather.condition.includes("rain") ? (
                        <CloudRain size={16} className="text-sky-400" />
                      ) : weather.condition.includes("thunder") ? (
                        <CloudLightning size={16} className="text-rose-400" />
                      ) : (
                        <Sun size={16} className="text-amber-400" />
                      )}
                      <span className="text-xs font-medium text-foreground capitalize">
                        {weather.condition.replace("-", " ")}
                      </span>
                    </div>

                    {/* Meteorological Telemetry Grid */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 p-2.5">
                        <Thermometer size={14} className="text-primary" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Temperature</span>
                          <span className="font-mono font-medium text-foreground">
                            {weather.temperature_c.toFixed(1)} °C
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 p-2.5">
                        <Wind size={14} className="text-sky-400" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Surface Wind</span>
                          <span className="font-mono font-medium text-foreground">
                            {weather.wind_speed_kts} kts @ {weather.wind_direction_deg}°
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 p-2.5">
                        <Eye size={14} className="text-emerald-400" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Visibility</span>
                          <span className="font-mono font-medium text-foreground">
                            {weather.visibility_km} km
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 p-2.5">
                        <Cloud size={14} className="text-amber-400" />
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Cloud Ceiling</span>
                          <span className="font-mono font-medium text-foreground">
                            {weather.ceiling_ft.toLocaleString()} ft
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                    <span>Valid from: {new Date(weather.valid_from).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>Until: {new Date(weather.valid_until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              );
            })}
        </div>
      ) : activeTab === "notams" ? (
        <div className="flex flex-col gap-3">
          {restrictions
            .filter(
              (r) =>
                r.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.reason.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((notam) => (
              <div
                key={notam.id}
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {notam.identifier}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">{notam.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {notam.type.replace("-", " ")}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 uppercase">
                      {notam.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 border border-border/50 rounded-lg p-3">
                  {notam.reason}
                </p>

                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 pt-1">
                  <div className="flex items-center gap-3">
                    <span>
                      Altitude Block:{" "}
                      <strong className="text-foreground font-mono">
                        {notam.altitude_floor_ft.toLocaleString()} ft —{" "}
                        {notam.altitude_ceiling_ft.toLocaleString()} ft AGL
                      </strong>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono">
                    Active: {new Date(notam.active_from).toLocaleDateString()} to{" "}
                    {new Date(notam.active_until).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors
            .filter(
              (s) =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.risk_level.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((sector) => {
              const risk = RISK_CONFIG[sector.risk_level] || RISK_CONFIG.low;
              return (
                <div
                  key={sector.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {sector.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${risk.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${risk.dotClass}`} />
                        {risk.label}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-foreground">{sector.name}</h3>

                    {sector.notes && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {sector.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                    <span>Boundary: GeoJSON Polygon</span>
                    <span className="capitalize">{sector.status}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
