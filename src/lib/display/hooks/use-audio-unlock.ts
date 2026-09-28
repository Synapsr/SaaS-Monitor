import { useEffect, useState } from "react";
import { unlockAudio } from "@/lib/sounds";

/**
 * Whether sounds can play. Browsers block audio until the page gets a click or a key press, so
 * this tries once on load, then again on every gesture until it works.
 *
 * Kiosks need no gesture when Chromium runs with `--autoplay-policy=no-user-gesture-required`:
 * the first attempt succeeds and no prompt is ever shown.
 */
export function useAudioUnlock(wanted: boolean): boolean {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!wanted) return;
    let disposed = false;
    const attempt = () => {
      void unlockAudio().then((result) => {
        if (!disposed) setUnlocked(result);
      });
    };
    attempt();
    window.addEventListener("pointerdown", attempt);
    window.addEventListener("keydown", attempt);
    return () => {
      disposed = true;
      window.removeEventListener("pointerdown", attempt);
      window.removeEventListener("keydown", attempt);
    };
  }, [wanted]);

  return unlocked;
}
