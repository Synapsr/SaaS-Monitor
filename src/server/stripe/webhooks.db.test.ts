import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { FakeStripe } from "@/test/fake-stripe";
import { getStripeAccount } from "@/test/stripe-accounts";
import { connectStripeAccount, enableInstantUpdates } from "./accounts";
import { secretKeySchema } from "./keys";

vi.mock("next/server", () => ({ after: vi.fn() }));

// APP_URL keeps its default here, http://localhost:3000: Stripe could not reach it.
describe("instant updates on a private address", () => {
  let stripe: FakeStripe;
  let workspaceId: string;

  beforeEach(async () => {
    await resetDatabase();
    ({ workspaceId } = await createUserWithWorkspace());
    stripe = new FakeStripe();
  });

  it("connects without a webhook and explains why instant updates are unavailable", async () => {
    const options = { createGateway: () => stripe };
    const result = await connectStripeAccount(
      {
        workspaceId,
        name: "Acme",
        secretKey: secretKeySchema.parse("rk_test_51AbCdEfGhIjKlMnOp4f2a"),
      },
      options,
    );
    if (!result.ok) throw new Error(result.error);

    expect(stripe.webhookEndpoints.size).toBe(0);
    expect((await getStripeAccount(result.accountId)).webhookEndpointId).toBeNull();
    expect(await enableInstantUpdates(workspaceId, result.accountId, options)).toEqual({
      ok: false,
      error:
        "Stripe can only send updates to a public HTTPS address. Set APP_URL to the public URL of this app.",
    });
  });
});
