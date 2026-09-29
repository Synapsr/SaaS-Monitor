"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { unlockScreen } from "@/server/screen-access";

/** Why a password did not open the screen, for its lock to say in its language. */
export type UnlockError = "wrong-password" | "too-many-attempts";

/** Opens a screen guarded by a password, on this device, from now on. */
export async function unlockScreenAction(
  token: string,
  _previous: UnlockError | null,
  formData: FormData,
): Promise<UnlockError | null> {
  const password = z.string().max(128).catch("").parse(formData.get("password"));
  const result = await unlockScreen(token, password, await headers());
  if (result.outcome === "wrong-password" || result.outcome === "too-many-attempts") {
    return result.outcome;
  }
  if (result.outcome === "unlocked" && result.cookie) {
    const { name, value, options } = result.cookie;
    (await cookies()).set(name, value, options);
  }
  // Unlocked, or gone meanwhile: the screen's page shows what comes next.
  redirect(`/d/${encodeURIComponent(token)}`);
}
