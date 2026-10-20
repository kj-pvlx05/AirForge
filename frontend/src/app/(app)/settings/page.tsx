"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  RefreshCw,
  User,
  Shield,
  Wifi,
  WifiOff,
  Monitor,
  Palette,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  Database,
  Cpu,
  LogOut,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getBackendTargetUrl } from "@/lib/api/client";
import { getStoredSession, clearSession, AuthSession } from "@/lib/auth/supabase-auth";
import {
  isDemoModeActive,
  setDemoMode,
  getActiveDemoProfile,
  setActiveDemoProfile,
  resetDemoStore,
} from "@/lib/demo/store";
import { DEMO_PROFILES, DemoProfile } from "@/lib/demo/profiles";

/* ── Types ── */
interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  auth_enforced: boolean;
  database: {
    mode: string;
    supabase_configured: boolean;
    connected: boolean;
    error: string | null;
    airports_loaded: number;
    aircraft_loaded: number;
    crew_loaded: number;
    missions_loaded: number;
  };
  ai_layer: {
    provider: string;
    model: string;
    api_key_configured: boolean;
  };
  config_issues: string[];
}

/* ── Section Card wrapper ── */
function SectionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-aero-primary-soft">
            <Icon size={18} className="text-aero-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

/* ── Status Pill ── */
function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
        ok
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />
      {label}
    </span>
  );
}

/* ── Detail Row ── */
function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
        <Icon size={14} className="shrink-0" />
        {label}
      </div>
      <span
        className={`text-[13px] font-medium text-foreground ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [activeProfile, setActiveProfile] = useState<DemoProfile>(DEMO_PROFILES[0]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [demoResetMessage, setDemoResetMessage] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState("");

  /* ── Load session and state ── */
  useEffect(() => {
    async function loadData() {
      const s = await getStoredSession();
      setSession(s);
      setIsDemo(isDemoModeActive());
      setActiveProfile(getActiveDemoProfile());
      setBackendUrl(getBackendTargetUrl());
    }
    loadData();
  }, []);

  /* ── Probe backend health ── */
  const probeHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      setHealthError(null);
      const data = await apiFetch<HealthResponse>("/api/health");
      setHealth(data);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
          ? err.message
          : "Unable to reach backend.";
      setHealthError(msg);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    probeHealth();
  }, [probeHealth]);

  /* ── Switch Demo Profile ── */
  const handleSelectProfile = (profile: DemoProfile) => {
    setActiveDemoProfile(profile.id);
    setActiveProfile(profile);
    if (!isDemo) {
      setDemoMode(true);
      setIsDemo(true);
    }
    window.dispatchEvent(new CustomEvent("aerosync_demo_profile_change", { detail: profile }));
  };

  /* ── Toggle Demo Mode ── */
  const handleToggleDemoMode = (enable: boolean) => {
    setDemoMode(enable);
    setIsDemo(enable);
    window.location.reload();
  };

  /* ── Reset Demo State ── */
  const handleResetDemoState = () => {
    resetDemoStore();
    setDemoResetMessage("Demo state restored to original baseline. All synthetic mutations cleared.");
    setTimeout(() => setDemoResetMessage(null), 4000);
  };

  /* ── Handle full session reset ── */
  const handleSessionReset = useCallback(() => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    clearSession();
    resetDemoStore();
    if (typeof window !== "undefined") {
      localStorage.removeItem("aerosync_operator_key");
      localStorage.removeItem("aerosync_display_prefs");
      localStorage.removeItem("aerosync_demo_mode_active");
    }
    window.location.reload();
  }, [resetConfirm]);

  /* ── Handle sign out ── */
  const handleSignOut = useCallback(async () => {
    clearSession();
    window.location.reload();
  }, []);

  const healthOk = health?.status === "ok";
  const dbOk = health?.database?.connected === true;
  const aiOk = health?.ai_layer?.api_key_configured === true;

  return (
    <div className="flex flex-col gap-6 max-w-[920px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Settings size={20} className="text-aero-primary" />
            Settings & Operational Configuration
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Manage reviewer demo personas, backend connectivity diagnostics, and operator authentication.
          </p>
        </div>
      </div>

      {/* ── DEMO MODE & REVIEWER PROFILES ── */}
      <SectionCard
        title="Demo Mode & Reviewer Personas"
        subtitle="Choose a fictional operator profile to evaluate AirOps with isolated synthetic state"
        icon={Sparkles}
        badge={
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                isDemo
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {isDemo ? "Demo Active" : "Live Mode Active"}
            </span>
            <button
              onClick={() => handleToggleDemoMode(!isDemo)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                isDemo
                  ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20"
                  : "bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
              }`}
            >
              {isDemo ? "Switch to Live Mode" : "Activate Demo Mode"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Reviewers can evaluate AirOps using one of four fictional operational identities. In Demo Mode,
            all views reflect a complete, coherent synthetic dataset. Operational actions (simulation triggers,
            CP-SAT optimization, and fleet reallocations) update local isolated state only, and never mutate
            Supabase production tables or bypass backend authorization.
          </p>

          {/* Persona Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {DEMO_PROFILES.map((p) => {
              const isSelected = activeProfile.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-purple-500/50 bg-purple-500/5 shadow-sm"
                      : "border-border hover:border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${p.avatarColor}`}
                    >
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {p.name}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            <UserCheck size={11} />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {p.title} · <span className="font-mono">{p.callSign}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {p.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="bg-muted px-2 py-0.5 rounded border border-border text-muted-foreground font-mono">
                          {p.clearance}
                        </span>
                        <span className="bg-muted px-2 py-0.5 rounded border border-border text-muted-foreground">
                          {p.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Demo Reset Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
            <div>
              <p className="text-xs font-medium text-foreground">Reset Demo State</p>
              <p className="text-[11px] text-muted-foreground">
                Restore the synthetic scenario to nominal baseline. Clears simulated disruptions and local reallocations.
              </p>
            </div>
            <button
              onClick={handleResetDemoState}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset Demo Scenario
            </button>
          </div>

          {demoResetMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{demoResetMessage}</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── BACKEND DIAGNOSTICS & CONNECTION ── */}
      <SectionCard
        title="Backend Diagnostics & Connection Status"
        subtitle="Live telemetry and database connectivity from the FastAPI decision engine"
        icon={Server}
        badge={
          <button
            onClick={probeHealth}
            disabled={healthLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={healthLoading ? "animate-spin" : ""} />
            Re-probe
          </button>
        }
      >
        {healthLoading ? (
          <div className="flex items-center gap-3 py-4">
            <RefreshCw size={16} className="animate-spin text-aero-primary" />
            <span className="text-xs text-muted-foreground">
              Probing live backend at {backendUrl}…
            </span>
          </div>
        ) : healthError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3">
              <WifiOff size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">
                  Backend Unreachable via Direct Probe
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {healthError}
                </p>
              </div>
            </div>
            <DetailRow icon={Wifi} label="Target API Endpoint" value={backendUrl} mono />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={probeHealth}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white dark:bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted cursor-pointer"
              >
                <RefreshCw size={13} />
                Retry Connection
              </button>
              {!isDemo && (
                <button
                  onClick={() => handleToggleDemoMode(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition cursor-pointer"
                >
                  <Sparkles size={13} />
                  Switch to Demo Mode
                </button>
              )}
            </div>
          </div>
        ) : health ? (
          <div className="space-y-0">
            <div className="flex items-center justify-between py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <Wifi size={14} className="shrink-0" />
                Overall Backend Status
              </div>
              <StatusPill ok={healthOk} label={healthOk ? "Healthy (200 OK)" : "Degraded"} />
            </div>
            <DetailRow icon={Server} label="Service" value={`${health.service} v${health.version}`} />
            <DetailRow icon={Monitor} label="Environment" value={health.environment} />
            <DetailRow icon={Wifi} label="Deployed Backend" value={backendUrl} mono />
            <div className="flex items-center justify-between py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <Database size={14} className="shrink-0" />
                Database Engine
              </div>
              <StatusPill
                ok={dbOk}
                label={dbOk ? `Connected (${health.database.mode})` : health.database.error || "Disconnected"}
              />
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <Cpu size={14} className="shrink-0" />
                AI Explanation Layer
              </div>
              <StatusPill
                ok={aiOk}
                label={aiOk ? `Google Gemini (${health.ai_layer.model})` : "Not Configured"}
              />
            </div>
            <DetailRow
              icon={Shield}
              label="Production Auth Enforced"
              value={health.auth_enforced ? "Yes (JWT / API Key required for mutations)" : "No"}
            />

            {/* Live Operational Record Counts */}
            {health.database.connected && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Database Staging Records (Supabase)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Airports", count: health.database.airports_loaded },
                    { label: "Aircraft", count: health.database.aircraft_loaded },
                    { label: "Crew", count: health.database.crew_loaded },
                    { label: "Missions", count: health.database.missions_loaded },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-center"
                    >
                      <p className="text-lg font-semibold text-foreground font-mono">
                        {item.count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SectionCard>

      {/* ── OPERATOR PROFILE ── */}
      <SectionCard
        title="Live Operator Authentication"
        subtitle="Current Supabase Auth session or Operational API Key credentials"
        icon={User}
      >
        {session ? (
          <div className="space-y-0">
            <DetailRow icon={User} label="Authenticated Email" value={session.user.email} />
            <DetailRow
              icon={Shield}
              label="Assigned Role"
              value={session.user.appRole || session.user.role || "operator"}
            />
            <DetailRow
              icon={Clock}
              label="Session Expires"
              value={
                session.expires_at
                  ? new Date(session.expires_at * 1000).toLocaleString()
                  : "Non-expiring (API key)"
              }
            />
            <div className="pt-3">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-muted/30 border border-border p-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">No Live Session Token</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Read-only views remain accessible. Operational mutations in Live Mode require signing in via Supabase Auth or providing an Operator Key.
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── DISPLAY PREFERENCES ── */}
      <SectionCard
        title="Display & Regional Preferences"
        subtitle="Operational interface formatting and styling"
        icon={Palette}
      >
        <div className="space-y-0">
          <DetailRow icon={Monitor} label="Theme" value="Calm Intelligence (Tailored Light/Dark tokens)" />
          <DetailRow icon={Palette} label="Accent Palette" value="AirOps Violet (#5B42F3 / #8B7CF6)" />
          <DetailRow icon={Clock} label="System Time Zone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
        </div>
      </SectionCard>

      {/* ── APPLICATION INFO ── */}
      <SectionCard
        title="Application Architecture"
        subtitle="Stack and deployment metadata"
        icon={Monitor}
      >
        <div className="space-y-0">
          <DetailRow icon={CheckCircle2} label="Application" value="AirOps — Dynamic Air Operations" />
          <DetailRow icon={Server} label="Frontend" value="Next.js 16 App Router (Vercel)" />
          <DetailRow icon={Server} label="Backend" value="FastAPI + OR-Tools CP-SAT (Render)" />
          <DetailRow icon={Database} label="Persistence" value="Supabase PostgreSQL + RLS" />
          <DetailRow icon={Cpu} label="AI Provider" value="Google Gemini 2.5/3.8 Flash" />
          <DetailRow icon={Shield} label="Version" value="0.1.0 — Production Candidate" />
        </div>
      </SectionCard>

      {/* ── DEMO & SESSION RESET ── */}
      <SectionCard
        title="Session & Local Storage Reset"
        subtitle="Clear all cached sessions, operator keys, and synthetic state"
        icon={RotateCcw}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex-1">
            Clears your local authentication tokens, stored preferences, and cached operator keys.
            Restores the application to a clean baseline. Server-side Supabase records are preserved.
          </p>
          <button
            onClick={handleSessionReset}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition cursor-pointer shrink-0 ${
              resetConfirm
                ? "border-rose-500/40 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <RotateCcw size={13} />
            {resetConfirm ? "Confirm Complete Reset" : "Reset Local Session"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
