"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { invalidInput, type ActionResult } from "@/lib/action-result";
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

  const result = await enableInstantUpdates(workspace.id, parsed.data);
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}

export async function saveWebhookSecretAction(
  accountId: string,
  secret: string,
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = z
    .object({ accountId: accountIdSchema, secret: webhookSigningSecretSchema })
    .safeParse({ accountId, secret });
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await setWebhookSigningSecret(
    workspace.id,
    parsed.data.accountId,
    parsed.data.secret,
  );
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}
