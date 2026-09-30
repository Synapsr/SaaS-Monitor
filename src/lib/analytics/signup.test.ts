import { describe, expect, it } from "vitest";
import { markSignup, readSignupMark } from "./signup";

describe("markSignup", () => {
  it("marks the destination, keeping its query and hash", () => {
    expect(markSignup("/app", "github")).toBe("/app?signup=github");
    expect(markSignup("/app/screens?tab=1#share", "google")).toBe(
      "/app/screens?tab=1&signup=google#share",
    );
  });
});

describe("readSignupMark", () => {
  it("reads a mark, and gives the path without it", () => {
    expect(readSignupMark("https://saas-monitor.com/app?signup=github")).toEqual({
      method: "github",
      invited: false,
      path: "/app",
    });
    expect(
      readSignupMark("https://saas-monitor.com/app/screens?tab=1&signup=google#share"),
    ).toEqual({ method: "google", invited: false, path: "/app/screens?tab=1#share" });
  });

  it("knows a teammate who signed up to accept an invitation", () => {
    expect(readSignupMark("https://saas-monitor.com/invite/abc123?signup=github")).toMatchObject({
      invited: true,
      path: "/invite/abc123",
    });
  });

  it("round-trips with markSignup", () => {
    const marked = markSignup("/invite/abc123", "google");
    expect(readSignupMark(`https://saas-monitor.com${marked}`)?.path).toBe("/invite/abc123");
  });

  it("ignores pages without a valid mark", () => {
    expect(readSignupMark("https://saas-monitor.com/app")).toBeNull();
    expect(readSignupMark("https://saas-monitor.com/app?signup=email")).toBeNull();
    expect(readSignupMark("https://saas-monitor.com/app?signup=")).toBeNull();
    expect(readSignupMark("not a url")).toBeNull();
  });
});
