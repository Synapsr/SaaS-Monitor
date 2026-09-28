import { after } from "next/server";
import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { encryptSecret } from "@/server/crypto";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { createStripeAccount, getStripeAccount } from "@/test/stripe-accounts";
import { POST } from "./route";

vi.mock("next/server", () => ({ after: vi.fn() }));

const SECRET = "whsec_test0123456789abcdefghijklmnop";
const payload = JSON.stringify({ id: "evt_1", object: "event", type: "charge.succeeded" });

function webhook(accountId: string, body: string, signature: string | null) {
  const request = new Request(`http://localhost/api/webhooks/stripe/${accountId}`, {
    method: "POST",
    body,
    headers: signature ? { "stripe-signature": signature } : {},
  });
  return POST(request, { params: Promise.resolve({ accountId }) });
}

describe("Stripe webhook endpoint", () => {
  let accountId: string;

  beforeEach(async () => {
    vi.mocked(after).mockClear();
    await resetDatabase();
    const { workspaceId } = await createUserWithWorkspace();
    accountId = (
      await createStripeAccount(workspaceId, {
        status: "ready",
        backfill: null,
        encryptedWebhookSecret: encryptSecret(SECRET),
      })
    ).id;
  });

  it("flags the account for a sync when the signature is valid", async () => {
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });

    const response = await webhook(accountId, payload, signature);

    expect(response.status).toBe(200);
    const account = await getStripeAccount(accountId);
    expect(account.syncRequestedAt).toBeInstanceOf(Date);
    expect(account.lastWebhookAt).toEqual(account.syncRequestedAt);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("rejects payloads not signed with the account's secret", async () => {
    const forged = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_someoneelse0123456789abcdefgh",
    });

    expect((await webhook(accountId, payload, forged)).status).toBe(400);
    expect((await webhook(accountId, payload, null)).status).toBe(400);
    expect((await getStripeAccount(accountId)).syncRequestedAt).toBeNull();
    expect(after).not.toHaveBeenCalled();
  });

  it("rejects a payload altered after signing", async () => {
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });

    expect((await webhook(accountId, payload.replace("evt_1", "evt_2"), signature)).status).toBe(
      400,
    );
  });

  it("does not know other accounts", async () => {
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });

    expect((await webhook(crypto.randomUUID(), payload, signature)).status).toBe(404);
    expect((await webhook("not-an-id", payload, signature)).status).toBe(404);
  });
});
