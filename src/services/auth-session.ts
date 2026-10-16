import type { Role } from "../pages/login/types/auth.types";

const SESSION_KEY = "dms_session";

// Stores the response exactly as received: no keys added, renamed or dropped.
export function saveAuthSession(data: unknown): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable in private browsing; keep the app usable.
  }
}

// Returns the raw payload the server sent, or an empty object.
export function readAuthSession(): Record<string, unknown> {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);

    if (!stored) return {};

    const parsed: unknown = JSON.parse(stored);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to an empty session on malformed storage.
  }

  return {};
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

const readString = (key: string): string => {
  const value = readAuthSession()[key];

  return typeof value === "string" ? value : "";
};

export function getAuthToken(): string {
  return readString("token");
}

export function getAuthUserId(): string | number {
  const value = readAuthSession().user_id;

  // Some deployments return a numeric id, which must not be discarded.
  if (typeof value === "number" && Number.isFinite(value)) return value;

  return typeof value === "string" ? value : "";
}

export function getAuthUserName(): string {
  return readString("user_name");
}

export function getAuthRoles(): Role[] {
  const roles = readAuthSession().roles;

  if (!Array.isArray(roles)) return [];

  return roles.filter(
    (role): role is Role => Boolean(role) && typeof role === "object",
  );
}
