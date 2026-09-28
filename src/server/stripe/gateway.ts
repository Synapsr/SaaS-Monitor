import "server-only";
import Stripe from "stripe";
import { siteConfig } from "@/lib/site";
import { StripeAccessError, toStripeAccessError } from "./errors";
import { SYNC_EVENT_TYPES } from "./event-types";
import {
  accountSchema,
  chargeSchema,
  couponSchema,
  eventSchema,
  priceSchema,
  productSchema,
  subscriptionItemSchema,
  subscriptionSchema,
} from "./normalize";
import type {
  AccountInfo,
  Charge,
  Coupon,
  Price,
  Product,
  StripeEvent,
  Subscription,
  SubscriptionItem,
  UnixTime,
} from "./types";

/** One page of a Stripe list, newest first. */
export interface Page<T> {
  data: T[];
  /** More pages follow: pass the id of the last item as `startingAfter`. */
  hasMore: boolean;
}

/** Resources whose read permission is checked when a key is connected. */
export type ProbedResource =
  "subscriptions" | "customers" | "charges" | "events" | "products" | "prices" | "coupons";

export type SyncEventType = (typeof SYNC_EVENT_TYPES)[number];

/**
 * Everything the app asks Stripe, and nothing more. Implemented with the Stripe SDK below and by
 * an in-memory fake in tests (src/test/fake-stripe.ts). Methods throw `StripeAccessError`.
 */
export interface StripeGateway {
  /** HTTP requests sent so far, retries included: Stripe caps how much an account may read. */
  readonly requestCount: number;
  /** Every subscription, including canceled ones, with customers and discounts expanded. */
  listSubscriptions(startingAfter?: string): Promise<Page<Subscription>>;
  /** `null` when the subscription does not exist (anymore). */
  retrieveSubscription(id: string): Promise<Subscription | null>;
  listSubscriptionItems(
    subscriptionId: string,
    startingAfter?: string,
  ): Promise<Page<SubscriptionItem>>;
  listCharges(createdSince: UnixTime, startingAfter?: string): Promise<Page<Charge>>;
  listEvents(
    types: readonly SyncEventType[],
    createdSince: UnixTime,
    startingAfter?: string,
  ): Promise<Page<StripeEvent>>;
  listProducts(startingAfter?: string): Promise<Page<Product>>;
  /** Loads what a price only returns on request: its tiers and its amounts in `currency`. */
  retrievePrice(id: string, include: { tiers: boolean; currency: string | null }): Promise<Price>;
  /** Coupons with their product restrictions and amounts in every currency. */
  listCoupons(startingAfter?: string): Promise<Page<Coupon>>;
  /** `null` when the coupon was deleted. */
  retrieveCoupon(id: string): Promise<Coupon | null>;
  retrieveAccount(): Promise<AccountInfo>;
  /** Lists a single object, to check that the key may read `resource`. */
  probe(resource: ProbedResource): Promise<void>;
  createWebhookEndpoint(input: {
    url: string;
    events: readonly SyncEventType[];
    description: string;
    metadata: Record<string, string>;
  }): Promise<{ id: string; secret: string }>;
  deleteWebhookEndpoint(id: string): Promise<void>;
}

/** Creates the gateway of one Stripe account. Tests swap it for the fake. */
export type GatewayFactory = (secretKey: string) => StripeGateway;

/** Reads every page of a list. Only for lists known to be short, such as coupons. */
export async function listAll<T extends { id: string }>(
  list: (startingAfter?: string) => Promise<Page<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let startingAfter: string | undefined;
  for (;;) {
    const page = await list(startingAfter);
    items.push(...page.data);
    if (!page.hasMore || page.data.length === 0) return items;
    startingAfter = page.data[page.data.length - 1].id;
  }
}

const PAGE_SIZE = 100;

// Expansions are limited to four levels, hence no product names in listings (see the catalog).
const LISTED_SUBSCRIPTION_EXPANSIONS = [
  "data.customer",
  "data.discounts",
  "data.items.data.discounts",
];
const RETRIEVED_SUBSCRIPTION_EXPANSIONS = [
  "customer",
  "discounts",
  "items.data.discounts",
  "items.data.price.product",
];

/** Where the SDK sends requests; tests point it at stripe-mock. */
export interface StripeEndpoint {
  host?: string;
  port?: number;
  protocol?: "http" | "https";
}

export function createStripeGateway(
  secretKey: string,
  endpoint: StripeEndpoint = {},
): StripeGateway {
  const stripe = new Stripe(secretKey, {
    // The SDK retries network errors and 429s with exponential backoff.
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: { name: siteConfig.name, url: siteConfig.repositoryUrl },
    ...endpoint,
  });

  let requestCount = 0;
  // Emitted for every attempt, so retries are counted too.
  stripe.on("request", () => {
    requestCount += 1;
  });

  async function send<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      throw toStripeAccessError(error);
    }
  }

  async function orNullWhenMissing<T>(request: () => Promise<T>): Promise<T | null> {
    try {
      return await send(request);
    } catch (error) {
      if (error instanceof StripeAccessError && error.kind === "not_found") return null;
      throw error;
    }
  }

  return {
    get requestCount() {
      return requestCount;
    },

    async listSubscriptions(startingAfter) {
      const page = await send(() =>
        stripe.subscriptions.list({
          status: "all",
          limit: PAGE_SIZE,
          starting_after: startingAfter,
          expand: LISTED_SUBSCRIPTION_EXPANSIONS,
        }),
      );
      return {
        data: page.data.map((item) => subscriptionSchema.parse(item)),
        hasMore: page.has_more,
      };
    },

    async retrieveSubscription(id) {
      const subscription = await orNullWhenMissing(() =>
        stripe.subscriptions.retrieve(id, { expand: RETRIEVED_SUBSCRIPTION_EXPANSIONS }),
      );
      return subscription && subscriptionSchema.parse(subscription);
    },

    async listSubscriptionItems(subscriptionId, startingAfter) {
      const page = await send(() =>
        stripe.subscriptionItems.list({
          subscription: subscriptionId,
          limit: PAGE_SIZE,
          starting_after: startingAfter,
          expand: ["data.discounts", "data.price.product"],
        }),
      );
      return {
        data: page.data.map((item) => subscriptionItemSchema.parse(item)),
        hasMore: page.has_more,
      };
    },

    async listCharges(createdSince, startingAfter) {
      const page = await send(() =>
        stripe.charges.list({
          created: { gte: createdSince },
          limit: PAGE_SIZE,
          starting_after: startingAfter,
        }),
      );
      return { data: page.data.map((item) => chargeSchema.parse(item)), hasMore: page.has_more };
    },

    async listEvents(types, createdSince, startingAfter) {
      const page = await send(() =>
        stripe.events.list({
          types: [...types],
          created: { gte: createdSince },
          limit: PAGE_SIZE,
          starting_after: startingAfter,
        }),
      );
      return { data: page.data.map((item) => eventSchema.parse(item)), hasMore: page.has_more };
    },

    async listProducts(startingAfter) {
      const page = await send(() =>
        stripe.products.list({ limit: PAGE_SIZE, starting_after: startingAfter }),
      );
      return { data: page.data.map((item) => productSchema.parse(item)), hasMore: page.has_more };
    },

    async retrievePrice(id, include) {
      const expand: string[] = [];
      if (include.tiers) expand.push("tiers");
      if (include.currency) expand.push("currency_options");
      // The tiers of a currency option are only returned on request too.
      if (include.tiers && include.currency) {
        expand.push(`currency_options.${include.currency}.tiers`);
      }
      return priceSchema.parse(await send(() => stripe.prices.retrieve(id, { expand })));
    },

    async listCoupons(startingAfter) {
      const page = await send(() =>
        stripe.coupons.list({
          limit: PAGE_SIZE,
          starting_after: startingAfter,
          expand: ["data.applies_to", "data.currency_options"],
        }),
      );
      return { data: page.data.map((item) => couponSchema.parse(item)), hasMore: page.has_more };
    },

    async retrieveCoupon(id) {
      const coupon = await orNullWhenMissing(() =>
        stripe.coupons.retrieve(id, { expand: ["applies_to", "currency_options"] }),
      );
      return coupon && couponSchema.parse(coupon);
    },

    async retrieveAccount() {
      return accountSchema.parse(await send(() => stripe.accounts.retrieveCurrent()));
    },

    async probe(resource) {
      const probes: Record<ProbedResource, () => Promise<unknown>> = {
        subscriptions: () => stripe.subscriptions.list({ limit: 1 }),
        customers: () => stripe.customers.list({ limit: 1 }),
        charges: () => stripe.charges.list({ limit: 1 }),
        events: () => stripe.events.list({ limit: 1 }),
        products: () => stripe.products.list({ limit: 1 }),
        prices: () => stripe.prices.list({ limit: 1 }),
        coupons: () => stripe.coupons.list({ limit: 1 }),
      };
      await send(probes[resource]);
    },

    async createWebhookEndpoint({ url, events, description, metadata }) {
      const endpoint = await send(() =>
        stripe.webhookEndpoints.create({
          url,
          enabled_events: [...events],
          // Payloads then match the SDK's types; the sync engine does not depend on them anyway.
          api_version: Stripe.API_VERSION,
          description,
          metadata,
        }),
      );
      if (!endpoint.secret) {
        throw new StripeAccessError(
          "invalid_request",
          "Stripe did not return the webhook signing secret.",
        );
      }
      return { id: endpoint.id, secret: endpoint.secret };
    },

    async deleteWebhookEndpoint(id) {
      await orNullWhenMissing(() => stripe.webhookEndpoints.del(id));
    },
  };
}
