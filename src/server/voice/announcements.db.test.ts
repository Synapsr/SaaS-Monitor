import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { payments } from "@/db/schema";
import type { ScreenSettingsInput } from "@/lib/screens/settings";
import type { AnnouncementRequest } from "@/lib/voice/request";
import { setScreenPassword } from "@/server/screens";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import { createStripeAccount } from "@/test/stripe-accounts";
import { screenAnnouncement } from "./announcements";
import { synthesize } from "./gradium";

// Gradium says the text back, as bytes: tests read what the voice would say.
vi.mock("./gradium", () => ({
  canSynthesize: () => true,
  synthesize: vi.fn(async ({ text }: { text: string }) => ({
    audio: new TextEncoder().encode(text).buffer,
    contentType: "audio/ogg",
  })),
}));

const device = new Headers({ "x-forwarded-for": "203.0.113.7" });
const personalized: ScreenSettingsInput = {
  showCustomerNames: true,
  voice: { enabled: true, personalized: true },
};

async function screenWithPayment(settings: ScreenSettingsInput = personalized) {
  const { workspaceId } = await createUserWithWorkspace();
  const account = await createStripeAccount(workspaceId, { status: "ready", backfill: null });
  const [payment] = await db()
    .insert(payments)
    .values({
      accountId: account.id,
      stripeChargeId: `ch_${crypto.randomUUID()}`,
      stripeCustomerId: "cus_grace",
      customerName: "Grace Hopper",
      customerCountry: "US",
      amount: 4_900,
      amountRefunded: 0,
      currency: "usd",
      occurredAt: new Date(),
      origin: "live",
    })
    .$returningId();
  const screen = await createScreen(workspaceId, { accountIds: [account.id], settings });
  return { workspaceId, ...screen, paymentId: `payment:${payment.id}` };
}

function paymentRequest(paymentId: string): AnnouncementRequest {
  return {
    moment: { kind: "payment", id: paymentId, paymentId },
    format: "opus",
  };
}

async function said(result: Awaited<ReturnType<typeof screenAnnouncement>>) {
  if (result.outcome !== "speech") throw new Error(`No speech: ${result.outcome}`);
  return new TextDecoder().decode(result.speech.audio);
}

describe("screen announcements", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.mocked(synthesize).mockClear();
  });

  it("say a payment of the screen in its default phrase, with the customer's name", async () => {
    const { token, paymentId } = await screenWithPayment();
    const result = await screenAnnouncement(token, paymentRequest(paymentId), device);
    expect(await said(result)).toBe("Grace Hopper just paid $49!");
  });

  it("say the screen's own phrases", async () => {
    const { token, paymentId } = await screenWithPayment({
      ...personalized,
      language: "fr",
      voice: { enabled: true, personalized: true, phrases: { payment: ["Merci {name} !"] } },
    });
    const result = await screenAnnouncement(token, paymentRequest(paymentId), device);
    expect(await said(result)).toBe("Merci Grace Hopper !");
  });

  it("synthesize a phrase once for every display of the screen", async () => {
    const { token, paymentId } = await screenWithPayment({
      ...personalized,
      voice: { enabled: true, personalized: true, phrases: { payment: ["Once, {name}."] } },
    });
    await Promise.all(
      [1, 2, 3].map(() => screenAnnouncement(token, paymentRequest(paymentId), device)),
    );
    expect(synthesize).toHaveBeenCalledTimes(1);
  });

  it("leave screens saying recorded phrases to their displays", async () => {
    const { token, paymentId } = await screenWithPayment({ voice: { enabled: true } });
    const result = await screenAnnouncement(token, paymentRequest(paymentId), device);
    expect(result.outcome).toBe("unavailable");
    expect(synthesize).not.toHaveBeenCalled();
  });

  it("leave the demo screen to its recorded phrases", async () => {
    const result = await screenAnnouncement("demo", paymentRequest("payment:demo-1"), device);
    expect(result.outcome).toBe("unavailable");
    expect(synthesize).not.toHaveBeenCalled();
  });

  it("only say what is on the screen", async () => {
    const { token } = await screenWithPayment();
    const other = await screenWithPayment();
    const result = await screenAnnouncement(token, paymentRequest(other.paymentId), device);
    expect(result.outcome).toBe("unknown-moment");
    expect((await screenAnnouncement("nope", paymentRequest("payment:1"), device)).outcome).toBe(
      "gone",
    );
  });

  it("ask for the password of a protected screen", async () => {
    const { workspaceId, id, token, paymentId } = await screenWithPayment();
    await setScreenPassword(workspaceId, id, "4321");
    const result = await screenAnnouncement(token, paymentRequest(paymentId), device);
    expect(result.outcome).toBe("locked");
  });
});
