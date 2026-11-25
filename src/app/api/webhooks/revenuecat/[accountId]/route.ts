import { after } from "next/server";
import { z } from "zod";
import { notifyPhones } from "@/server/push/notify";
import { receiveRevenueCatWebhook } from "@/server/revenuecat/webhooks";
import { scheduleSync } from "@/server/sync";

/** RevenueCat webhook events are a few kilobytes; reject oversized payloads early. */
const MAX_PAYLOAD_BYTES = 512 * 1024;

/**
 * RevenueCat calls this endpoint when a subscription or purchase event happens on a connected
 * project. Live events are recorded immediately so wall screens and phones celebrate within
 * seconds, then a sync keeps overview and chart aggregates aligned.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/webhooks/revenuecat/[accountId]">,
) {
  const accountId = z.uuid().safeParse((await context.params).accountId);
  if (!accountId.success) return Response.json({ error: "Unknown account." }, { status: 404 });

  const signature = request.headers.get("x-revenuecat-webhook-signature");
  const authorization = request.headers.get("authorization");
  if (!signature && !authorization) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = await readBody(request, MAX_PAYLOAD_BYTES);
  if (payload === null) return Response.json({ error: "Payload too large." }, { status: 413 });

  const outcome = await receiveRevenueCatWebhook(accountId.data, payload, {
    signature,
    authorization,
  });
  if (outcome.status === "unknown_account") {
    return Response.json({ error: "Unknown account." }, { status: 404 });
  }
  if (outcome.status === "invalid_signature") {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }
  if (outcome.status === "invalid_payload") {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (outcome.notify) {
    const id = accountId.data;
    after(() =>
      notifyPhones(id).catch((error: unknown) => {
        console.warn("[push] Could not notify phones after RevenueCat webhook:", error);
      }),
    );
  }
  if (outcome.sync) {
    scheduleSync([accountId.data]);
  }
  return Response.json({ received: true });
}

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
