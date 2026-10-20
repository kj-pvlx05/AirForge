/**
 * AEROSYNC — Frontend Supabase Authentication Client
 * Lightweight, zero-dependency client communicating directly with Supabase Auth REST API.
 * Manages operator sign-in, session storage, token refresh, and sign-out.
 */

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  appRole?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // Unix timestamp in seconds
  user: AuthUser;
}

const STORAGE_SESSION_KEY = "aerosync_auth_session";
const STORAGE_TOKEN_KEY = "aerosync_auth_token";

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes("your-project-id")) {
    return null;
  }
  return { url: url.replace(/\/$/, ""), anonKey };
}

/**
 * Retrieves the currently persisted authentication session.
 * Automatically refreshes the session if expired and a refresh token is present.
 */
export async function getStoredSession(): Promise<AuthSession | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_SESSION_KEY);
  if (!raw) {
    const opKey = localStorage.getItem("aerosync_operator_key");
    if (opKey) {
      return {
        access_token: opKey,
        user: {
          id: "api_key_operator",
          email: "operator@aerosync.mil",
          role: "operator",
          appRole: "operator",
        },
      };
    }
    return null;
  }

  try {
    const session: AuthSession = JSON.parse(raw);
    const nowSeconds = Math.floor(Date.now() / 1000);

    // If token is still valid (with 60-second grace buffer), return it
    if (session.expires_at && session.expires_at > nowSeconds + 60) {
      return session;
    }

    // If expired and refresh token is available, attempt refresh
    if (session.refresh_token) {
      const refreshed = await refreshSession(session.refresh_token);
      if (refreshed) {
        return refreshed;
      }
    }

    // If expired and cannot refresh, clear stale session
    clearSession();
    return null;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Authenticates using an Operator API key.
 */
export function signInWithOperatorKey(key: string): { session: AuthSession | null; error: string | null } {
  const trimmed = key.trim();
  if (!trimmed) {
    return { session: null, error: "Operator key cannot be empty." };
  }
  const session: AuthSession = {
    access_token: trimmed,
    user: {
      id: "api_key_operator",
      email: "operator@aerosync.mil",
      role: "operator",
      appRole: "operator",
    },
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("aerosync_operator_key", trimmed);
  }
  saveSession(session);
  return { session, error: null };
}

/**
 * Authenticates an operator using email and password via Supabase Auth GoTrue API.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ session: AuthSession | null; error: string | null }> {
  const config = getSupabaseConfig();
  if (!config) {
    return {
      session: null,
      error:
        "Supabase credentials are not configured in frontend environment (NEXT_PUBLIC_SUPABASE_URL).",
    };
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error_description || data.msg || data.message || "Authentication failed.";
      return { session: null, error: msg };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const appRole = data.user?.app_metadata?.role || data.user?.role || "authenticated";

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: nowSeconds + (data.expires_in || 3600),
      user: {
        id: data.user?.id || "",
        email: data.user?.email || email,
        role: appRole,
        appRole,
      },
    };

    saveSession(session);
    return { session, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error contacting Supabase Auth.";
    return { session: null, error: msg };
  }
}

/**
 * Refreshes an expired access token using the refresh token.
 */
export async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.anonKey,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data = await res.json();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const appRole = data.user?.app_metadata?.role || data.user?.role || "authenticated";

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: nowSeconds + (data.expires_in || 3600),
      user: {
        id: data.user?.id || "",
        email: data.user?.email || "",
        role: appRole,
        appRole,
      },
    };

    saveSession(session);
    return session;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Signs out the current operator and clears local session storage.
 */
export async function signOut(): Promise<void> {
  const config = getSupabaseConfig();
  const session = await getStoredSession();

  if (config && session?.access_token) {
    try {
      await fetch(`${config.url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch {
      // Best-effort logout; proceed to clear local session
    }
  }

  clearSession();
}

/**
 * Persists session data and notifies listeners.
 */
export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(STORAGE_TOKEN_KEY, session.access_token);
  window.dispatchEvent(new CustomEvent("aerosync_auth_change", { detail: session }));
}

/**
 * Clears stored credentials and notifies listeners.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_SESSION_KEY);
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem("aerosync_operator_key");
  window.dispatchEvent(new CustomEvent("aerosync_auth_change", { detail: null }));
}
