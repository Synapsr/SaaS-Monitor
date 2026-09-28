"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { createFirstScreen } from "@/server/screens";
import { requireWorkspace } from "@/server/session";
import {
  connectStripeAccount,
  disconnectStripeAccount,
  enableInstantUpdates,
  reimportStripeAccount,
  renameStripeAccount,
  setWebhookSigningSecret,
} from "@/server/stripe/accounts";

const accountIdSchema = z.uuid();
const accountNameSchema = z
  .string()
  .trim()
  .min(1, "Name the account, for example after your product.")
  .max(60, "Keep the name under 60 characters.");

const connectSchema = z.object({
  name: accountNameSchema,
  secretKey: z
    .string()
    .trim()
    .regex(/^(rk|sk)_(live|test)_\S+$/, "Paste a Stripe key: it starts with rk_live_ or rk_test_.")
    .max(500),
  /** The browser's time zone, for the screen created with the first account. */
  timeZone: z.string().max(100),
});

export type ConnectAccountResult = { ok: false; error: string; missingPermissions?: string[] };

function invalid(error: z.ZodError): { ok: false; error: string } {
  return { ok: false, error: error.issues[0]?.message ?? "Some values are invalid." };
}

export async function connectAccountAction(
  input: z.input<typeof connectSchema>,
): Promise<ConnectAccountResult> {
  const { workspace } = await requireWorkspace();
  const parsed = connectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
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

/**
 * The data layer's account mutations throw when something unexpected happens: report it as a
 * result, so the page shows a message instead of an error screen.
 */
async function attempt(mutation: () => Promise<unknown>, failure: string): Promise<ActionResult> {
  try {
    await mutation();
  } catch (error) {
    console.error(failure, error);
    return { ok: false, error: failure };
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function renameAccountAction(accountId: string, name: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = z.object({ accountId: accountIdSchema, name: accountNameSchema }).safeParse({
    accountId,
    name,
  });
  if (!parsed.success) return invalid(parsed.error);
  return attempt(
    () => renameStripeAccount(workspace.id, parsed.data.accountId, parsed.data.name),
    "We couldn't rename this account. Please try again.",
  );
}

export async function reimportAccountAction(accountId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = accountIdSchema.safeParse(accountId);
  if (!parsed.success) return invalid(parsed.error);
  return attempt(
    () => reimportStripeAccount(workspace.id, parsed.data),
    "We couldn't start the import. Please try again.",
  );
}

export async function disconnectAccountAction(accountId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = accountIdSchema.safeParse(accountId);
  if (!parsed.success) return invalid(parsed.error);
  return attempt(
    () => disconnectStripeAccount(workspace.id, parsed.data),
    "We couldn't disconnect this account. Please try again.",
  );
}

export async function enableInstantUpdatesAction(accountId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = accountIdSchema.safeParse(accountId);
  if (!parsed.success) return invalid(parsed.error);

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
    .object({
      accountId: accountIdSchema,
      secret: z
        .string()
        .trim()
        .regex(/^whsec_\S+$/, "Paste the signing secret: it starts with whsec_.")
        .max(500),
    })
    .safeParse({ accountId, secret });
  if (!parsed.success) return invalid(parsed.error);

  const result = await setWebhookSigningSecret(
    workspace.id,
    parsed.data.accountId,
    parsed.data.secret,
  );
  if (result.ok) revalidatePath("/app", "layout");
  return result;
}
