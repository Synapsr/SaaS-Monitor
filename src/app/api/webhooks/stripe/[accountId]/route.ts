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
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Invalid signature." }, { status: 400 });

  // The signature covers the raw body: it must be read as text, not parsed.
  const payload = await readBody(request, MAX_PAYLOAD_BYTES);
  if (payload === null) return Response.json({ error: "Payload too large." }, { status: 413 });

  const reception = await receiveWebhook(accountId.data, payload, signature);
  if (reception === "unknown_account") {
    return Response.json({ error: "Unknown account." }, { status: 404 });
  }
  if (reception === "invalid_signature") {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  scheduleSync([accountId.data]);
  return Response.json({ received: true });
}

/**
 * Reads the body as text, or returns `null` as soon as it exceeds `maxBytes`. The declared
 * `Content-Length` cannot be trusted (chunked requests have none): count what actually arrives.
 */
async function readBody(request: Request, maxBytes: number): Promise<string | null> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    size += chunk.value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(chunk.value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
