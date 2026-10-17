import { useEffect, useState } from "react";

/**
 * Tracks browser connectivity.
 *
 * `navigator.onLine` only reports whether a network interface exists, not whether
 * the API is actually reachable, so this is used to explain and prompt a retry
 * rather than to decide whether to try a request at all.
 */
export function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== "undefined" && navigator.onLine === false,
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return isOffline;
}