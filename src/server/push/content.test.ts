import { describe, expect, it } from "vitest";
import { displayLocale } from "@/lib/display/i18n";
import type { Moment } from "@/lib/display/moments";
import type { Language } from "@/lib/screens/settings";
import { feedItem } from "@/test/display";
import { pushContent, screenKey, type PushContext } from "./content";

function context(overrides: Partial<PushContext> & { language?: Language } = {}): PushContext {
  const { language = "en", ...rest } = overrides;
  return {
    locale: displayLocale(language),
    currency: "usd",
    metric: "mrr",
    timeZone: "UTC",
    accountNames: null,
    ...rest,
  };
}

const payment = (overrides: Parameters<typeof feedItem>[0] = {}): Moment => ({
  id: "payment:1",
  kind: "payment",
  payment: feedItem({ kind: "payment", amount: 4_900, ...overrides }),
});

const movement = (overrides: Parameters<typeof feedItem>[0]): Moment => ({
  id: "movement:1",
  kind: "movement",
  movement: feedItem(overrides),
});

describe("notification content", () => {
  it("says a payment like its card does, without naming customers the screen hides", () => {
    expect(pushContent(payment(), context())).toEqual({
      title: "Payment received",
      body: "$49 · Pro · 🇫🇷 France",
    });
    expect(pushContent(payment({ customerName: "Ada Lovelace" }), context())).toEqual({
      title: "Payment received",
      body: "$49 · Ada Lovelace · Pro · 🇫🇷 France",
    });
  });

  it("speaks the screen's language, amounts and currency", () => {
    const fr = context({ language: "fr", currency: "eur" });
    const { title, body } = pushContent(payment({ amount: 124_850 }), fr);
    expect(title).toBe("Paiement reçu");
    // French writes its numbers with narrow no-break spaces.
    expect(body.replace(/\s/g, " ")).toBe("1 248,50 € · Pro · 🇫🇷 France");
  });

  it("writes changes of recurring revenue in the screen's metric", () => {
    const upgrade = movement({ kind: "expansion", amount: 2_000, country: null, planName: null });
    expect(pushContent(upgrade, context())).toEqual({ title: "Upgrade", body: "+$20 MRR" });
    expect(pushContent(upgrade, context({ metric: "arr" }))).toEqual({
      title: "Upgrade",
      body: "+$240 ARR",
    });
  });

  it("says why a subscription stopped counting, and when it ends", () => {
    const scheduled = movement({
      kind: "churn",
      amount: -4_900,
      churn: { reason: "scheduled", endsAt: "2026-10-29T12:00:00.000Z" },
    });
    expect(pushContent(scheduled, context())).toEqual({
      title: "Won’t renew",
      body: "-$49 MRR · Pro · 🇫🇷 France · Ends October 29",
    });
  });

  it("tells a payment for a Stripe Connect account apart, with the fee kept", () => {
    const connect = payment({ connect: { applicationFee: 490 }, country: null, planName: null });
    expect(pushContent(connect, context())).toEqual({
      title: "Payment for a connected account",
      body: "$49 · Your fee: $4.90",
    });
  });

  it("names a new customer when the screen shows names, else by where they come from", () => {
    const customer = (overrides: Parameters<typeof feedItem>[0]): Moment => ({
      id: "customer:1",
      kind: "customer",
      customer: feedItem({ kind: "customer", amount: 0, ...overrides }),
    });
    expect(pushContent(customer({ customerName: "Ada" }), context()).body).toBe("Ada · 🇫🇷 France");
    expect(pushContent(customer({}), context()).body).toBe("🇫🇷 France");
    expect(pushContent(customer({ country: null }), context()).body).toBe("Someone new");
  });

  it("sums up a burst", () => {
    const summary: Moment = {
      id: "summary:1",
      kind: "summary",
      accountId: "a1",
      events: ["payment", "subscription"],
      payments: 5,
      changes: 2,
      customers: 0,
      revenue: 24_500,
      mrrChange: 9_800,
    };
    expect(pushContent(summary, context())).toEqual({
      title: "Catching up",
      body: "$245 · +$98 MRR · 5 new payments · 2 subscription changes",
    });
  });

  it("celebrates a milestone, and names the next one", () => {
    const milestone: Moment = {
      id: "milestone:mrr:1000000",
      kind: "milestone",
      amount: 1_000_000,
      metric: "mrr",
      isGoal: false,
      accountId: null,
    };
    expect(pushContent(milestone, context())).toEqual({
      title: "🎉 New milestone",
      body: "$10K MRR · Next stop: $25K. Keep going.",
    });
    expect(pushContent({ ...milestone, isGoal: true }, context()).title).toBe("🎉 Goal reached");
  });

  it("names the account on screens showing several", () => {
    const accountNames = new Map([
      ["a1", "Acme"],
      ["a2", "Globex"],
    ]);
    expect(pushContent(payment(), context({ accountNames })).title).toBe("Acme · Payment received");
  });
});

describe("screen keys", () => {
  it("name a screen without giving its token away", () => {
    const key = screenKey("a-secret-token");
    expect(key).toMatch(/^[0-9a-f]{16}$/);
    expect(key).toBe(screenKey("a-secret-token"));
    expect(key).not.toBe(screenKey("another-token"));
  });
});
