import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoOptions } from "@/lib/display/demo/options";
import {
  advanceDemoWorlds,
  createDemoWorlds,
  nextDemoWorldsDelay,
} from "@/lib/display/demo/simulation";
import { demoState } from "@/lib/display/demo/state";
import type { DisplayState } from "@/lib/display/types";

/** How soon something happens when asked to hurry: a visitor who just turned the sound on. */
const SOON_MS = 1_500;

/**
 * The demo screen, live: its history is generated from `startedAt` (identically on the server and
 * during hydration), then something happens every few seconds in the browser. `playSoon` brings
 * the next event forward.
 */
export function useDemoSimulation(
  options: DemoOptions,
  startedAt: string,
): { state: DisplayState; playSoon: () => void } {
  const [start] = useState(() => {
    const now = new Date(startedAt);
    const worlds = createDemoWorlds(options, now);
    return { worlds, state: demoState(worlds, now) };
  });
  const [state, setState] = useState(start.state);
  const hurry = useRef<(() => void) | null>(null);

  useEffect(() => {
    let worlds = start.worlds;
    let turn = 0;
    let timer: ReturnType<typeof setTimeout>;
    let dueAt = 0;
    const schedule = (delay: number) => {
      clearTimeout(timer);
      dueAt = Date.now() + delay;
      timer = setTimeout(() => {
        const now = new Date();
        worlds = advanceDemoWorlds(worlds, turn, now);
        turn += 1;
        setState(demoState(worlds, now));
        schedule(nextDemoWorldsDelay(worlds, turn));
      }, delay);
    };
    schedule(nextDemoWorldsDelay(worlds, turn));
    hurry.current = () => {
      if (dueAt - Date.now() > SOON_MS) schedule(SOON_MS);
    };
    return () => {
      clearTimeout(timer);
      hurry.current = null;
    };
  }, [start]);

  const playSoon = useCallback(() => hurry.current?.(), []);
  return { state, playSoon };
}
