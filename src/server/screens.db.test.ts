import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { screens, stripeAccounts } from "@/db/schema";
import { defaultScreenSettings } from "@/lib/screens/settings";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import {
  createFirstScreen,
  createScreen,
  deleteScreen,
  generatePublicToken,
  getScreen,
  listScreens,
  regenerateScreenToken,
  sendTestEvent,
  updateScreen,
} from "./screens";

async function createStripeAccount(workspaceId: string, name: string, currency = "usd") {
  const [account] = await db()
    .insert(stripeAccounts)
    .values({
      workspaceId,
      name,
      livemode: true,
      encryptedSecretKey: "encrypted",
      secretKeyHint: "rk_live_…test",
      defaultCurrency: currency,
    })
    .returning({ id: stripeAccounts.id });
  return account.id;
}

async function createScreenIn(workspaceId: string, name = "Office TV") {
  const result = await createScreen(workspaceId, { name, timeZone: "Europe/Paris" });
  if (!result.ok) throw new Error(result.error);
  return result.screenId;
}

describe("screens", () => {
  beforeEach(resetDatabase);

  it("generates unguessable, URL-safe public tokens", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generatePublicToken));
    expect(tokens.size).toBe(1000);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it("creates a screen showing every account of the workspace", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    await createStripeAccount(workspaceId, "Acme", "eur");
    await createStripeAccount(workspaceId, "Beta", "usd");

    const screen = await getScreen(workspaceId, await createScreenIn(workspaceId));

    expect(screen).toMatchObject({
      name: "Office TV",
      accounts: [{ name: "Acme" }, { name: "Beta" }],
      settings: { ...defaultScreenSettings, currency: "eur", timeZone: "Europe/Paris" },
    });
  });

  it("creates the first screen once, named after the connected account", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    await createStripeAccount(workspaceId, "Acme", "usd");
    const accountId = await createStripeAccount(workspaceId, "Beta", "gbp");

    const screenId = await createFirstScreen(workspaceId, { accountId, timeZone: "Not/AZone" });
    expect(await getScreen(workspaceId, screenId!)).toMatchObject({
      name: "Beta",
      accounts: [{ name: "Acme" }, { name: "Beta" }],
      settings: { currency: "gbp", timeZone: "UTC" },
    });
    expect(await createFirstScreen(workspaceId, { accountId, timeZone: "UTC" })).toBeNull();
  });

  it("never exposes a screen to another workspace", async () => {
    const owner = await createUserWithWorkspace("Ada");
    const intruder = await createUserWithWorkspace("Eve");
    const screenId = await createScreenIn(owner.workspaceId);
    const input = { name: "Hijacked", accountIds: [], settings: defaultScreenSettings };

    expect(await getScreen(intruder.workspaceId, screenId)).toBeNull();
    expect(await listScreens(intruder.workspaceId)).toEqual([]);
    for (const result of [
      await updateScreen(intruder.workspaceId, screenId, input),
      await regenerateScreenToken(intruder.workspaceId, screenId),
      await sendTestEvent(intruder.workspaceId, screenId),
      await deleteScreen(intruder.workspaceId, screenId),
    ]) {
      expect(result).toEqual({ ok: false, error: "This screen doesn’t exist anymore." });
    }
    expect(await getScreen(owner.workspaceId, screenId)).toMatchObject({ name: "Office TV" });
    const [row] = await db()
      .select({ testEventAt: screens.testEventAt })
      .from(screens)
      .where(eq(screens.id, screenId));
    expect(row.testEventAt).toBeNull();
  });

  it("refuses to show another workspace's Stripe account", async () => {
    const owner = await createUserWithWorkspace("Ada");
    const other = await createUserWithWorkspace("Eve");
    const ownAccount = await createStripeAccount(owner.workspaceId, "Acme");
    const foreignAccount = await createStripeAccount(other.workspaceId, "Secret revenue");
    const screenId = await createScreenIn(owner.workspaceId);

    const result = await updateScreen(owner.workspaceId, screenId, {
      name: "Office TV",
      accountIds: [ownAccount, foreignAccount],
      settings: defaultScreenSettings,
    });

    expect(result.ok).toBe(false);
    expect((await getScreen(owner.workspaceId, screenId))?.accounts).toEqual([
      { id: ownAccount, name: "Acme", livemode: true },
    ]);
  });

  it("saves the whole screen", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const accountId = await createStripeAccount(workspaceId, "Acme");
    const screenId = await createScreenIn(workspaceId);
    const settings = {
      ...defaultScreenSettings,
      goal: 25_000,
      accent: "violet" as const,
      sound: { ...defaultScreenSettings.sound, volume: 0.3 },
    };

    expect(
      await updateScreen(workspaceId, screenId, {
        name: "Lobby",
        accountIds: [accountId, accountId],
        settings,
      }),
    ).toEqual({ ok: true });
    expect(await getScreen(workspaceId, screenId)).toMatchObject({
      name: "Lobby",
      accounts: [{ id: accountId, name: "Acme" }],
      settings,
    });
  });

  it("regenerates the public token, revoking the old link", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const screenId = await createScreenIn(workspaceId);
    const before = (await getScreen(workspaceId, screenId))!.publicToken;

    const result = await regenerateScreenToken(workspaceId, screenId);

    expect(result.ok && result.publicToken).not.toBe(before);
    expect(await db().select().from(screens).where(eq(screens.publicToken, before))).toEqual([]);
  });

  it("records test celebrations", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const screenId = await createScreenIn(workspaceId);

    const result = await sendTestEvent(workspaceId, screenId);

    expect(result.ok).toBe(true);
    const [{ testEventAt }] = await db()
      .select({ testEventAt: screens.testEventAt })
      .from(screens)
      .where(eq(screens.id, screenId));
    expect(Math.abs(testEventAt!.getTime() - Date.now())).toBeLessThan(5_000);
  });

  it("deletes screens and ignores malformed ids", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    const screenId = await createScreenIn(workspaceId);

    expect(await getScreen(workspaceId, "not-a-uuid")).toBeNull();
    expect(await deleteScreen(workspaceId, screenId)).toEqual({ ok: true });
    expect(await listScreens(workspaceId)).toEqual([]);
  });
});
