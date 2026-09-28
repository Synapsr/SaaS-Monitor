import { useEffect } from "react";

/**
 * Keeps the screen from sleeping. Browsers release the lock whenever the page is hidden, so it is
 * requested again each time the page becomes visible.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let requesting = false;
    let disposed = false;

    const acquire = async () => {
      if (sentinel || requesting || document.visibilityState !== "visible") return;
      requesting = true;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) {
          await lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener("release", () => (sentinel = null), { once: true });
      } catch {
        // Refused (battery saver, insecure origin): the screen's own settings apply.
      } finally {
        requesting = false;
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release();
    };
  }, [enabled]);
}
