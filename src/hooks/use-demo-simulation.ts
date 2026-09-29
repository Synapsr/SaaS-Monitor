import { useEffect, useState } from "react";
import type { DemoOptions } from "@/lib/display/demo/options";
import {
  advanceDemoWorlds,
  createDemoWorlds,
  nextDemoWorldsDelay,
} from "@/lib/display/demo/simulation";
import { demoState } from "@/lib/display/demo/state";
import type { DisplayState } from "@/lib/display/types";

/**
 * The demo screen, live: its history is generated from `startedAt` (identically on the server and
 * during hydration), then something happens every few seconds in the browser.
 */
export function useDemoSimulation(options: DemoOptions, startedAt: string): DisplayState {
  const [start] = useState(() => {
    const now = new Date(startedAt);
    const worlds = createDemoWorlds(options, now);
    return { worlds, state: demoState(worlds, now) };
  });
  const [state, setState] = useState(start.state);

  useEffect(() => {
    let worlds = start.worlds;
    let turn = 0;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          const now = new Date();
          worlds = advanceDemoWorlds(worlds, turn, now);
          turn += 1;
          setState(demoState(worlds, now));
          schedule();
        },
        nextDemoWorldsDelay(worlds, turn),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [start]);

  return state;
}
