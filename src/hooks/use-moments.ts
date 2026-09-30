import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { momentPlays } from "@/lib/display/events";
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
 * Detects what just happened between two states and plays it as moments, one at a time: those
 * with a card for as long as the screen's settings say, the others for their sound and voice.
 * `onStart` runs once when each moment starts (sound, voice, confetti).
 */
export function useMoments(
  state: DisplayState,
  onStart: (moment: Moment) => void,
): { moment: Moment | null; idle: boolean } {
  const { settings } = state.screen;
  const durationOf = useCallback(
    (moment: Moment, waiting: number) =>
      momentDuration(moment, waiting, {
        seconds: settings.momentSeconds,
        seen: momentPlays(moment, settings, "moment"),
      }),
    [settings],
  );
  const [queue] = useState(() => new MomentQueue(durationOf));
  // Before new moments are queued below: new settings apply from the next moment.
  useEffect(() => queue.setDurationOf(durationOf), [queue, durationOf]);
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
