import "server-only";
import type { DisplayState } from "@/lib/display/types";
import type { Screen } from "@/server/screens";
import { getRecentDisplayState } from "./recent-state";

/**
 * What the dashboard's screens show right now, for their previews: the display state of each,
 * by screen id, computed side by side and shared with the walls polling them. Reads the database
 * only, never Stripe. Screens come from `listScreens(workspaceId)`, so their tokens are the
 * workspace's own. A screen without a Stripe account needs no state: its preview asks for one.
 *
 * The promises never reject: a state that fails is `null`, and its preview says so while the rest
 * of the page renders.
 */
export function loadDisplayStates(
  screens: readonly Pick<Screen, "id" | "publicToken" | "accounts">[],
): Map<string, Promise<DisplayState | null>> {
  return new Map(
    screens
      .filter((screen) => screen.accounts.length > 0)
      .map((screen) => [
        screen.id,
        getRecentDisplayState(screen.publicToken).state.catch((error: unknown) => {
          console.error(`[screens] Could not load the state of screen ${screen.id}:`, error);
          return null;
        }),
      ]),
  );
}
