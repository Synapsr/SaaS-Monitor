import { describe, expect, it } from "vitest";
import { sanitizeEvent } from "./event";

const DOMAIN = "saas-monitor.com";

describe("sanitizeEvent", () => {
  it("passes on a pageview for the configured domain, whatever the browser says", () => {
    expect(
      sanitizeEvent(
        {
          n: "pageview",
          v: 36,
          u: "https://saas-monitor.com/?utm_source=hn",
          d: "someone-else.com",
          r: "https://news.ycombinator.com/item?id=1",
          m: '{"email":"a@b.co"}',
          extra: "dropped",
        },
        DOMAIN,
      ),
    ).toEqual({
      ok: true,
      event: {
        n: "pageview",
        v: 36,
        u: "https://saas-monitor.com/?utm_source=hn",
        d: DOMAIN,
        r: "https://news.ycombinator.com/item",
      },
    });
  });

  it("redacts pages and referrers again", () => {
    const result = sanitizeEvent(
      {
        n: "Test celebration",
        u: "https://saas-monitor.com/app/screens/0b6f3c2e-9d1a-4f5b-8c7e-2a4d6e8f0a1b?tab=1",
        r: "https://saas-monitor.com/sign-in?next=%2Finvite%2Fabc",
      },
      DOMAIN,
    );
    expect(result).toEqual({
      ok: true,
      event: {
        n: "Test celebration",
        u: "https://saas-monitor.com/app/screens/:id",
        r: "https://saas-monitor.com/sign-in",
        d: DOMAIN,
      },
    });
  });

  it("keeps engagement measures and custom properties", () => {
    const result = sanitizeEvent(
      {
        n: "engagement",
        u: "https://saas-monitor.com/d/demo",
        r: null,
        sd: 42,
        e: 12_000,
        p: { invited: "no" },
        i: false,
      },
      DOMAIN,
    );
    expect(result).toMatchObject({
      ok: true,
      event: { n: "engagement", sd: 42, e: 12_000, p: { invited: "no" }, i: false, r: null },
    });
  });

  it("drops events of screens", () => {
    expect(
      sanitizeEvent({ n: "pageview", u: "https://saas-monitor.com/d/Xy7kQ2mNpR4sT8vW" }, DOMAIN),
    ).toEqual({ ok: false, reason: "untracked" });
  });

  it.each([
    null,
    "pageview",
    { n: "pageview" },
    { n: "Purchase", u: "https://saas-monitor.com/" },
    { n: "pageview", u: 42 },
    { n: "Signup", u: "https://saas-monitor.com/", p: { invited: 1 } },
    {
      n: "Signup",
      u: "https://saas-monitor.com/",
      p: Object.fromEntries(Array.from({ length: 31 }, (_, index) => [`k${index}`, "v"])),
    },
  ])("refuses %j", (body) => {
    expect(sanitizeEvent(body, DOMAIN)).toEqual({ ok: false, reason: "invalid" });
  });
});
