import { describe, expect, it } from "vitest";
import { analyticsPath, analyticsReferrer, analyticsUrl } from "./redact";

const SCREEN_ID = "0b6f3c2e-9d1a-4f5b-8c7e-2a4d6e8f0a1b";
const INVITATION_ID = "hQzKpWmVxRtYbNcLsDfGjAeUiOoPlKjH";

describe("analyticsPath", () => {
  it.each(["/", "/sign-up", "/alternatives/baremetrics", "/stripe-notification-sound", "/app"])(
    "keeps %s",
    (path) => {
      expect(analyticsPath(path)).toBe(path);
    },
  );

  it("keeps the demo, and only the demo, of the screens", () => {
    expect(analyticsPath("/d/demo")).toBe("/d/demo");
    expect(analyticsPath("/d/demo/")).toBe("/d/demo");
    expect(analyticsPath("/d/Xy7kQ2mNpR4sT8vW")).toBeNull();
    expect(analyticsPath("/d/demo-screen")).toBeNull();
    expect(analyticsPath("/d/demo/extra")).toBeNull();
    expect(analyticsPath("/d")).toBeNull();
  });

  it("never tracks API routes", () => {
    expect(analyticsPath("/api/pa")).toBeNull();
    expect(analyticsPath("/api/screens/abc/state")).toBeNull();
  });

  it("redacts the ids of dashboard and invitation routes", () => {
    expect(analyticsPath(`/app/screens/${SCREEN_ID}`)).toBe("/app/screens/:id");
    expect(analyticsPath(`/invite/${INVITATION_ID}`)).toBe("/invite/:id");
    expect(analyticsPath("/invite/short")).toBe("/invite/:id");
  });

  it("redacts anything that looks like an id, wherever it is", () => {
    expect(analyticsPath(`/app/accounts/${SCREEN_ID}/sync`)).toBe("/app/accounts/:id/sync");
    expect(analyticsPath("/share/a1B2c3D4e5F6g7H8i9")).toBe("/share/:id");
    expect(analyticsPath("/share/QwErTyUiOpAsDfGhJkLz")).toBe("/share/:id");
    expect(analyticsPath("/alternatives/stripe-dashboard-on-tv")).toBe(
      "/alternatives/stripe-dashboard-on-tv",
    );
    expect(analyticsPath("/app/accounts/new")).toBe("/app/accounts/new");
  });
});

describe("analyticsUrl", () => {
  it("keeps the origin and the attribution parameters only", () => {
    expect(
      analyticsUrl(
        "https://saas-monitor.com/?utm_source=hn&utm_campaign=launch&ref=producthunt&email=a%40b.co#pricing",
      ),
    ).toBe("https://saas-monitor.com/?utm_source=hn&utm_campaign=launch&ref=producthunt");
  });

  it("drops redirects, which may point to an invitation", () => {
    expect(analyticsUrl(`https://saas-monitor.com/sign-in?next=%2Finvite%2F${INVITATION_ID}`)).toBe(
      "https://saas-monitor.com/sign-in",
    );
  });

  it("drops the demo's options, preview included", () => {
    expect(analyticsUrl("https://saas-monitor.com/d/demo?accent=violet&lang=fr")).toBe(
      "https://saas-monitor.com/d/demo",
    );
  });

  it("redacts ids in the path", () => {
    expect(analyticsUrl(`http://localhost:3000/app/screens/${SCREEN_ID}?tab=share`)).toBe(
      "http://localhost:3000/app/screens/:id",
    );
  });

  it("refuses screens and anything that is not a web page", () => {
    expect(analyticsUrl("https://saas-monitor.com/d/Xy7kQ2mNpR4sT8vW?utm_source=tv")).toBeNull();
    expect(analyticsUrl("file:///Users/me/index.html")).toBeNull();
    expect(analyticsUrl("not a url")).toBeNull();
  });

  it("cuts long parameter values", () => {
    const url = analyticsUrl(`https://saas-monitor.com/?ref=${"x".repeat(500)}`);
    expect(url).toBe(`https://saas-monitor.com/?ref=${"x".repeat(100)}`);
  });
});

describe("analyticsReferrer", () => {
  const page = "https://saas-monitor.com/";

  it("keeps the origin and path of another site, without its query string", () => {
    expect(analyticsReferrer("https://www.reddit.com/r/SaaS/comments/abc/?utm_name=x", page)).toBe(
      "https://www.reddit.com/r/SaaS/comments/abc/",
    );
    expect(analyticsReferrer("https://news.ycombinator.com/", page)).toBe(
      "https://news.ycombinator.com/",
    );
  });

  it("redacts pages of this site like any tracked page", () => {
    expect(analyticsReferrer(`https://saas-monitor.com/app/screens/${SCREEN_ID}`, page)).toBe(
      "https://saas-monitor.com/app/screens/:id",
    );
    expect(analyticsReferrer("https://saas-monitor.com/d/Xy7kQ2mNpR4sT8vW", page)).toBe(
      "https://saas-monitor.com/",
    );
  });

  it("is empty without a web referrer", () => {
    expect(analyticsReferrer(null, page)).toBeNull();
    expect(analyticsReferrer("", page)).toBeNull();
    expect(analyticsReferrer("android-app://com.slack/", page)).toBeNull();
  });
});
