import "server-only";
import type Stripe from "stripe";

/**
 * Events the sync engine reads from the Events API, and the ones a webhook endpoint subscribes
 * to: a webhook is only a signal to read them sooner. The Events API accepts at most 20 types.
 */
export const SYNC_EVENT_TYPES = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.discount.created",
  "customer.discount.updated",
  "customer.discount.deleted",
  "charge.succeeded",
  "charge.captured",
  "charge.refunded",
  "customer.created",
  "customer.updated",
  "customer.deleted",
] as const satisfies readonly Stripe.WebhookEndpointCreateParams.EnabledEvent[];
