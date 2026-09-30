/*
 * How the landing page turns the sound of its demo TV on. The demo plays in a frame, silent like
 * every preview, and browsers only let a page play sound after a click. The click lands on the
 * landing page, which dispatches a request on the frame's window (same origin) while it handles
 * the click: the frame then unlocks its audio within that click, as Safari requires. The frame
 * answers by message, with whether its sound is on.
 */

/** The event the landing page dispatches on the frame's window. */
export const DEMO_SOUND_EVENT = "saas-monitor:demo-sound";

/** What the landing page asks the frame: turn the sound on or off, or say how it is. */
export type DemoSoundRequest = "on" | "off" | "report";

/** Posted by the frame to the landing page when it starts listening, and when asked. */
export const DEMO_SOUND_STATE = "saas-monitor:demo-sound-state";

export interface DemoSoundState {
  type: typeof DEMO_SOUND_STATE;
  on: boolean;
}

export function isDemoSoundState(value: unknown): value is DemoSoundState {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === DEMO_SOUND_STATE &&
    typeof (value as { on?: unknown }).on === "boolean"
  );
}

/**
 * The request an event carries, `null` for anything else. The event is created in the landing
 * page's window, another realm than the frame's: `instanceof CustomEvent` would fail there.
 */
export function demoSoundRequest(event: Event): DemoSoundRequest | null {
  const detail: unknown = (event as { detail?: unknown }).detail;
  return detail === "on" || detail === "off" || detail === "report" ? detail : null;
}

/** What the landing page shows: `loading` until the demo listens, `blocked` after a refusal. */
export type DemoSoundStatus = "loading" | "off" | "on" | "blocked";

/**
 * The status after the frame said whether its sound is on. `asked` is the last request the
 * landing page made, if the frame has not answered it yet: a request to turn the sound on that
 * ends with it off means the browser refused.
 */
export function demoSoundStatus(on: boolean, asked: DemoSoundRequest | null): DemoSoundStatus {
  if (on) return "on";
  return asked === "on" ? "blocked" : "off";
}
