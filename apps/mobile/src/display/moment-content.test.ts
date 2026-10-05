import { displayLocale } from "@/contract/display/i18n";
import { defaultScreenSettings } from "@/contract/screens/settings";
import { describeMoment } from "@/display/moment-content";
import { displayState, feedItem } from "@/test/display";

const en = displayLocale("en");

describe("describeMoment", () => {
  it("announces a payment with its context", () => {
    const payment = feedItem({ amount: 4_900, planName: "Pro", country: "FR" });
    const content = describeMoment({ id: payment.id, kind: "payment", payment }, displayState(), en);
    expect(content).toMatchObject({
      eyebrow: "Payment received",
      headline: "$49",
      details: ["Pro", "🇫🇷 France"],
      tone: "celebration",
      account: null,
    });
  });

  it("writes subscription changes in the screen's metric", () => {
    const movement = feedItem({ id: "movement:1", kind: "new", amount: 9_900 });
    const state = displayState({
      screen: { name: "Office", settings: { ...defaultScreenSettings, metric: "arr" } },
    });
    const content = describeMoment({ id: movement.id, kind: "movement", movement }, state, en);
    expect(content).toMatchObject({ eyebrow: "New subscriber", headline: "+$1,188", metric: "ARR" });
  });

  it("says losses plainly, and why a subscription stops", () => {
    const movement = feedItem({
      id: "movement:2",
      kind: "churn",
      amount: -2_900,
      churn: { reason: "unpaid", endsAt: null },
    });
    const content = describeMoment(
      { id: movement.id, kind: "movement", movement },
      displayState(),
      en,
    );
    expect(content).toMatchObject({
      eyebrow: "Payment failed",
      headline: "-$29",
      footnote: "Unpaid after Stripe’s retries",
      tone: "calm",
    });
  });

  it("speaks the screen's language", () => {
    const payment = feedItem({ amount: 4_900, country: "DE" });
    const content = describeMoment(
      { id: payment.id, kind: "payment", payment },
      displayState(),
      displayLocale("fr"),
    );
    expect(content.eyebrow).toBe("Paiement reçu");
    expect(content.details).toContain("🇩🇪 Allemagne");
  });

  it("names the account on a screen of several", () => {
    const payment = feedItem({ accountId: "a2", accountName: "Acme Mail" });
    const state = displayState({
      accounts: [
        { id: "a1", name: "Acme", status: "ready", livemode: true },
        { id: "a2", name: "Acme Mail", status: "ready", livemode: true },
      ],
    });
    expect(describeMoment({ id: payment.id, kind: "payment", payment }, state, en).account).toBe(
      "Acme Mail",
    );
  });
});
