import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { pushDevices, screens } from "@/db/schema";
import { sendTestEvent } from "@/server/screens";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createScreen } from "@/test/screens";
import type { ApnsNotification } from "./apns";
import { screenKey } from "./content";
import type { ExpoMessage } from "./expo";
import type { PushTransports } from "./transports";

// This instance synthesizes the phrases of screens that write their own.
vi.mock("@/server/voice/gradium", () => ({ canSynthesize: () => true }));

const IPHONE = "ab".repeat(32);

/** Apple and Expo, remembering what they were sent; Expo may be down. */
function fakeTransports({ expoDown = false } = {}) {
  const sent = { apns: [] as ApnsNotification[], expo: [] as ExpoMessage[] };
  const transports: PushTransports = {
    apns: async (notification) => {
      sent.apns.push(notification);
      return { status: "sent" };
    },
    fcm: null,
    expo: async (messages) => {
      if (expoDown) throw new Error("Expo is down.");
      sent.expo.push(...messages);
      return messages.map(() => ({ status: "ok" as const, id: "ticket" }));
    },
  };
  return { transports, sent };
}

type Phone = Partial<typeof pushDevices.$inferInsert>;

async function followedScreen(phones: Phone[]) {
  const { workspaceId } = await createUserWithWorkspace();
  const screen = await createScreen(workspaceId, { settings: { language: "fr" } });
  for (const phone of phones) {
    await db()
      .insert(pushDevices)
      .values({
        screenId: screen.id,
        installationId: crypto.randomUUID(),
        platform: "ios",
        ...phone,
      });
  }
  return { workspaceId, ...screen };
}

describe("test celebrations on phones", () => {
  beforeEach(resetDatabase);

  it("notify every phone that follows the screen, whatever it muted, in the screen's words", async () => {
    const { workspaceId, id, token } = await followedScreen([
      { pushToken: "ExponentPushToken[a]", mutedEvents: ["payment"] },
      { pushToken: "ExponentPushToken[b]", deviceToken: IPHONE },
    ]);
    const { transports, sent } = fakeTransports();

    const result = await sendTestEvent(workspaceId, id, { transports });

    expect(result).toEqual({ ok: true, phones: 2 });
    const data = { type: "test", screen: screenKey(token), event: "payment" };
    // A test plays as a payment, like on the screen's displays.
    const audio = { sound: { pack: "register", event: "payment", volume: 0.7 }, voice: null };
    expect(sent.expo).toEqual([
      expect.objectContaining({
        to: "ExponentPushToken[a]",
        title: "Célébration de test",
        body: expect.any(String),
        data: { ...data, audio },
        mutableContent: true,
      }),
    ]);
    expect(sent.apns).toEqual([
      expect.objectContaining({
        deviceToken: IPHONE,
        payload: expect.objectContaining({
          ...data,
          aps: expect.objectContaining({ "mutable-content": 1 }),
          body: { ...data, audio },
        }),
      }),
    ]);
  });

  it("say the test as the screen's displays do", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const screen = await createScreen(workspaceId, {
      settings: { language: "fr", voice: { enabled: true, personalized: true } },
    });
    await db().insert(pushDevices).values({
      screenId: screen.id,
      installationId: crypto.randomUUID(),
      platform: "ios",
      pushToken: "ExponentPushToken[a]",
    });
    const { transports, sent } = fakeTransports();

    await sendTestEvent(workspaceId, screen.id, { transports });

    const [{ testEventAt }] = await db()
      .select({ testEventAt: screens.testEventAt })
      .from(screens)
      .where(eq(screens.id, screen.id));
    expect(sent.expo[0].data.audio?.voice).toEqual({
      id: "maelys",
      phrase: "payment",
      volume: 0.8,
      delayMs: 900,
      // The moment of the screen's displays (`DisplayState.testEvent`), in the screen's words.
      announcement: { kind: "test", id: `test:${testEventAt?.toISOString()}` },
    });
  });

  it("leave the phones that turned the screen off alone", async () => {
    const { workspaceId, id } = await followedScreen([
      { pushToken: "ExponentPushToken[off]", enabled: false },
    ]);
    const { transports, sent } = fakeTransports();

    expect(await sendTestEvent(workspaceId, id, { transports })).toEqual({ ok: true, phones: 0 });
    expect(sent.expo).toEqual([]);
  });

  it("never fail the test when phones cannot be reached", async () => {
    const { workspaceId, id } = await followedScreen([{ pushToken: "ExponentPushToken[a]" }]);
    const { transports } = fakeTransports({ expoDown: true });

    expect(await sendTestEvent(workspaceId, id, { transports })).toEqual({ ok: true, phones: 0 });
    const [{ testEventAt }] = await db()
      .select({ testEventAt: screens.testEventAt })
      .from(screens)
      .where(eq(screens.id, id));
    expect(testEventAt).not.toBeNull();
  });

  it("can only be sent so often", async () => {
    const { workspaceId, id } = await followedScreen([{ pushToken: "ExponentPushToken[a]" }]);
    const { transports, sent } = fakeTransports();
    for (let click = 0; click < 10; click += 1) {
      expect((await sendTestEvent(workspaceId, id, { transports })).ok).toBe(true);
    }

    expect(await sendTestEvent(workspaceId, id, { transports })).toEqual({
      ok: false,
      error: "Too many test celebrations at once. Try again in a few minutes.",
    });
    expect(sent.expo).toHaveLength(10);
  });
});
