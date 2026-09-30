import { beforeEach, describe, expect, it } from "vitest";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createStripeAccount } from "@/test/stripe-accounts";
import { asksForStar } from "./star-prompt";

describe("star prompt", () => {
  beforeEach(resetDatabase);

  it("waits for a self-hosted workspace to connect Stripe", async () => {
    const { workspaceId } = await createUserWithWorkspace();
    expect(await asksForStar(workspaceId)).toBe(false);

    await createStripeAccount(workspaceId);
    expect(await asksForStar(workspaceId)).toBe(true);
  });
});
