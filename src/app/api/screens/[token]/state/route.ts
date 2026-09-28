import { getRecentDisplayState } from "@/server/display/recent-state";
import { scheduleSync } from "@/server/sync";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Polled by wall displays every few seconds. Each poll also brings the screen's Stripe accounts
 * up to date, after the response is sent: no background worker is needed.
 */
export async function GET(_request: Request, context: RouteContext<"/api/screens/[token]/state">) {
  const recent = getRecentDisplayState((await context.params).token);
  const state = await recent.state;
  if (!state) {
    return Response.json(
      { error: "This screen does not exist." },
      { status: 404, headers: NO_STORE },
    );
  }

  // The poll that computed the state checks the accounts; polls sharing it have nothing to add.
  if (recent.computed) scheduleSync(state.accounts.map((account) => account.id));
  return Response.json(state, { headers: NO_STORE });
}
