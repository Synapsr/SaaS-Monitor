import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type TrackModule = typeof import("./track");

/** A fresh module (it loads Plausible once) in a browser-like global scope. */
async function inBrowser(href: string, config: { domain: string | null }) {
  const appended: { src: string; defer: boolean; dataset: Record<string, string> }[] = [];
  const page: Record<string, unknown> = { location: { href } };
  page.self = page;
  page.top = page;
  vi.stubGlobal("window", page);
  vi.stubGlobal("document", {
    createElement: () => ({ dataset: {} }),
    head: { append: (element: (typeof appended)[number]) => appended.push(element) },
  });
  const fetch = vi.fn(async () => Response.json(config));
  vi.stubGlobal("fetch", fetch);
  vi.resetModules();
  const tracker: TrackModule = await import("./track");
  const queue = () => (page.plausible as { q?: unknown[][] } | undefined)?.q;
  return { tracker, fetch, appended, queue, page };
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("track", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing on the server", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.resetModules();
    const { track, trackPageview } = await import("./track");
    track("Demo opened");
    trackPageview();
    await settle();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("loads nothing when the server has no analytics", async () => {
    const { tracker, fetch, appended, page } = await inBrowser("https://example.com/", {
      domain: null,
    });
    tracker.trackPageview();
    tracker.track("Signup", { method: "github", invited: "no" });
    await settle();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(appended).toEqual([]);
    expect(page.plausible).toBeUndefined();
  });

  it("loads the proxied script once, and sends redacted URLs", async () => {
    const { tracker, fetch, appended, queue } = await inBrowser(
      "https://saas-monitor.com/app/screens/0b6f3c2e-9d1a-4f5b-8c7e-2a4d6e8f0a1b?tab=share",
      { domain: "saas-monitor.com" },
    );
    tracker.trackPageview();
    tracker.track("Test celebration");
    tracker.track("Signup", { method: "email", invited: "no" });
    await settle();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(appended).toEqual([
      {
        src: "/js/pa.js",
        defer: true,
        dataset: { domain: "saas-monitor.com", api: "/api/pa" },
      },
    ]);
    const url = "https://saas-monitor.com/app/screens/:id";
    expect(queue()).toEqual([
      ["pageview", { u: url }],
      ["Test celebration", { u: url }],
      ["Signup", { u: url, props: { method: "email", invited: "no" } }],
    ]);
  });

  it("does not count the demo opening as an interaction", async () => {
    const { tracker, queue } = await inBrowser("https://saas-monitor.com/d/demo", {
      domain: "saas-monitor.com",
    });
    tracker.track("Demo opened");
    tracker.track("Demo sound on");
    await settle();
    const url = "https://saas-monitor.com/d/demo";
    expect(queue()).toEqual([
      ["Demo opened", { u: url, interactive: false }],
      ["Demo sound on", { u: url }],
    ]);
  });

  it("asks nothing on screens and in frames", async () => {
    const screen = await inBrowser("https://saas-monitor.com/d/Xy7kQ2mNpR4sT8vW", {
      domain: "saas-monitor.com",
    });
    screen.tracker.trackPageview();
    await settle();
    expect(screen.fetch).not.toHaveBeenCalled();

    const framed = await inBrowser("https://saas-monitor.com/d/demo?preview=1", {
      domain: "saas-monitor.com",
    });
    framed.page.top = {};
    framed.tracker.trackPageview();
    framed.tracker.track("Demo opened");
    await settle();
    expect(framed.fetch).not.toHaveBeenCalled();
  });
});

describe("isDashboardRedirect", () => {
  it("recognizes Next.js redirects into the dashboard", async () => {
    const { isDashboardRedirect } = await import("./track");
    const redirect = (digest: string) => Object.assign(new Error("NEXT_REDIRECT"), { digest });
    expect(isDashboardRedirect(redirect("NEXT_REDIRECT;push;/app?onboarding=1;303;"))).toBe(true);
    expect(isDashboardRedirect(redirect("NEXT_REDIRECT;replace;/app/accounts;303;"))).toBe(true);
    expect(isDashboardRedirect(redirect("NEXT_REDIRECT;push;/app;307;"))).toBe(true);
    expect(isDashboardRedirect(redirect("NEXT_REDIRECT;push;/sign-in;303;"))).toBe(false);
    expect(isDashboardRedirect(redirect("NEXT_REDIRECT;push;/apps;303;"))).toBe(false);
    expect(isDashboardRedirect(redirect("NEXT_HTTP_ERROR_FALLBACK;404"))).toBe(false);
    expect(isDashboardRedirect(new Error("boom"))).toBe(false);
    expect(isDashboardRedirect(null)).toBe(false);
  });
});
