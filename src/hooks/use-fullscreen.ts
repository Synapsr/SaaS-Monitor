import { useCallback, useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  document.addEventListener("fullscreenchange", listener);
  return () => document.removeEventListener("fullscreenchange", listener);
}

const isFullscreen = () => document.fullscreenElement !== null;
const canGoFullscreen = () => document.fullscreenEnabled;
const onServer = () => false;

export function useFullscreen(): { active: boolean; supported: boolean; toggle: () => void } {
  const active = useSyncExternalStore(subscribe, isFullscreen, onServer);
  const supported = useSyncExternalStore(subscribe, canGoFullscreen, onServer);
  const toggle = useCallback(() => {
    // Refused requests (no user gesture, iframe without permission) simply do nothing.
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);
  return { active, supported, toggle };
}
