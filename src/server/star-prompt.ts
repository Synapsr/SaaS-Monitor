import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stripeAccounts } from "@/db/schema";
import { env } from "@/env";
import { isHostedInstance } from "@/lib/site";

/**
 * Whether the dashboard may ask for a star on GitHub: on a self-hosted instance, unless
 * `DISABLE_STAR_PROMPT`, and once the workspace connected Stripe and saw what it gets.
 */
export async function asksForStar(workspaceId: string): Promise<boolean> {
  const { APP_URL, DISABLE_STAR_PROMPT } = env();
  if (DISABLE_STAR_PROMPT || isHostedInstance(APP_URL)) return false;
  const [account] = await db()
    .select({ id: stripeAccounts.id })
    .from(stripeAccounts)
    .where(eq(stripeAccounts.workspaceId, workspaceId))
    .limit(1);
  return account !== undefined;
}
