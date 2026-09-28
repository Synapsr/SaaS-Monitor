import { StripeAccessError } from "@/server/stripe/errors";
import type { Page, ProbedResource, StripeGateway, SyncEventType } from "@/server/stripe/gateway";
import {
  accountSchema,
  chargeSchema,
  couponSchema,
  priceSchema,
  productSchema,
  subscriptionItemSchema,
  subscriptionSchema,
  type AccountInput,
  type ChargeInput,
  type CouponInput,
  type PriceInput,
  type ProductInput,
  type SubscriptionInput,
  type SubscriptionItemInput,
} from "@/server/stripe/normalize";
import type { StripeEvent, UnixTime } from "@/server/stripe/types";
import { stripeId } from "./stripe-fixtures";

type FakeResource = ProbedResource | "account" | "webhook_endpoints";
type DiscountInput = NonNullable<SubscriptionInput["discounts"]>[number];

/** The permission Stripe names when a restricted key may not use a resource. */
const PERMISSIONS: Record<FakeResource, string> = {
  subscriptions: "rak_subscription_read",
  customers: "rak_customer_read",
  charges: "rak_charge_read",
  events: "rak_event_read",
  products: "rak_product_read",
  prices: "rak_plan_read",
  coupons: "rak_coupon_read",
  account: "rak_account_read",
  webhook_endpoints: "rak_webhook_write",
};

/**
 * An in-memory Stripe account implementing the gateway. It stores Stripe-shaped objects (see
 * stripe-fixtures.ts) and serves them like Stripe does: newest first, paginated, with the same
 * normalization as the real gateway, and without "includable" fields (price tiers and currency
 * options) unless they are asked for.
 */
export class FakeStripe implements StripeGateway {
  requestCount = 0;
  /** Items per page; small values exercise pagination. */
  pageSize = 100;
  /** Items embedded in a subscription before `has_more`. */
  embeddedItems = 20;
  account: AccountInput = {
    id: "acct_fake",
    settings: { dashboard: { display_name: "Fake Inc" } },
    default_currency: "usd",
  };
  /**
   * Whether discounts still embed their coupon once it is deleted, or only `{ id, deleted: true }`.
   * Stripe's behavior is unverified: the sync engine must work either way.
   */
  embedsDeletedCoupons = false;
  /** Every request fails with this error while it is set, e.g. a revoked key. */
  failure: StripeAccessError | null = null;
  /** Resources the key may not read, to test permission checks. */
  readonly deniedResources = new Set<FakeResource>();
  readonly webhookEndpoints = new Map<string, { url: string; events: readonly string[] }>();

  private readonly subscriptions = new Map<string, SubscriptionInput>();
  private readonly prices = new Map<string, PriceInput>();
  private readonly products = new Map<string, ProductInput>();
  private readonly coupons = new Map<string, CouponInput>();
  private readonly deletedCoupons = new Map<string, CouponInput>();
  private readonly charges = new Map<string, ChargeInput>();
  private readonly events: StripeEvent[] = [];

  /** Creates or replaces a subscription (and remembers its prices, tiers included). */
  putSubscription(subscription: SubscriptionInput): SubscriptionInput {
    for (const item of subscription.items.data) this.prices.set(item.price.id, item.price);
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  updateSubscription(
    id: string,
    change: (subscription: SubscriptionInput) => SubscriptionInput,
  ): SubscriptionInput {
    const subscription = this.subscriptions.get(id);
    if (!subscription) throw new Error(`Unknown subscription ${id}`);
    return this.putSubscription(change(subscription));
  }

  deleteSubscription(id: string) {
    this.subscriptions.delete(id);
  }

  putProduct(product: ProductInput) {
    this.products.set(product.id, product);
  }

  putCoupon(coupon: CouponInput) {
    this.coupons.set(coupon.id, coupon);
  }

  /** Stops new redemptions: existing discounts keep applying, like in Stripe. */
  deleteCoupon(id: string) {
    const coupon = this.coupons.get(id);
    if (coupon) this.deletedCoupons.set(id, coupon);
    this.coupons.delete(id);
  }

  putCharge(charge: ChargeInput): ChargeInput {
    this.charges.set(charge.id, charge);
    return charge;
  }

  /** Records an event, as Stripe does when something happens. */
  emit(type: string, object: unknown, created: UnixTime): StripeEvent {
    const event = { id: stripeId("evt"), type, created, object };
    this.events.push(event);
    return event;
  }

  async listSubscriptions(startingAfter?: string) {
    this.request("subscriptions");
    const page = paginate(
      newestFirst([...this.subscriptions.values()]),
      startingAfter,
      this.pageSize,
    );
    return mapPage(page, (subscription) =>
      subscriptionSchema.parse(this.render(subscription, { retrieved: false })),
    );
  }

  async retrieveSubscription(id: string) {
    this.request("subscriptions");
    const subscription = this.subscriptions.get(id);
    return subscription
      ? subscriptionSchema.parse(this.render(subscription, { retrieved: true }))
      : null;
  }

  async listSubscriptionItems(subscriptionId: string, startingAfter?: string) {
    this.request("subscriptions");
    const items = this.subscriptions.get(subscriptionId)?.items.data ?? [];
    return mapPage(paginate(items, startingAfter, this.pageSize), (item) =>
      subscriptionItemSchema.parse(this.renderItem(item, { retrieved: true, embedCoupons: true })),
    );
  }

  async listCharges(createdSince: UnixTime, startingAfter?: string) {
    this.request("charges");
    const charges = [...this.charges.values()].filter((charge) => charge.created >= createdSince);
    return mapPage(paginate(byCreatedDesc(charges), startingAfter, this.pageSize), (charge) =>
      chargeSchema.parse(charge),
    );
  }

  async listEvents(
    types: readonly SyncEventType[],
    createdSince: UnixTime,
    startingAfter?: string,
  ) {
    this.request("events");
    const events = this.events.filter(
      (event) => (types as readonly string[]).includes(event.type) && event.created >= createdSince,
    );
    return paginate(byCreatedDesc(events), startingAfter, this.pageSize);
  }

  async listProducts(startingAfter?: string) {
    this.request("products");
    return mapPage(paginate([...this.products.values()], startingAfter, this.pageSize), (product) =>
      productSchema.parse(product),
    );
  }

  async retrievePrice(id: string, include: { tiers: boolean; currency: string | null }) {
    this.request("prices");
    const price = this.prices.get(id);
    if (!price) throw new StripeAccessError("not_found", `No such price: '${id}'`);
    return priceSchema.parse({
      ...price,
      tiers: include.tiers ? price.tiers : undefined,
      currency_options: include.currency ? price.currency_options : undefined,
    });
  }

  async listCoupons(startingAfter?: string) {
    this.request("coupons");
    return mapPage(paginate([...this.coupons.values()], startingAfter, this.pageSize), (coupon) =>
      couponSchema.parse(coupon),
    );
  }

  async retrieveCoupon(id: string) {
    this.request("coupons");
    const coupon = this.coupons.get(id);
    return coupon ? couponSchema.parse(coupon) : null;
  }

  async retrieveAccount() {
    this.request("account");
    return accountSchema.parse(this.account);
  }

  async probe(resource: ProbedResource) {
    this.request(resource);
  }

  async createWebhookEndpoint(input: { url: string; events: readonly SyncEventType[] }) {
    this.request("webhook_endpoints");
    const id = stripeId("we");
    this.webhookEndpoints.set(id, { url: input.url, events: input.events });
    return { id, secret: `whsec_${crypto.randomUUID().replaceAll("-", "")}` };
  }

  async deleteWebhookEndpoint(id: string) {
    this.request("webhook_endpoints");
    this.webhookEndpoints.delete(id);
  }

  /** Counts the request and fails it like Stripe would. */
  private request(resource: FakeResource) {
    this.requestCount += 1;
    if (this.failure) throw this.failure;
    if (this.deniedResources.has(resource)) {
      const permission = PERMISSIONS[resource];
      throw new StripeAccessError(
        "permission",
        `The provided key 'rk_test_…abcd' does not have the required permissions for this endpoint on account '${this.account.id}'. Having the '${permission}' permission would allow this request to continue.`,
        { permission, stripeAccountId: this.account.id },
      );
    }
  }

  /**
   * Like Stripe: items are truncated, tiers and currency options left out, and products and the
   * coupons of discounts expanded as deep as the gateway's expansions reach (four levels).
   */
  private render(subscription: SubscriptionInput, { retrieved }: { retrieved: boolean }) {
    const { customer } = subscription;
    const items = subscription.items.data;
    return {
      ...subscription,
      // `data.customer.discount.source.coupon` is one level too deep for a listing.
      customer:
        retrieved && typeof customer === "object" && customer.discount
          ? { ...customer, discount: this.embedCoupon(customer.discount) }
          : customer,
      discounts: subscription.discounts?.map((discount) => this.embedCoupon(discount)),
      items: {
        data: items
          .slice(0, this.embeddedItems)
          .map((item) => this.renderItem(item, { retrieved, embedCoupons: false })),
        has_more: items.length > this.embeddedItems,
      },
    };
  }

  private renderItem(
    item: SubscriptionItemInput,
    { retrieved, embedCoupons }: { retrieved: boolean; embedCoupons: boolean },
  ) {
    const { product } = item.price;
    const productId = typeof product === "string" ? product : product.id;
    return {
      ...item,
      discounts: embedCoupons
        ? item.discounts?.map((discount) => this.embedCoupon(discount))
        : item.discounts,
      price: {
        ...item.price,
        tiers: undefined,
        currency_options: undefined,
        product: retrieved ? (this.products.get(productId) ?? product) : productId,
      },
    };
  }

  /** A discount with its coupon expanded, as far as Stripe can. */
  private embedCoupon<T extends DiscountInput>(discount: T): T {
    const id = discount.source?.coupon;
    if (typeof id !== "string") return discount;
    const coupon =
      this.coupons.get(id) ?? (this.embedsDeletedCoupons ? this.deletedCoupons.get(id) : undefined);
    const embedded = coupon
      ? // What Stripe only returns on request is left out, as in any expansion.
        { ...coupon, applies_to: undefined, currency_options: undefined }
      : this.deletedCoupons.has(id)
        ? { id, object: "coupon", deleted: true }
        : id;
    return { ...discount, source: { ...discount.source, coupon: embedded } };
  }
}

function paginate<T extends { id: string }>(
  items: readonly T[],
  startingAfter: string | undefined,
  pageSize: number,
): Page<T> {
  const start = startingAfter ? items.findIndex((item) => item.id === startingAfter) + 1 : 0;
  return { data: items.slice(start, start + pageSize), hasMore: start + pageSize < items.length };
}

function mapPage<T, U>(page: Page<T>, map: (item: T) => U): Page<U> {
  return { data: page.data.map(map), hasMore: page.hasMore };
}

/** Insertion order is creation order: Stripe lists the newest first. */
function newestFirst<T>(items: readonly T[]): T[] {
  return [...items].reverse();
}

function byCreatedDesc<T extends { created: number }>(items: readonly T[]): T[] {
  return newestFirst(items).sort((a, b) => b.created - a.created);
}
