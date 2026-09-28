import { z } from "zod";
import { getDisplayStateByToken } from "@/server/display/state";
import { scheduleSync } from "@/server/sync";

const NO_STORE = { "Cache-Control": "no-store" };
const tokenSchema = z.string().min(1).max(256);

/**
 * Polled by wall displays every few seconds. Each poll also brings the screen's Stripe accounts
 * up to date, after the response is sent: no background worker is needed.
 */
export async function GET(_request: Request, context: RouteContext<"/api/screens/[token]/state">) {
  const token = tokenSchema.safeParse((await context.params).token);
  const state = token.success ? await getDisplayStateByToken(token.data) : null;
  if (!state) {
    return Response.json(
      { error: "This screen does not exist." },
      { status: 404, headers: NO_STORE },
    );
  }

  scheduleSync(state.accounts.map((account) => account.id));
  return Response.json(state, { headers: NO_STORE });
}
