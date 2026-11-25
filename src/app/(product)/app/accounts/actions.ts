"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { stripeAccounts } from "@/db/schema";
import { invalidInput, type ActionResult } from "@/lib/action-result";
import { connectRevenueCatAccount, connectRevenueCatSchema } from "@/server/revenuecat/accounts";
import {
  enableRevenueCatInstantUpdates,
  revenueCatWebhookSecretSchema,
  setRevenueCatWebhookSecret,
} from "@/server/revenuecat/webhooks";
import { createFirstScreen } from "@/server/screens";
import { requireWorkspace } from "@/server/session";
import {
  accountNameSchema,
  connectAccountSchema,
  connectStripeAccount,
  disconnectStripeAccount,
  reimportStripeAccount,
  renameStripeAccount,
  type MissingPermissions,
} from "@/server/stripe/accounts";
import { ACCOUNT_NOT_FOUND } from "@/server/stripe/errors";
import {
  enableInstantUpdates,
  setWebhookSigningSecret,
  webhookSigningSecretSchema,
} from "@/server/stripe/webhooks";

const accountIdSchema = z.uuid();

const connectSchema = connectAccountSchema.extend({
  /** The browser's time zone, for the screen created with the first account. */
  timeZone: z.string().max(100),
});

const connectRevenueCatActionSchema = connectRevenueCatSchema.extend({
  /** The browser's time zone, for the screen created with the first account. */
  timeZone: z.string().max(100),
});

export async function connectAccountAction(
  input: z.input<typeof connectSchema>,
): Promise<ActionResult<object, MissingPermissions>> {
  const { workspace } = await requireWorkspace();
  const parsed = connectSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const { name, secretKey, timeZone } = parsed.data;

  const result = await connectStripeAccount({ workspaceId: workspace.id, name, secretKey });
  if (!result.ok) return result;

  // A brand new workspace gets its first screen right away: the last onboarding step is to
  // put it on a TV.
  const firstScreenId = await createFirstScreen(workspace.id, {
    accountId: result.accountId,
    timeZone,
  });
  revalidatePath("/app", "layout");
  redirect(firstScreenId ? "/app?onboarding=1" : "/app/accounts");
}

export async function connectRevenueCatAccountAction(
  input: z.input<typeof connectRevenueCatActionSchema>,
): Promise<ActionResult<object, MissingPermissions>> {
  const { workspace } = await requireWorkspace();
  const parsed = connectRevenueCatActionSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const { name, secretKey, projectId, timeZone } = parsed.data;

  const result = await connectRevenueCatAccount({
    workspaceId: workspace.id,
    name,
    secretKey,
    projectId,
  });
  if (!result.ok) return result;

  const firstScreenId = await createFirstScreen(workspace.id, {
    accountId: result.accountId,
    timeZone,
  });
  revalidatePath("/app", "layout");
  redirect(firstScreenId ? "/app?onboarding=1" : "/app/accounts");
}

export async function renameAccountAction(accountId: string, name: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = z.object({ accountId: accountIdSchema, name: accountNameSchema }).safeParse({
    accountId,
    name,
  });
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await renameStripeAccount(workspace.id, parsed.data.accountId, parsed.data.name);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function reimportAccountAction(accountId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = accountIdSchema.safeParse(accountId);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await reimportStripeAccount(workspace.id, parsed.data);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function disconnectAccountAction(accountId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = accountIdSchema.safeParse(accountId);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await disconnectStripeAccount(workspace.id, parsed.data);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function enableInstantUpdatesAction(accountId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = accountIdSchema.safeParse(accountId);
  if (!parsed.success) return invalidInput(parsed.error);

  const [account] = await db()
    .select({ provider: stripeAccounts.provider })
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.workspaceId, workspace.id), eq(stripeAccounts.id, parsed.data)));
  if (!account) return ACCOUNT_NOT_FOUND;

  const result =
    account.provider === "revenuecat"
      ? await enableRevenueCatInstantUpdates(workspace.id, parsed.data)
      : await enableInstantUpdates(workspace.id, parsed.data);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function saveWebhookSecretAction(
  accountId: string,
  secret: string,
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsedId = accountIdSchema.safeParse(accountId);
  if (!parsedId.success) return invalidInput(parsedId.error);

  const [account] = await db()
    .select({ provider: stripeAccounts.provider })
    .from(stripeAccounts)
    .where(and(eq(stripeAccounts.workspaceId, workspace.id), eq(stripeAccounts.id, parsedId.data)));
  if (!account) return ACCOUNT_NOT_FOUND;

  if (account.provider === "revenuecat") {
    const parsedSecret = revenueCatWebhookSecretSchema.safeParse(secret);
    if (!parsedSecret.success) return invalidInput(parsedSecret.error);
    const result = await setRevenueCatWebhookSecret(workspace.id, parsedId.data, parsedSecret.data);
    if (result.ok) revalidatePath("/app", "layout");
    return result;
  }

  const parsedSecret = webhookSigningSecretSchema.safeParse(secret);
  if (!parsedSecret.success) return invalidInput(parsedSecret.error);

  const result = await setWebhookSigningSecret(workspace.id, parsedId.data, parsedSecret.data);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}
