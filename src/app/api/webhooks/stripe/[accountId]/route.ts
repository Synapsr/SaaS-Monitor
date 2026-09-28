import { z } from "zod";
import { receiveWebhook } from "@/server/stripe/webhooks";
import { scheduleSync } from "@/server/sync";

/** Stripe events are a few kilobytes; anything much larger is not from Stripe. */
const MAX_PAYLOAD_BYTES = 512 * 1024;

/**
 * Stripe calls this endpoint when something happens on a connected account. The event is only a
 * signal: the sync that follows reads it from the Events API, like when polling. Answers fast,
 * as Stripe expects, and syncs after the response.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/webhooks/stripe/[accountId]">,
) {
  const accountId = z.uuid().safeParse((await context.params).accountId);
  if (!accountId.success) return Response.json({ error: "Unknown account." }, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: "Payload too large." }, { status: 413 });
  }

  // The signature covers the raw body: it must be read as text, not parsed.
  const payload = await request.text();
  const reception = await receiveWebhook(
    accountId.data,
    payload,
    request.headers.get("stripe-signature"),
  );
  if (reception === "unknown_account") {
    return Response.json({ error: "Unknown account." }, { status: 404 });
  }
  if (reception === "invalid_signature") {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  scheduleSync([accountId.data]);
  return Response.json({ received: true });
}
