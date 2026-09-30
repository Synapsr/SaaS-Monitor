import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import {
  DEMO_SOUND_EVENT,
  DEMO_SOUND_STATE,
  demoSoundRequest,
  demoSoundStatus,
  isDemoSoundState,
  type DemoSoundRequest,
  type DemoSoundState,
  type DemoSoundStatus,
} from "@/lib/demo-sound";
import { unlockAudio } from "@/lib/sounds";
import { getAudioGraph } from "@/lib/sounds/graph";
import { hush } from "@/lib/voice/player";

/** The sound switch of the landing page's demo TV: see `src/lib/demo-sound.ts`. */

/**
 * In the demo's frame: whether the landing page turned the sound on, and the browser let it play.
 * `onTurnedOn` runs then.
 */
export function useDemoSoundSwitch(enabled: boolean, onTurnedOn: () => void): boolean {
  const [on, setOn] = useState(false);
  const turnedOn = useEffectEvent(onTurnedOn);

  useEffect(() => {
    if (!enabled || window.parent === window) return;
    let current = false;
    // Counts the requests: the answer to an earlier click is dropped, the last one wins.
    let requests = 0;
    const post = () =>
      window.parent.postMessage(
        { type: DEMO_SOUND_STATE, on: current } satisfies DemoSoundState,
        window.location.origin,
      );
    const switchTo = (value: boolean) => {
      current = value;
      setOn(value);
      post();
    };

    const onRequest = (event: Event) => {
      const request = demoSoundRequest(event);
      if (request === "report") post();
      if (request !== "on" && request !== "off") return;
      const turn = (requests += 1);
      if (request === "off") {
        switchTo(false);
        // Also silences what is ringing right now, and the voice about to speak over it.
        hush();
        void getAudioGraph()
          ?.context.suspend()
          .catch(() => {});
        return;
      }
      // Still within the landing page's click: the browser lets audio start.
      void unlockAudio().then((running) => {
        if (turn !== requests) return;
        switchTo(running);
        if (running) turnedOn();
      });
    };

    window.addEventListener(DEMO_SOUND_EVENT, onRequest);
    post();
    return () => window.removeEventListener(DEMO_SOUND_EVENT, onRequest);
  }, [enabled]);

  return on;
}

/** Dispatched synchronously: the frame handles it before this returns, within the click. */
function request(frame: HTMLIFrameElement | null, value: DemoSoundRequest) {
  frame?.contentWindow?.dispatchEvent(new CustomEvent(DEMO_SOUND_EVENT, { detail: value }));
}

/** On the landing page: the sound of the demo playing in `frame`, and its switch. */
export function useDemoSound(frame: RefObject<HTMLIFrameElement | null>): {
  status: DemoSoundStatus;
  toggle: () => void;
} {
  const [status, setStatus] = useState<DemoSoundStatus>("loading");
  // What the last click asked for, until the frame answers.
  const asked = useRef<DemoSoundRequest | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.current?.contentWindow || !isDemoSoundState(event.data)) return;
      setStatus(demoSoundStatus(event.data.on, asked.current));
      asked.current = null;
    };
    window.addEventListener("message", onMessage);
    // The demo may have loaded first, and told nobody.
    request(frame.current, "report");
    return () => window.removeEventListener("message", onMessage);
  }, [frame]);

  const toggle = () => {
    asked.current = status === "on" ? "off" : "on";
    request(frame.current, asked.current);
  };
  return { status, toggle };
}
