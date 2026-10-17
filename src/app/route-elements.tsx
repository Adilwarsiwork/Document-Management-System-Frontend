import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";

import AppLayout from "../AppLayout";
import {
  endAuthSession,
  getAuthSessionRemainingMs,
  getAuthToken,
  subscribeAuthSession,
} from "../services/auth-session";

// Route element wrappers. They live beside the route table rather than inside
// router.tsx so that file exports only `router`, which keeps Fast Refresh
// working.

// The token every guard decides from. It is read through useSyncExternalStore so
// a login or logout re-renders the guards the moment it happens, and it is
// re-read on history restores:
//
// - A browser can bring a page back from its back/forward cache exactly as it
//   was left, without re-running React, which would show a screen the current
//   session is no longer allowed to see. The re-render on `pageshow`/`popstate`
//   makes the guards read the session again before the restored screen is
//   trusted.
// - `popstate` also covers forward/back through the history stack.

function useSessionToken(): string {
  const [, revalidate] = useReducer((count: number) => count + 1, 0);
  const token = useSyncExternalStore(subscribeAuthSession, getAuthToken);

  useEffect(() => {
    const onRestore = () => revalidate();

    window.addEventListener("pageshow", onRestore);
    window.addEventListener("popstate", onRestore);

    return () => {
      window.removeEventListener("pageshow", onRestore);
      window.removeEventListener("popstate", onRestore);
    };
  }, []);

  return token;
}

// Ends the session on its own once its hour is up, and drops whatever the
// finished session left cached.
//
// It sits in the shared layout rather than on the dashboard so the deadline is
// armed for the whole time the user is logged in, not just while one screen is
// mounted. Ending the session notifies the guards, which is what sends the user
// back to the login page; nothing here navigates.
function useSessionExpiry(): void {
  const token = useSessionToken();
  const queryClient = useQueryClient();
  const hadSession = useRef(false);

  // Cached responses belong to the session that asked for them. Left in place,
  // they would be handed to whoever signs in next on this tab.
  useEffect(() => {
    if (hadSession.current && !token) {
      queryClient.clear();
    }

    hadSession.current = Boolean(token);
  }, [token, queryClient]);

  useEffect(() => {
    if (!token) return;

    let timer = 0;

    // Browsers clamp timers in background tabs and may not run them at all
    // across a suspended machine, so the deadline is re-checked every time this
    // fires and the timer is re-armed for whatever is left. The session is
    // never assumed to have been ended on time.
    const arm = () => {
      const remaining = getAuthSessionRemainingMs();

      // No deadline was recorded, so there is nothing to count down. Ending the
      // session here would sign the user straight back out.
      if (remaining === null) return;

      if (remaining <= 0) {
        endAuthSession("expired");
        return;
      }

      timer = window.setTimeout(arm, remaining);
    };

    arm();

    return () => window.clearTimeout(timer);
  }, [token]);
}

// Shared chrome for every screen in the app.
export function MainLayout() {
  useSessionExpiry();

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

// Screens a logged-out visitor needs: login and register. An existing session
// skips them and goes straight to the dashboard, so history navigation can never
// land on them while logged in.
export function GuestRoute() {
  const token = useSessionToken();

  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

// Screens that need a session. A logged-out visitor is sent to the login page
// instead of the protected content, so history navigation can never reveal it.
export function ProtectedRoute() {
  const token = useSessionToken();

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

// Any unknown address is resolved against the session instead of always sending
// the visitor to the login page.
export function FallbackRoute() {
  const token = useSessionToken();

  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}
