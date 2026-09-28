import "server-only";
import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/server/auth";
import { authFailure } from "@/server/members";

/** Renames the signed-in user. Better Auth also refreshes the session cookie holding the name. */
export async function updateProfile(requestHeaders: Headers, name: string): Promise<ActionResult> {
  try {
    await auth().api.updateUser({ headers: requestHeaders, body: { name } });
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}
