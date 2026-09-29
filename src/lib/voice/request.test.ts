import { describe, expect, it } from "vitest";
import type { Moment } from "@/lib/display/moments";
import { displayState, feedItem } from "@/test/display";
import { announcementRequestSchema, momentRequest, requestedMoment } from "./request";

const payment = feedItem({ id: "payment:1", kind: "payment" });
const subscription = feedItem({ id: "movement:1", kind: "new" });
const customer = feedItem({ id: "customer:1", kind: "customer", amount: 0 });
const state = displayState({ feed: [payment, subscription, customer] });

function roundTrip(moment: Moment) {
  const request = momentRequest(moment);
  if (!request) return null;
  const parsed = announcementRequestSchema.parse({ moment: request, format: "opus" });
  return requestedMoment(parsed.moment, state);
}

describe("announcement requests", () => {
  it("name a moment the server rebuilds from the screen's own feed", () => {
    const moments: Moment[] = [
      { id: "payment:1", kind: "payment", payment, movement: subscription },
      { id: "movement:1", kind: "movement", movement: subscription },
      { id: "customer:1", kind: "customer", customer },
      {
        id: "milestone:mrr:1000000",
        kind: "milestone",
        amount: 1_000_000,
        metric: "mrr",
        isGoal: true,
        accountId: "a1",
      },
      { id: "test:1", kind: "test" },
    ];
    for (const moment of moments) expect(roundTrip(moment)).toEqual(moment);
  });

  it("ignore items the screen doesn't show, or that are not what they claim", () => {
    const stranger = feedItem({ id: "payment:elsewhere", kind: "payment" });
    expect(roundTrip({ id: "p", kind: "payment", payment: stranger, movement: null })).toBeNull();
    expect(
      requestedMoment({ kind: "customer", id: "c", customerId: "payment:1" }, state),
    ).toBeNull();
    expect(
      requestedMoment(
        { kind: "payment", id: "p", paymentId: "payment:1", movementId: "customer:1" },
        state,
      ),
    ).toBeNull();
    expect(
      requestedMoment(
        {
          kind: "milestone",
          id: "m",
          amount: 100,
          metric: "mrr",
          isGoal: false,
          accountId: "someone-else",
        },
        state,
      ),
    ).toBeNull();
  });

  it("are not sent for the summary of a burst", () => {
    expect(
      momentRequest({
        id: "s",
        kind: "summary",
        accountId: "a1",
        payments: 4,
        changes: 0,
        customers: 0,
        revenue: 1,
        mrrChange: 0,
      }),
    ).toBeNull();
  });

  it("refuse anything else", () => {
    expect(
      announcementRequestSchema.safeParse({ moment: { kind: "text", text: "Hi" }, format: "opus" })
        .success,
    ).toBe(false);
    expect(
      announcementRequestSchema.safeParse({ moment: { kind: "test", id: "t" }, format: "mp3" })
        .success,
    ).toBe(false);
  });
});
