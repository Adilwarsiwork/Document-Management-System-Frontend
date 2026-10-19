import { useEffect, useState } from "react";

import {
  getAuthSessionRemainingMs,
  subscribeAuthSession,
} from "../../../services/auth-session";

/**
 * Whole seconds left in the current session, or null when the session has no
 * deadline recorded.
 *
 * The value is re-derived from the stored deadline on every tick instead of
 * being decremented by one. A countdown that subtracts accumulates every
 * dropped tick, and browsers clamp timers in background tabs and may not run
 * them at all across a suspended machine, so a tab left open overnight would
 * show minutes that no longer exist. Reading the deadline makes each tick
 * correct on its own and self-correcting after any delay.
 */
export function useSessionCountdown(): number | null {
  const [secondsLeft, setSecondsLeft] = useState(readSecondsLeft);

  useEffect(() => {
    const update = () => setSecondsLeft(readSecondsLeft());

    // A login records a new deadline and a logout clears it. Without this the
    // header would keep counting down a session that no longer exists.
    const unsubscribe = subscribeAuthSession(update);

    update();

    const interval = window.setInterval(update, 1000);

    // A backgrounded tab has its timers clamped, so whatever is on screen when
    // the tab comes back is as stale as the sleep. Re-reading on return puts the
    // real value on the first painted frame instead of a second later.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") update();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return secondsLeft;
}

// Rounded up, so the display only reaches 00:00 once the deadline has actually
// passed and never shows an empty second while time is still left to use. Read
// directly during the first render as well, so the header never paints a
// placeholder time over a session that is already counted.
function readSecondsLeft(): number | null {
  const remainingMs = getAuthSessionRemainingMs();

  // A session saved while storage was unavailable carries no deadline. There is
  // genuinely nothing to count down, so nothing is shown rather than a guess
  // that would disagree with the session it is describing.
  return remainingMs === null ? null : Math.ceil(remainingMs / 1000);
}