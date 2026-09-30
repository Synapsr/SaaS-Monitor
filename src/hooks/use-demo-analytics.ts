import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import type { ScreenSettings } from "@/lib/screens/settings";
import { getAudioGraph } from "@/lib/sounds/graph";

/**
 * Counts visits of the standalone demo (not the landing page's muted preview), and the visitors
 * who hear it: its sound starts with their first click, or right away where browsers allow it.
 */
export function useDemoAnalytics(standalone: boolean, settings: ScreenSettings): void {
  // Like the display: without sound or voice, it never unlocks audio.
  const audible = settings.sound.enabled || settings.voice.enabled;
  // Development runs effects twice: one visit is one visit.
  const counted = useRef({ opened: false, sound: false });

  useEffect(() => {
    if (!standalone || counted.current.opened) return;
    counted.current.opened = true;
    track("Demo opened");
  }, [standalone]);

  useEffect(() => {
    // The display has created the audio graph by now (children's effects run first).
    const context = standalone && audible ? getAudioGraph()?.context : undefined;
    if (!context || counted.current.sound) return;

    const onStateChange = () => {
      if (context.state !== "running" || counted.current.sound) return;
      counted.current.sound = true;
      track("Demo sound on");
    };
    onStateChange();
    context.addEventListener("statechange", onStateChange);
    return () => context.removeEventListener("statechange", onStateChange);
  }, [standalone, audible]);
}
