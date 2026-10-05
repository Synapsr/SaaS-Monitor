import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { momentPlays } from "@/contract/display/events";
import { MomentQueue } from "@/contract/display/moment-queue";
import {
  initialMomentTracker,
  momentDuration,
  trackMoments,
  type Moment,
} from "@/contract/display/moments";
import type { DisplayState } from "@/contract/display/types";

/**
 * Detects what just happened between two states and plays it as moments, one at a time, like the
 * wall display (`useMoments` on the web): those with a card for as long as the screen's settings
 * say, the others for a breath. `onStart` runs once as each moment starts.
 */
export function useMoments(
  state: DisplayState | null,
  onStart: (moment: Moment) => void,
): Moment | null {
  const settings = state?.screen.settings;
  const durationOf = useCallback(
    (moment: Moment, waiting: number) =>
      settings
        ? momentDuration(moment, waiting, {
            seconds: settings.momentSeconds,
            seen: momentPlays(moment, settings, "moment"),
          })
        : 0,
    [settings],
  );
  const [queue] = useState(() => new MomentQueue(durationOf));
  // Before new moments are queued below: new settings apply from the next moment.
  useEffect(() => queue.setDurationOf(durationOf), [queue, durationOf]);
  const tracker = useRef(initialMomentTracker);

  useEffect(() => {
    if (!state) return;
    const { tracker: next, moments } = trackMoments(tracker.current, state);
    tracker.current = next;
    queue.enqueue(moments);
  }, [queue, state]);

  const moment = useSyncExternalStore(queue.subscribe, queue.getCurrent);

  const start = useEffectEvent(onStart);
  useEffect(() => {
    if (moment) start(moment);
  }, [moment]);

  return moment;
}
