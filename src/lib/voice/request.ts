import { z } from "zod";
import type { Moment } from "@/lib/display/moments";
import type { DisplayState, FeedItem } from "@/lib/display/types";
import { METRICS } from "@/lib/screens/settings";

/**
 * How a display asks its server to say a moment (`POST /api/screens/:token/announcement`). It
 * names the moment, not what to say: the server finds its items in the screen's own state and
 * writes the phrase, so a screen's link can't make the voice say anything else.
 */

const itemId = z.string().min(1).max(100);

export const announcementRequestSchema = z.object({
  moment: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("payment"), id: z.string().max(200), paymentId: itemId }),
    z.object({ kind: z.literal("movement"), id: z.string().max(200), movementId: itemId }),
    z.object({ kind: z.literal("customer"), id: z.string().max(200), customerId: itemId }),
    z.object({
      kind: z.literal("milestone"),
      id: z.string().max(200),
      amount: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      metric: z.enum(METRICS),
      isGoal: z.boolean(),
      accountId: itemId.nullable(),
    }),
    z.object({ kind: z.literal("test"), id: z.string().max(200) }),
  ]),
  /** Ogg Opus, a tenth of the size, where the browser decodes it; WAV everywhere. */
  format: z.enum(["opus", "wav"]),
});

export type AnnouncementRequest = z.infer<typeof announcementRequestSchema>;

/** What a display sends for a moment; `null` for one no voice announces. */
export function momentRequest(moment: Moment): AnnouncementRequest["moment"] | null {
  switch (moment.kind) {
    case "payment":
      return { kind: "payment", id: moment.id, paymentId: moment.payment.id };
    case "movement":
      return { kind: "movement", id: moment.id, movementId: moment.movement.id };
    case "customer":
      return { kind: "customer", id: moment.id, customerId: moment.customer.id };
    case "milestone": {
      const { id, amount, metric, isGoal, accountId } = moment;
      return { kind: "milestone", id, amount, metric, isGoal, accountId };
    }
    case "test":
      return { kind: "test", id: moment.id };
    case "summary":
      return null;
  }
}

/**
 * The moment a display asks about, rebuilt from the screen's state; `null` when its items are not
 * in the screen's feed (anymore) or are not what they claim.
 */
export function requestedMoment(
  request: AnnouncementRequest["moment"],
  state: DisplayState,
): Moment | null {
  const find = (id: string, accepts: (item: FeedItem) => boolean) => {
    const item = state.feed.find((candidate) => candidate.id === id);
    return item && accepts(item) ? item : null;
  };
  const isMovement = (item: FeedItem) => item.kind !== "payment" && item.kind !== "customer";

  switch (request.kind) {
    case "payment": {
      const payment = find(request.paymentId, (item) => item.kind === "payment");
      return payment && { id: request.id, kind: "payment", payment };
    }
    case "movement": {
      const movement = find(request.movementId, isMovement);
      return movement && { id: request.id, kind: "movement", movement };
    }
    case "customer": {
      const customer = find(request.customerId, (item) => item.kind === "customer");
      return customer && { id: request.id, kind: "customer", customer };
    }
    case "milestone": {
      const { accountId } = request;
      if (accountId !== null && !state.accounts.some((account) => account.id === accountId)) {
        return null;
      }
      return { ...request, kind: "milestone" };
    }
    case "test":
      return { id: request.id, kind: "test" };
  }
}
