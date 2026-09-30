import { describe, expect, it } from "vitest";
import {
  DEMO_SOUND_EVENT,
  DEMO_SOUND_STATE,
  demoSoundRequest,
  demoSoundStatus,
  isDemoSoundState,
} from "./demo-sound";

describe("demo sound requests", () => {
  it("reads the request an event carries", () => {
    for (const request of ["on", "off", "report"] as const) {
      expect(demoSoundRequest(new CustomEvent(DEMO_SOUND_EVENT, { detail: request }))).toBe(
        request,
      );
    }
  });

  it("ignores other events and details", () => {
    expect(demoSoundRequest(new Event(DEMO_SOUND_EVENT))).toBeNull();
    expect(demoSoundRequest(new CustomEvent(DEMO_SOUND_EVENT, { detail: "loud" }))).toBeNull();
    expect(demoSoundRequest(new CustomEvent(DEMO_SOUND_EVENT, { detail: { on: true } }))).toBe(
      null,
    );
  });

  it("reads a request from another window's event, which is no CustomEvent of this one", () => {
    const foreign = Object.assign(new Event(DEMO_SOUND_EVENT), { detail: "on" });
    expect(demoSoundRequest(foreign)).toBe("on");
  });
});

describe("demo sound state messages", () => {
  it("recognizes the frame's answer", () => {
    expect(isDemoSoundState({ type: DEMO_SOUND_STATE, on: true })).toBe(true);
    expect(isDemoSoundState({ type: DEMO_SOUND_STATE, on: false })).toBe(true);
  });

  it("ignores other messages, such as the screen editor's", () => {
    expect(isDemoSoundState(null)).toBe(false);
    expect(isDemoSoundState("on")).toBe(false);
    expect(isDemoSoundState({ type: "saas-monitor:preview-ready" })).toBe(false);
    expect(isDemoSoundState({ type: DEMO_SOUND_STATE, on: "yes" })).toBe(false);
  });
});

describe("demo sound status", () => {
  it("is on whenever the frame says so", () => {
    expect(demoSoundStatus(true, "on")).toBe("on");
    expect(demoSoundStatus(true, null)).toBe("on");
  });

  it("is blocked when a click asked for sound and the browser refused", () => {
    expect(demoSoundStatus(false, "on")).toBe("blocked");
  });

  it("is off when turned off, or when the frame reports on its own", () => {
    expect(demoSoundStatus(false, "off")).toBe("off");
    expect(demoSoundStatus(false, "report")).toBe("off");
    expect(demoSoundStatus(false, null)).toBe("off");
  });
});
