import { useEffect, useState } from "react";

const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
const IDLE_AFTER_MS = 3_000;

/**
 * Becomes `true` after a few seconds without pointer or keyboard activity, e.g. to hide the
 * cursor and the controls of a screen nobody is touching.
 */
export function useIdle(enabled: boolean): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let timer = setTimeout(() => setIdle(true), IDLE_AFTER_MS);
    const onActivity = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_AFTER_MS);
    };
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    return () => {
      clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity);
    };
  }, [enabled]);

  return enabled && idle;
}
