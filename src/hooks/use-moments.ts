import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { MomentQueue } from "@/lib/display/moment-queue";
import {
  initialMomentTracker,
  momentDuration,
  trackMoments,
  type Moment,
} from "@/lib/display/moments";
import type { DisplayState } from "@/lib/display/types";

const noMoment = () => null;
const idleOnServer = () => true;

/**
 * Detects what just happened between two states and plays it as moments, one at a time, each for
 * as long as the screen's settings say. `onStart` runs once when each moment appears (sound,
 * confetti).
 */
export function useMoments(
  state: DisplayState,
  onStart: (moment: Moment) => void,
): { moment: Moment | null; idle: boolean } {
  const { momentSeconds } = state.screen.settings;
  const [queue] = useState(() => new MomentQueue(momentDuration, momentSeconds));
  // Before new moments are queued below: a new setting applies from the next one.
  useEffect(() => queue.setSeconds(momentSeconds), [queue, momentSeconds]);
  const tracker = useRef(initialMomentTracker);

  useEffect(() => {
    const { tracker: next, moments } = trackMoments(tracker.current, state);
    tracker.current = next;
    queue.enqueue(moments);
  }, [queue, state]);

  const moment = useSyncExternalStore(queue.subscribe, queue.getCurrent, noMoment);
  const idle = useSyncExternalStore(queue.subscribe, queue.isIdle, idleOnServer);

  const start = useEffectEvent(onStart);
  useEffect(() => {
    if (moment) start(moment);
  }, [moment]);

  return { moment, idle };
}
