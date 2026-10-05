import { eq, isNotNull } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { payments, pushDevices } from "@/db/schema";
import { MINUTE_SECONDS } from "@/lib/durations";
import type { ScreenSettingsInput } from "@/lib/screens/settings";
import { syncAccount } from "@/server/sync/run";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import { createScreen } from "@/test/screens";
import { createStripeAccount } from "@/test/stripe-accounts";
import {
  monthlyPrice,
  stripeCharge,
  stripeCustomer,
  stripeItem,
  stripeSubscription,
} from "@/test/stripe-fixtures";
import { screenKey } from "./content";
import type { PushMessage, PushSender, PushTicket } from "./expo";
import { notifyPhones } from "./notify";

const IMPORTED_AT = new Date("2026-03-15T12:00:00Z");
const T0 = IMPORTED_AT.getTime() / 1000;
const at = (seconds: number) => new Date((T0 + seconds) * 1000);

const PHONE = "ExponentPushToken[phone]";

/** Expo, as tests see it: every batch sent, and the tokens it no longer knows. */
function fakeExpo({ unregistered = [] as string[], down = false } = {}) {
  const batches: PushMessage[][] = [];
  const send: PushSender = async (messages) => {
    if (down) throw new Error("Expo is down.");
    batches.push([...messages]);
    return messages.map((message): PushTicket =>
      unregistered.includes(message.to)
        ? {
            status: "error",
            message: "Not a registered push notification recipient",
            details: { error: "DeviceNotRegistered" },
          }
        : { status: "ok", id: crypto.randomUUID() },
    );
  };
  return { send, batches, sent: () => batches.flat() };
}

describe("phone notifications", () => {
  let stripe: FakeStripe;
  let workspaceId: string;
  let accountId: string;
  let expo: ReturnType<typeof fakeExpo>;

  const syncAt = (seconds: number) =>
    syncAccount(accountId, {
      createGateway: () => stripe,
      now: () => at(seconds),
      push: { send: expo.send },
    });

  /** A screen of the account, followed by `phones`. */
  async function followedScreen(phones: string[], settings: ScreenSettingsInput = {}) {
    const screen = await createScreen(workspaceId, { accountIds: [accountId], settings });
    for (const pushToken of phones) {
      await db().insert(pushDevices).values({ screenId: screen.id, pushToken, platform: "ios" });
    }
    return screen;
  }

  /** A customer subscribing and paying their first invoice, `atSeconds` after the import. */
  function checkout(id: string, amount: number, atSeconds: number, name = "Grace Hopper") {
    const customer = stripeCustomer({ id: `cus_${id}`, name, country: "US" });
    const subscription = stripe.putSubscription(
      stripeSubscription({
        id: `sub_${id}`,
        customer,
        start_date: T0 + atSeconds,
        items: [stripeItem({ price: monthlyPrice(amount) })],
      }),
    );
    stripe.emit("customer.subscription.created", subscription, T0 + atSeconds);
    const charge = stripe.putCharge(
      stripeCharge({
        id: `ch_${id}`,
        amount,
        created: T0 + atSeconds,
        customer: customer.id,
        billing_details: { name, address: { country: "US" } },
      }),
    );
    stripe.emit("charge.succeeded", charge, T0 + atSeconds);
  }

  /** Cancels a subscription at once, `atSeconds` after the import. */
  function cancel(id: string, atSeconds: number) {
    const subscription = stripe.updateSubscription(id, (current) => ({
      ...current,
      status: "canceled",
      ended_at: T0 + atSeconds,
    }));
    stripe.emit("customer.subscription.deleted", subscription, T0 + atSeconds);
  }

  /** A one-off payment, `atSeconds` after the import. */
  function pay(id: string, amount: number, atSeconds: number) {
    const charge = stripe.putCharge(
      stripeCharge({ id: `ch_${id}`, amount, created: T0 + atSeconds }),
    );
    stripe.emit("charge.succeeded", charge, T0 + atSeconds);
  }

  beforeEach(async () => {
    await resetDatabase();
    workspaceId = (await createUserWithWorkspace()).workspaceId;
    accountId = (await createStripeAccount(workspaceId, { now: IMPORTED_AT })).id;
    expo = fakeExpo();
    stripe = new FakeStripe();
    stripe.putProduct({ id: "prod_pro", name: "Pro" });
    stripe.putSubscription(
      stripeSubscription({
        id: "sub_ada",
        customer: stripeCustomer({ id: "cus_ada", name: "Ada Lovelace" }),
        start_date: T0 - 30 * 24 * 60 * 60,
        items: [stripeItem({ price: monthlyPrice(4_900) })],
      }),
    );
    await syncAt(0);
  });

  it("tells a new subscriber, then the payment that started it, like the screen does", async () => {
    const { token } = await followedScreen([PHONE]);
    checkout("grace", 2_900, MINUTE_SECONDS);

    await syncAt(2 * MINUTE_SECONDS);

    expect(expo.sent()).toEqual([
      {
        to: PHONE,
        title: "New subscriber",
        body: "+$29 MRR · Pro · 🇺🇸 United States",
        data: { type: "moment", screen: screenKey(token), event: "subscription" },
        sound: "default",
        priority: "high",
        channelId: "moments",
        interruptionLevel: "time-sensitive",
      },
      expect.objectContaining({
        title: "Payment received",
        body: "$29 · Pro · 🇺🇸 United States",
        data: { type: "moment", screen: screenKey(token), event: "payment" },
      }),
    ]);
  });

  it("never tells the same thing twice, however often syncs run", async () => {
    await followedScreen([PHONE]);
    pay("one", 4_900, MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);
    await syncAt(3 * MINUTE_SECONDS);
    await notifyPhones(accountId, { send: expo.send, now: at(4 * MINUTE_SECONDS) });

    expect(expo.sent()).toHaveLength(1);
    const notified = await db().select().from(payments).where(isNotNull(payments.notifiedAt));
    expect(notified).toHaveLength(1);
  });

  it("speaks the screen's language, and names customers only on screens showing names", async () => {
    await followedScreen([PHONE], { language: "de", showCustomerNames: true });
    checkout("grace", 2_900, MINUTE_SECONDS);

    await syncAt(2 * MINUTE_SECONDS);

    expect(expo.sent().map(({ title, body }) => ({ title, body }))).toEqual([
      { title: "Neuer Abonnent", body: expect.stringContaining("Grace Hopper") },
      { title: "Zahlung erhalten", body: expect.stringContaining("Grace Hopper") },
    ]);
  });

  it("only sends the events the screen sends to phones", async () => {
    await followedScreen([PHONE], { events: { payment: { push: false } } });
    checkout("grace", 2_900, MINUTE_SECONDS);
    // Losses stay off phones by default.
    cancel("sub_ada", MINUTE_SECONDS);

    await syncAt(2 * MINUTE_SECONDS);

    expect(expo.sent().map(({ data }) => data.event)).toEqual(["subscription"]);
  });

  it("sums up a burst in one notification per phone", async () => {
    await followedScreen([PHONE, "ExponentPushToken[other]"]);
    for (let index = 1; index <= 5; index += 1) pay(`burst${index}`, 1_000, index * 10);

    await syncAt(2 * MINUTE_SECONDS);

    expect(expo.batches).toHaveLength(1);
    expect(expo.sent()).toEqual([
      expect.objectContaining({ to: PHONE, title: "Catching up", body: "$50 · 5 new payments" }),
      expect.objectContaining({ to: "ExponentPushToken[other]", title: "Catching up" }),
    ]);
  });

  it("tells a phone following two screens of the account once, and names the screen", async () => {
    const first = await followedScreen([PHONE]);
    await followedScreen([PHONE]);
    pay("one", 4_900, MINUTE_SECONDS);

    await syncAt(2 * MINUTE_SECONDS);

    expect(expo.sent()).toEqual([
      expect.objectContaining({
        to: PHONE,
        data: expect.objectContaining({ screen: screenKey(first.token) }),
      }),
    ]);
  });

  it("celebrates a milestone once, even when MRR goes back and forth around it", async () => {
    await followedScreen([PHONE]);
    // $49 of MRR, and $60 more: $109, past the first milestone.
    checkout("grace", 6_000, MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);
    expect(expo.sent().at(-1)).toMatchObject({
      title: "🎉 New milestone",
      body: "$100 MRR · Next stop: $250. Keep going.",
      data: { event: "milestone" },
    });

    cancel("sub_grace", 3 * MINUTE_SECONDS);
    await syncAt(4 * MINUTE_SECONDS);
    checkout("alan", 6_000, 5 * MINUTE_SECONDS, "Alan Turing");
    await syncAt(6 * MINUTE_SECONDS);

    const milestones = expo.sent().filter(({ data }) => data.event === "milestone");
    expect(milestones).toHaveLength(1);
  });

  it("forgets the phones Expo no longer reaches", async () => {
    expo = fakeExpo({ unregistered: ["ExponentPushToken[gone]"] });
    const { id } = await followedScreen([PHONE, "ExponentPushToken[gone]"]);
    pay("one", 4_900, MINUTE_SECONDS);

    await syncAt(2 * MINUTE_SECONDS);

    const devices = await db()
      .select({ pushToken: pushDevices.pushToken })
      .from(pushDevices)
      .where(eq(pushDevices.screenId, id));
    expect(devices).toEqual([{ pushToken: PHONE }]);
  });

  it("never fails a sync, whatever happens to Expo", async () => {
    expo = fakeExpo({ down: true });
    await followedScreen([PHONE]);
    pay("one", 4_900, MINUTE_SECONDS);

    const report = await syncAt(2 * MINUTE_SECONDS);

    expect(report).toMatchObject({ ok: true, changes: 1 });
  });

  it("does not tell a phone what happened before it followed the screen", async () => {
    pay("before", 4_900, MINUTE_SECONDS);
    await syncAt(2 * MINUTE_SECONDS);
    await followedScreen([PHONE]);
    pay("after", 2_900, 3 * MINUTE_SECONDS);

    await syncAt(4 * MINUTE_SECONDS);

    expect(expo.sent().map(({ body }) => body)).toEqual(["$29 · 🇫🇷 France"]);
  });
});
