"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Radio,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  X,
  Loader2,
  Lock,
  ChevronDown,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  getStoredSession,
  signInWithPassword,
  signInWithOperatorKey,
  signOut,
  AuthSession,
} from "@/lib/auth/supabase-auth";
import {
  isDemoModeActive,
  setDemoMode,
  getActiveDemoProfile,
  setActiveDemoProfile,
} from "@/lib/demo/store";
import { DEMO_PROFILES, DemoProfile } from "@/lib/demo/profiles";

const AUTHORIZED_ROLES = new Set(["operator", "admin", "commander", "dispatcher"]);

export function Topbar() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoProfile, setDemoProfileState] = useState<DemoProfile>(DEMO_PROFILES[0]);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"supabase" | "key">("supabase");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [operatorKey, setOperatorKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStoredSession().then(setSession);
    setIsDemo(isDemoModeActive());
    setDemoProfileState(getActiveDemoProfile());

    const authHandler = (e: Event) => {
      const custom = e as CustomEvent<AuthSession | null>;
      setSession(custom.detail);
    };
    const demoHandler = (e: Event) => {
      const custom = e as CustomEvent<{ active: boolean }>;
      setIsDemo(custom.detail?.active ?? isDemoModeActive());
    };
    const profileHandler = (e: Event) => {
      const custom = e as CustomEvent<DemoProfile>;
      if (custom.detail) setDemoProfileState(custom.detail);
    };

    window.addEventListener("aerosync_auth_change", authHandler);
    window.addEventListener("aerosync_demo_change", demoHandler);
    window.addEventListener("aerosync_demo_profile_change", profileHandler);

    return () => {
      window.removeEventListener("aerosync_auth_change", authHandler);
      window.removeEventListener("aerosync_demo_change", demoHandler);
      window.removeEventListener("aerosync_demo_profile_change", profileHandler);
    };
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (authMode === "key") {
      const res = signInWithOperatorKey(operatorKey);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setModalOpen(false);
        setOperatorKey("");
      }
      return;
    }
    const res = await signInWithPassword(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setModalOpen(false);
      setPassword("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setModalOpen(false);
  };

  const userRole = session?.user?.appRole || session?.user?.role || "unauthenticated";
  const isAuthorized = AUTHORIZED_ROLES.has(userRole.toLowerCase());

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[56px] items-center justify-between border-b border-border bg-surface px-6">
        {/* ── Search ── */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search aircraft, crew, missions…"
              className="w-[260px] bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* ── Right section ── */}
        <div className="flex items-center gap-3">
          {/* Live vs Demo Mode Selector */}
          {isDemo ? (
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-left transition hover:bg-purple-500/20 cursor-pointer"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${demoProfile.avatarColor}`}
                >
                  {demoProfile.avatar}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                    DEMO: {demoProfile.name}
                    <ChevronDown size={11} />
                  </span>
                  <span className="text-[9px] text-purple-500/80 font-mono">
                    {demoProfile.title} ({demoProfile.callSign})
                  </span>
                </div>
                <ChevronDown size={12} className="text-purple-500 sm:hidden" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card p-2 shadow-2xl z-50">
                  <div className="px-2.5 py-1.5 border-b border-border mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles size={12} className="text-purple-500" />
                      Fictional Reviewer Profiles
                    </p>
                  </div>
                  <div className="space-y-1">
                    {DEMO_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveDemoProfile(p.id);
                          setDemoProfileState(p);
                          setDemoMenuOpen(false);
                          window.location.reload();
                        }}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition cursor-pointer ${
                          demoProfile.id === p.id
                            ? "bg-purple-500/15 border border-purple-500/30"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${p.avatarColor}`}
                        >
                          {p.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.title} · {p.callSign}
                          </p>
                        </div>
                        {demoProfile.id === p.id && (
                          <UserCheck size={14} className="text-purple-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 mt-1 border-t border-border">
                    <button
                      onClick={() => {
                        setDemoMode(false);
                        setDemoMenuOpen(false);
                        window.location.reload();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      Exit Demo Mode (Return to Live)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Radio size={12} className="text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Live</span>
              </div>
              <button
                onClick={() => {
                  setDemoMode(true);
                  window.location.reload();
                }}
                className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition cursor-pointer"
                title="Switch to Demo Mode (Fictional reviewer profiles)"
              >
                <Sparkles size={11} />
                <span>Demo Mode</span>
              </button>
            </div>
          )}

          {/* Date/time */}
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-[12px] font-medium text-foreground font-mono tabular-nums">
              {timeStr}
            </span>
            <span className="text-[11px] text-muted-foreground">{dateStr}</span>
          </div>

          {/* Notifications */}
          <button
            className="relative rounded-lg p-2 transition-colors duration-150 hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell size={16} className="text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-aero-warning" />
          </button>

          {/* Operator Auth Button / Profile */}
          {session ? (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-left transition hover:border-primary/50"
              title="Manage operator session"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                  isAuthorized
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {isAuthorized ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-[12px] font-medium text-foreground truncate max-w-[130px]">
                  {session.user.email}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider ${
                    isAuthorized ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {userRole}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                setError(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-primary/10 px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/20 transition"
            >
              <LogIn size={13} />
              <span>Operator Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Operator Auth Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {session ? "Operator Session" : "Operator Sign In"}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {session ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-border bg-background p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Operator Email:</span>
                    <span className="text-xs font-mono text-foreground">{session.user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Authority Role:</span>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        isAuthorized
                          ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                          : "bg-amber-500/20 text-amber-300 font-semibold"
                      }`}
                    >
                      {userRole}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Operational Access:</span>
                    <span className="text-xs">
                      {isAuthorized ? (
                        <span className="text-emerald-400 font-medium">Full Mutation Access</span>
                      ) : (
                        <span className="text-amber-400 font-medium">Read Only (Insufficient Role)</span>
                      )}
                    </span>
                  </div>
                </div>

                {!isAuthorized && (
                  <p className="text-xs text-amber-400/90 leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded p-2.5">
                    Your authenticated account role does not permit operational mutations (optimization,
                    simulation reset, fleet reallocations). Contact an administrator to assign the
                    <code>operator</code> role in Supabase <code>app_metadata</code>.
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 font-medium transition"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex rounded-lg border border-border bg-background p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("supabase");
                      setError(null);
                    }}
                    className={`flex-1 rounded-md py-1.5 font-medium transition ${
                      authMode === "supabase"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Supabase Auth
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("key");
                      setError(null);
                    }}
                    className={`flex-1 rounded-md py-1.5 font-medium transition ${
                      authMode === "key"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Operator Key
                  </button>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {authMode === "supabase" ? (
                    <>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Authenticate using your Supabase operator credentials to acquire a signed JWT session.
                      </p>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="operator@aerosync.mil"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Enter your configured Operational API Key (matches <code>OPERATOR_API_KEY</code> on the backend) for direct mutation authority.
                      </p>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Operator Key</label>
                        <input
                          type="password"
                          required
                          value={operatorKey}
                          onChange={(e) => setOperatorKey(e.target.value)}
                          placeholder="op-live-sec-..."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                      Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

