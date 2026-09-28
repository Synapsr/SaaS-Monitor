import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { members } from "@/db/schema";
import { createUserWithWorkspace, resetDatabase } from "./db";

describe("test database helpers", () => {
  beforeEach(resetDatabase);

  it("creates a user owning a workspace", async () => {
    const { userId, workspaceId } = await createUserWithWorkspace();
    const [membership] = await db().select().from(members).where(eq(members.userId, userId));
    expect(membership).toMatchObject({ organizationId: workspaceId, role: "owner" });
  });

  it("starts every test from an empty database", async () => {
    expect(await db().select().from(members)).toEqual([]);
  });
});
