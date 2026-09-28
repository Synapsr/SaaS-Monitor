import { useEffect, useState } from "react";
import {
  advanceDemo,
  createDemoWorld,
  demoState,
  nextDemoDelay,
  type DemoOptions,
} from "@/lib/display/demo";
import type { DisplayState } from "@/lib/display/types";

/**
 * The demo screen, live: its history is generated from `startedAt` (identically on the server and
 * during hydration), then a new event happens every few seconds in the browser.
 */
export function useDemoSimulation(options: DemoOptions, startedAt: string): DisplayState {
  const [start] = useState(() => {
    const now = new Date(startedAt);
    const world = createDemoWorld(options, now);
    return { world, state: demoState(world, now) };
  });
  const [state, setState] = useState(start.state);

  useEffect(() => {
    let world = start.world;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const now = new Date();
        world = advanceDemo(world, now);
        setState(demoState(world, now));
        schedule();
      }, nextDemoDelay(world));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [start]);

  return state;
}
