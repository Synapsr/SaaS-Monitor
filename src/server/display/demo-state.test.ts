import { describe, expect, it } from "vitest";
import { demoStateAt } from "@/lib/display/demo/clock";
import { parseDemoOptions } from "@/lib/display/demo/options";
import { demoDisplayState } from "./demo-state";

const { options } = parseDemoOptions({});
const at = (time: string) => new Date(`2026-10-07T${time}Z`);

describe("demo display state", () => {
  it("plays what happened since the previous poll, like a poll computing it from scratch", () => {
    for (const time of ["14:05:00", "14:05:10", "14:21:30", "14:59:59", "15:00:20", "15:03:00"]) {
      expect(demoDisplayState(options, at(time))).toEqual(demoStateAt(options, at(time)));
    }
  });

  it("answers a poll behind the latest one, and resumes after it", () => {
    demoDisplayState(options, at("16:40:00"));
    expect(demoDisplayState(options, at("16:10:00"))).toEqual(demoStateAt(options, at("16:10:00")));
    expect(demoDisplayState(options, at("16:45:00"))).toEqual(demoStateAt(options, at("16:45:00")));
  });

  it("keeps each variant of the demo apart", () => {
    const french = parseDemoOptions({ lang: "fr", accounts: "2" }).options;
    const state = demoDisplayState(french, at("17:30:00"));
    expect(state.screen.settings.language).toBe("fr");
    expect(state).toEqual(demoStateAt(french, at("17:30:00")));
    expect(demoDisplayState(options, at("17:30:05")).screen.settings.language).toBe("en");
  });
});
