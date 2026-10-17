import type { Role } from "../pages/login/types/auth.types";

const SESSION_KEY = "dms_session";

// The server token is opaque, so there is no `exp` claim to read and no refresh
// endpoint to call. One hour from a successful login is therefore the whole
// lifetime, and it is defined here and nowhere else.
export const SESSION_MAX_AGE_MS = 60 * 60 * 1000;

// Kept in its own storage key rather than inside the payload, so the session
// keeps holding the server response verbatim: no keys added, renamed or dropped.
const SESSION_EXPIRES_AT_KEY = "dms_session_expires_at";

// Why the session ended, held until the login screen reads it so the user is
// told the difference between a logout and a timeout.
export type SessionEndReason = "expired" | "logout";

let pendingEndReason: SessionEndReason | null = null;

// The route guards subscribe here so a login or logout is reflected
// immediately, instead of on the next navigation.
const sessionListeners = new Set<() => void>();

export function subscribeAuthSession(listener: () => void): () => void {
  sessionListeners.add(listener);

  return () => {
    sessionListeners.delete(listener);
  };
}

function notifyAuthSession(): void {
  for (const listener of sessionListeners) listener();
}

// Stores the response exactly as received, beside the instant it stops being
// accepted.
export function saveAuthSession(data: unknown): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    sessionStorage.setItem(
      SESSION_EXPIRES_AT_KEY,
      String(Date.now() + SESSION_MAX_AGE_MS),
    );
  } catch {
    // Storage can be unavailable in private browsing; keep the app usable.
  }

  notifyAuthSession();
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

function hasStoredSession(): boolean {
  try {
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

// The single way a session stops, so the token, its deadline and the stored
// reason can never drift apart.
export function endAuthSession(reason: SessionEndReason = "logout"): void {
  const hadSession = hasStoredSession();

  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  } catch {
    // Nothing left to clear when storage is unavailable.
  }

  // A timer can still be in flight when the user logs out by hand, and that late
  // expiry must not relabel a deliberate logout as a timeout. The first reason to
  // end a session is the one the user is told about.
  if (hadSession && !pendingEndReason) {
    pendingEndReason = reason;
  }

  notifyAuthSession();
}

// Reads the deadline once, so a caller comparing several derived values cannot
// straddle the instant of expiry and disagree with itself.
function readDeadline(): number {
  try {
    const stored = Number(sessionStorage.getItem(SESSION_EXPIRES_AT_KEY));

    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
}

// A session saved while storage was unavailable carries no deadline. Rather than
// guess a lifetime and lock someone out, leave it to the server to reject.
export function isAuthSessionExpired(now: number = Date.now()): boolean {
  const deadline = readDeadline();

  return deadline > 0 && now >= deadline;
}

// Milliseconds left, or null when the session has no deadline to count down.
// The two are kept apart because they call for opposite responses: elapsed means
// end the session now, absent means leave it to the server.
export function getAuthSessionRemainingMs(
  now: number = Date.now(),
): number | null {
  const deadline = readDeadline();

  return deadline > 0 ? Math.max(0, deadline - now) : null;
}

// Why the session stopped, or null if it is still running. Reading this must be
// free of side effects: the login screen reads it while rendering.
export function getSessionEndReason(): SessionEndReason | null {
  return pendingEndReason;
}

// Forgotten once the login screen has had it, so a reload does not replay a
// notice about a session that is long gone.
export function clearSessionEndReason(): void {
  pendingEndReason = null;
}

const readString = (key: string): string => {
  const value = readAuthSession()[key];

  return typeof value === "string" ? value : "";
};

export function getAuthToken(): string {
  // Reads as logged out once the hour is up. This is deliberately a pure read:
  // clearing storage belongs to endAuthSession, not to a function the guards
  // call during render. It also means an expired session bounces the guards even
  // if the expiry timer was throttled or suspended and never got to run.
  if (isAuthSessionExpired()) return "";

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
