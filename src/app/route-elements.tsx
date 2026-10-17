import { useEffect, useReducer, useSyncExternalStore } from "react";
import { Navigate, Outlet } from "react-router-dom";

import AppLayout from "../AppLayout";
import { getAuthToken, subscribeAuthSession } from "../services/auth-session";

// Route element wrappers. They live beside the route table rather than inside
// router.tsx so that file exports only `router`, which keeps Fast Refresh
// working.

// The token every guard decides from. It is read through useSyncExternalStore so
// a sign-in or sign-out re-renders the guards the moment it happens, and it is
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

// Shared chrome for every screen in the app.
export function MainLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

// Screens a signed-out visitor needs: login and register. An existing session
// skips them and goes straight to the dashboard, so history navigation can never
// land on them while signed in.
export function GuestRoute() {
  const token = useSessionToken();

  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

// Screens that need a session. A signed-out visitor is sent to the login page
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
