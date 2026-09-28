import "server-only";
import type { DisplayState } from "@/lib/display/types";

/** Everything a wall display shows, or `null` when no screen uses this token. */
export async function getDisplayStateByToken(token: string): Promise<DisplayState | null> {
  void token;
  throw new Error("getDisplayStateByToken is not implemented yet.");
}
