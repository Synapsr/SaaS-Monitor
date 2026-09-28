import { useEffect } from "react";
import { BUILD_ID } from "@/lib/build-id";

const RELOADED_FOR = "saas-monitor:reloaded-for";

/**
 * Reloads a screen when the server runs another build, so that screens left open for months get
 * every update. `enabled` lets the caller wait for a quiet moment (no celebration on screen).
 */
export function useVersionReload(serverVersion: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !serverVersion || serverVersion === BUILD_ID) return;
    // Servers of two builds behind one load balancer (during a rolling deploy) must not make a
    // screen reload in a loop: one reload per server version and session.
    try {
      if (sessionStorage.getItem(RELOADED_FOR) === serverVersion) return;
      sessionStorage.setItem(RELOADED_FOR, serverVersion);
    } catch {
      // Storage blocked: reload without the guard, which only matters during rolling deploys.
    }
    window.location.reload();
  }, [serverVersion, enabled]);
}
