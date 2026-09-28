import { db } from "@/db";
import { screenAccounts, screens } from "@/db/schema";
import { screenSettingsSchema, type ScreenSettingsInput } from "@/lib/screens/settings";

/** A screen of `workspaceId` showing `accountIds`, reachable at `/d/<token>`. */
export async function createScreen(
  workspaceId: string,
  {
    accountIds = [],
    settings = {},
    testEventAt = null,
  }: { accountIds?: string[]; settings?: ScreenSettingsInput; testEventAt?: Date | null } = {},
) {
  const token = crypto.randomUUID();
  const [screen] = await db()
    .insert(screens)
    .values({
      workspaceId,
      name: "Office TV",
      publicToken: token,
      settings: screenSettingsSchema.parse(settings),
      testEventAt,
    })
    .$returningId();
  if (accountIds.length) {
    await db()
      .insert(screenAccounts)
      .values(accountIds.map((accountId) => ({ screenId: screen.id, accountId })));
  }
  return { id: screen.id, token };
}
