import { getStoredSession, refreshSession, clearSession } from "@/lib/auth/supabase-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function extractErrorMessage(errorBody: Record<string, unknown>, status: number, statusText: string): string {
  if (typeof errorBody.detail === "string") {
    return errorBody.detail;
  }
  if (errorBody.detail && typeof errorBody.detail === "object") {
    const d = errorBody.detail as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
    if (typeof d.error === "string") return `${d.error}: ${JSON.stringify(d)}`;
    return JSON.stringify(d);
  }
  if (typeof errorBody.message === "string") {
    return errorBody.message;
  }
  return `Request failed with status ${status}: ${statusText}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined | null> }
): Promise<T> {
  const { params, ...fetchOptions } = options || {};

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Privileged authorization credentials must NEVER be bundled via NEXT_PUBLIC_* variables.
  // Obtain active session token safely from Supabase Auth client or operator key override:
  let sessionToken: string | null = null;
  let refreshToken: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const session = await getStoredSession();
      if (session?.access_token) {
        sessionToken = session.access_token;
        refreshToken = session.refresh_token || null;
      }
    } catch {
      // Non-blocking fallback
    }

    if (!sessionToken) {
      sessionToken = localStorage.getItem("aerosync_operator_key");
    }
  }

  if (sessionToken) {
    if (sessionToken.startsWith("Bearer ") || sessionToken.split(".").length === 3) {
      defaultHeaders["Authorization"] = sessionToken.startsWith("Bearer ")
        ? sessionToken
        : `Bearer ${sessionToken}`;
    } else {
      defaultHeaders["X-API-Key"] = sessionToken;
    }
  }

  try {
    let response = await fetch(url, {
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    });

    // Reactive session recovery: on 401, attempt refresh token exchange and retry once
    if (response.status === 401 && refreshToken) {
      try {
        const refreshed = await refreshSession(refreshToken);
        if (refreshed?.access_token) {
          const retryHeaders = {
            ...defaultHeaders,
            ...fetchOptions.headers,
            Authorization: `Bearer ${refreshed.access_token}`,
          };
          response = await fetch(url, {
            ...fetchOptions,
            headers: retryHeaders,
          });
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const detail = extractErrorMessage(errorBody, response.status, response.statusText);
      throw new ApiError(response.status, detail);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message =
      err instanceof Error ? err.message : "Failed to connect to backend API server.";
    throw new ApiError(0, message);
  }
}

