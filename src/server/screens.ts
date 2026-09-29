import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, type Transaction } from "@/db";
import { screenAccounts, screens, stripeAccounts } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { NAME_MAX_LENGTH, nameSchema } from "@/lib/names";
import {
  parseScreenSettings,
  screenSettingsSchema,
  type ScreenSettings,
} from "@/lib/screens/settings";
import { hashScreenPassword } from "@/server/screen-access";

// Every function takes the workspace id resolved by `requireWorkspace()` and filters on it: a screen
// or a Stripe account of another workspace is treated exactly like one that does not exist. Input
// is validated by the actions, with the schemas below.

export interface LinkedAccount {
  id: string;
  name: string;
  livemode: boolean;
}

export interface Screen {
  id: string;
  name: string;
  publicToken: string;
  settings: ScreenSettings;
  accounts: LinkedAccount[];
  /** A password guards the screen's link. The password itself never leaves the server. */
  hasPassword: boolean;
  createdAt: Date;
}

/** A Stripe account that can be shown on a screen of the workspace. */
export interface AccountOption extends LinkedAccount {
  currency: string | null;
}

const screenNameSchema = nameSchema("Give the screen a name.");

/** The editor always saves the whole screen, so an auto-save is a single idempotent write. */
export const screenInputSchema = z.object({
  name: screenNameSchema,
  accountIds: z.array(z.uuid()).max(100),
  settings: screenSettingsSchema,
});

export type ScreenInput = z.infer<typeof screenInputSchema>;

/** Typed on a TV with a remote, often: a PIN will do. `null` removes it. */
export const screenPasswordSchema = z
  .string()
  .min(4, "Use at least 4 characters.")
  .max(128, "Use at most 128 characters.")
  .nullable();

export const newScreenSchema = z.object({
  name: screenNameSchema,
  /** The browser's time zone. Unknown values fall back to UTC. */
  timeZone: z.string().max(100),
});

const SCREEN_NOT_FOUND = { ok: false, error: "This screen doesn’t exist anymore." } as const;
const FOREIGN_ACCOUNTS = {
  ok: false,
  error: "Some of these Stripe accounts are not part of this workspace.",
} as const;

/**
 * 24 random bytes (192 bits), URL-safe. Anyone holding the token can watch the screen, so it must be
 * unguessable; regenerating it revokes every copy of the previous link.
 */
export function generatePublicToken(): string {
  return randomBytes(24).toString("base64url");
}

function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}

function inWorkspace(workspaceId: string, screenId: string): SQL | undefined {
  return and(eq(screens.id, screenId), eq(screens.workspaceId, workspaceId));
}

async function findScreens(where: SQL | undefined): Promise<Screen[]> {
  const rows = await db().query.screens.findMany({
    where,
    orderBy: [asc(screens.createdAt)],
    with: {
      screenAccounts: {
        with: { account: { columns: { id: true, name: true, livemode: true } } },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    publicToken: row.publicToken,
    // Tolerates settings saved by older versions instead of breaking the page.
    settings: parseScreenSettings(row.settings),
    accounts: row.screenAccounts
      .map(({ account }) => account)
      .sort((a, b) => a.name.localeCompare(b.name)),
    hasPassword: row.passwordHash !== null,
    createdAt: row.createdAt,
  }));
}

export function listScreens(workspaceId: string): Promise<Screen[]> {
  return findScreens(eq(screens.workspaceId, workspaceId));
}

export async function getScreen(workspaceId: string, screenId: string): Promise<Screen | null> {
  if (!isUuid(screenId)) return null;
  const [screen] = await findScreens(inWorkspace(workspaceId, screenId));
  return screen ?? null;
}

export async function listAccountOptions(workspaceId: string): Promise<AccountOption[]> {
  return db()
    .select({
      id: stripeAccounts.id,
      name: stripeAccounts.name,
      livemode: stripeAccounts.livemode,
      currency: stripeAccounts.defaultCurrency,
    })
    .from(stripeAccounts)
    .where(eq(stripeAccounts.workspaceId, workspaceId))
    .orderBy(asc(stripeAccounts.createdAt));
}

/** Whether every id is a Stripe account of the workspace. */
async function ownsAccounts(
  tx: Transaction,
  workspaceId: string,
  accountIds: readonly string[],
): Promise<boolean> {
  if (accountIds.length === 0) return true;
  const owned = await tx
    .select({ id: stripeAccounts.id })
    .from(stripeAccounts)
    .where(
      and(eq(stripeAccounts.workspaceId, workspaceId), inArray(stripeAccounts.id, accountIds)),
    );
  return owned.length === accountIds.length;
}

async function linkAccounts(tx: Transaction, screenId: string, accountIds: readonly string[]) {
  if (accountIds.length === 0) return;
  await tx.insert(screenAccounts).values(accountIds.map((accountId) => ({ screenId, accountId })));
}

/**
 * New screens show every Stripe account of the workspace, in the currency of `currencyFrom` (or of
 * the oldest account): a useful screen without touching a single setting.
 */
async function insertScreen(
  tx: Transaction,
  workspaceId: string,
  input: { name: string; timeZone: string; currencyFrom?: string },
): Promise<string> {
  const accounts = await tx
    .select({ id: stripeAccounts.id, currency: stripeAccounts.defaultCurrency })
    .from(stripeAccounts)
    .where(eq(stripeAccounts.workspaceId, workspaceId))
    .orderBy(asc(stripeAccounts.createdAt));
  const currencySource = accounts.find(({ id }) => id === input.currencyFrom) ?? accounts[0];
  const settings = parseScreenSettings({
    timeZone: input.timeZone,
    currency: currencySource?.currency?.toLowerCase() ?? undefined,
  });

  const [screen] = await tx
    .insert(screens)
    .values({ workspaceId, name: input.name, publicToken: generatePublicToken(), settings })
    .$returningId();
  await linkAccounts(
    tx,
    screen.id,
    accounts.map(({ id }) => id),
  );
  return screen.id;
}

export async function createScreen(
  workspaceId: string,
  input: z.infer<typeof newScreenSchema>,
): Promise<ActionResult<{ screenId: string }>> {
  const screenId = await db().transaction((tx) => insertScreen(tx, workspaceId, input));
  return { ok: true, screenId };
}

/**
 * Called right after a Stripe account is connected: the first screen of a workspace is created
 * automatically, named after the account, so a new user has something to put on the wall right away.
 * Returns the new screen id, or `null` when the workspace already has a screen.
 */
export async function createFirstScreen(
  workspaceId: string,
  input: { accountId: string; timeZone: string },
): Promise<string | null> {
  return db().transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: screens.id })
      .from(screens)
      .where(eq(screens.workspaceId, workspaceId))
      .limit(1);
    if (existing) return null;

    const [account] = await tx
      .select({ name: stripeAccounts.name })
      .from(stripeAccounts)
      .where(
        and(eq(stripeAccounts.id, input.accountId), eq(stripeAccounts.workspaceId, workspaceId)),
      );
    if (!account) return null;

    const name = screenNameSchema.catch("My screen").parse(account.name.slice(0, NAME_MAX_LENGTH));
    return insertScreen(tx, workspaceId, {
      name,
      timeZone: input.timeZone,
      currencyFrom: input.accountId,
    });
  });
}

export async function updateScreen(
  workspaceId: string,
  screenId: string,
  input: ScreenInput,
): Promise<ActionResult> {
  const { name, settings } = input;
  const accountIds = [...new Set(input.accountIds)];

  return db().transaction(async (tx): Promise<ActionResult> => {
    if (!(await ownsAccounts(tx, workspaceId, accountIds))) return FOREIGN_ACCOUNTS;

    const [{ affectedRows }] = await tx
      .update(screens)
      .set({ name, settings })
      .where(inWorkspace(workspaceId, screenId));
    if (!affectedRows) return SCREEN_NOT_FOUND;

    await tx.delete(screenAccounts).where(eq(screenAccounts.screenId, screenId));
    await linkAccounts(tx, screenId, accountIds);
    return { ok: true };
  });
}

/** Replaces the public token: every open copy of the previous link stops working. */
export async function regenerateScreenToken(
  workspaceId: string,
  screenId: string,
): Promise<ActionResult<{ publicToken: string }>> {
  const publicToken = generatePublicToken();
  const [{ affectedRows }] = await db()
    .update(screens)
    .set({ publicToken })
    .where(inWorkspace(workspaceId, screenId));
  return affectedRows ? { ok: true, publicToken } : SCREEN_NOT_FOUND;
}

/**
 * Sets the screen's password, or removes it with `null`. A new password locks out every device
 * that knew the previous one.
 */
export async function setScreenPassword(
  workspaceId: string,
  screenId: string,
  password: string | null,
): Promise<ActionResult> {
  const passwordHash = password === null ? null : await hashScreenPassword(password);
  const [{ affectedRows }] = await db()
    .update(screens)
    .set({ passwordHash })
    .where(inWorkspace(workspaceId, screenId));
  return affectedRows ? { ok: true } : SCREEN_NOT_FOUND;
}

/** Asks every open display of the screen to play a fake sale, to check sound and confetti. */
export async function sendTestEvent(workspaceId: string, screenId: string): Promise<ActionResult> {
  const [{ affectedRows }] = await db()
    .update(screens)
    .set({ testEventAt: sql`now(6)` })
    .where(inWorkspace(workspaceId, screenId));
  return affectedRows ? { ok: true } : SCREEN_NOT_FOUND;
}

export async function deleteScreen(workspaceId: string, screenId: string): Promise<ActionResult> {
  const [{ affectedRows }] = await db().delete(screens).where(inWorkspace(workspaceId, screenId));
  return affectedRows ? { ok: true } : SCREEN_NOT_FOUND;
}
