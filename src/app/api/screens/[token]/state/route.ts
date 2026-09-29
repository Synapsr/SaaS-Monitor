import { getRecentDisplayState } from "@/server/display/recent-state";
import { canViewScreen, findScreenLock } from "@/server/screen-access";
import { scheduleSync } from "@/server/sync";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Polled by wall displays every few seconds. Each poll also brings the screen's Stripe accounts
 * up to date, after the response is sent: no background worker is needed.
 */
export async function GET(request: Request, context: RouteContext<"/api/screens/[token]/state">) {
  const { token } = await context.params;
  // Checked on every poll: a new password locks open displays out at once.
  const lock = await findScreenLock(token);
  if (lock && !(await canViewScreen(lock, request.headers))) {
    return Response.json(
      { error: "This screen asks for its password." },
      { status: 401, headers: NO_STORE },
    );
  }

  const recent = getRecentDisplayState(token);
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
