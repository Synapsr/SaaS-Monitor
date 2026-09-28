import "server-only";
import { listAll, type StripeGateway } from "./gateway";
import { isLicensedRecurring } from "./mrr";
import type { Coupon, Discount, Price, Subscription, SubscriptionItem } from "./types";

/**
 * What subscriptions reference but Stripe does not embed: items beyond the first page, price tiers
 * and amounts in other currencies, coupons with their product restrictions, product names. Kept
 * for the duration of one sync.
 */
export interface StripeCatalog {
  /** Coupons loaded so far, keyed by id, for the MRR computation. */
  readonly coupons: ReadonlyMap<string, Coupon>;
  /** Returns the subscriptions with everything their MRR and plan name depend on. */
  complete(subscriptions: readonly Subscription[]): Promise<Subscription[]>;
}

/**
 * The coupons of a Stripe account read so far. Deleting a coupon only stops new redemptions:
 * existing discounts keep applying, but Stripe no longer returns the coupon (404).
 */
export interface CouponArchive {
  /** The account whose coupons these are, named in logs. */
  accountId: string;
  recall(ids: readonly string[]): Promise<Map<string, Coupon>>;
  /** Replaces what was known of these coupons. */
  remember(coupons: readonly Coupon[]): Promise<void>;
}

export interface CatalogOptions {
  /**
   * Suits full scans: every coupon and product is listed with a few requests. Otherwise the
   * catalog fetches only what a handful of live updates need (retrieved subscriptions already come
   * with their product names).
   */
  bulk: boolean;
  archive: CouponArchive;
}

export function createCatalog(
  gateway: StripeGateway,
  { bulk, archive }: CatalogOptions,
): StripeCatalog {
  const coupons = new Map<string, Coupon>();
  /** Coupons whose terms no source knows: their discounts are left out of MRR. */
  const unknownCoupons = new Set<string>();
  let couponsListed = false;
  const productNames = new Map<string, string>();
  let productsListed = false;
  const prices = new Map<string, Promise<Price>>();

  /**
   * Finds the terms of the discounts' coupons, from the most to the least complete source:
   * 1. Stripe's coupons, with their product restrictions and amounts in every currency.
   * 2. The archive, for the coupons Stripe no longer returns: every coupon read is archived.
   * 3. The coupon a discount embeds, for a coupon deleted before it could be archived. Whether
   *    Stripe still embeds deleted coupons is unverified: the archive does not depend on it.
   *    Stripe leaves out product restrictions and other currencies there: such a coupon is
   *    assumed to apply to the whole subscription, and an amount off only in the coupon's
   *    currency, as most coupons do.
   * Only a discount whose coupon is unknown to all three is left out.
   */
  async function loadCoupons(discounts: readonly Discount[]) {
    const ids = new Set(discounts.flatMap((discount) => discount.couponId ?? []));
    const missing = [...ids].filter((id) => !coupons.has(id));
    if (!missing.length) return;

    if (bulk && !couponsListed) {
      couponsListed = true;
      const listed = await listAll((after) => gateway.listCoupons(after));
      for (const coupon of listed) coupons.set(coupon.id, coupon);
      await archive.remember(listed);
    }
    // All of them for live updates; for scans, only the deleted ones.
    const unlisted = missing.filter((id) => !coupons.has(id));
    if (!unlisted.length) return;

    const embedded = new Map(
      discounts.flatMap(({ embeddedCoupon }) =>
        embeddedCoupon ? [[embeddedCoupon.id, embeddedCoupon] as const] : [],
      ),
    );
    const remembered = await archive.recall(unlisted);
    const learned: Coupon[] = [];
    for (const id of unlisted) {
      // A scan lists every coupon Stripe has: an archived one it did not list was deleted.
      let coupon = bulk ? remembered.get(id) : undefined;
      if (!coupon && !unknownCoupons.has(id)) {
        const retrieved = await gateway.retrieveCoupon(id);
        if (retrieved) learned.push(retrieved);
        coupon = retrieved ?? remembered.get(id);
      }
      if (!coupon) {
        coupon = embedded.get(id);
        // Listings cannot embed the coupons of item and customer discounts: archive it for them.
        if (coupon) learned.push(coupon);
      }

      if (coupon) {
        coupons.set(id, coupon);
        unknownCoupons.delete(id);
      } else if (!unknownCoupons.has(id)) {
        unknownCoupons.add(id);
        console.warn(
          `[sync] account=${archive.accountId}: coupon ${id} was deleted before its terms could be read. Its discounts are left out of MRR.`,
        );
      }
    }
    await archive.remember(learned);
  }

  async function loadProductNames(items: readonly SubscriptionItem[]) {
    if (!bulk || productsListed || items.every((item) => item.price.productName !== null)) return;
    productsListed = true;
    for (const product of await listAll((after) => gateway.listProducts(after))) {
      productNames.set(product.id, product.name);
    }
  }

  async function completePrice(
    item: SubscriptionItem,
    currency: string,
  ): Promise<SubscriptionItem> {
    const { price } = item;
    if (!isLicensedRecurring(price) || !lacksAmounts(price, currency)) return item;

    const key = `${price.id}:${currency}`;
    let request = prices.get(key);
    if (!request) {
      request = gateway.retrievePrice(price.id, {
        tiers: price.billingScheme === "tiered",
        currency: price.currency === currency ? null : currency,
      });
      prices.set(key, request);
    }
    const loaded = await request;
    return { ...item, price: { ...loaded, productName: price.productName ?? loaded.productName } };
  }

  async function completeSubscription(subscription: Subscription): Promise<Subscription> {
    const listedItems = subscription.hasMoreItems
      ? await listAll((after) => gateway.listSubscriptionItems(subscription.id, after))
      : subscription.items;
    const items: SubscriptionItem[] = [];
    for (const item of listedItems) items.push(await completePrice(item, subscription.currency));
    return { ...subscription, items, hasMoreItems: false };
  }

  function withProductNames(subscription: Subscription): Subscription {
    return {
      ...subscription,
      items: subscription.items.map((item) => ({
        ...item,
        price: {
          ...item.price,
          productName: item.price.productName ?? productNames.get(item.price.productId) ?? null,
        },
      })),
    };
  }

  return {
    coupons,

    async complete(subscriptions) {
      const completed: Subscription[] = [];
      for (const subscription of subscriptions) {
        completed.push(await completeSubscription(subscription));
      }
      await loadProductNames(completed.flatMap((subscription) => subscription.items));
      await loadCoupons(completed.flatMap(discountsOf));
      return completed.map(withProductNames);
    },
  };
}

/** Whether Stripe left out amounts the MRR depends on: they are only returned on request. */
function lacksAmounts(price: Price, currency: string): boolean {
  const tiered = price.billingScheme === "tiered";
  if (price.currency === currency) return tiered && !price.amounts.tiers;
  if (!price.currencyOptions) return true;
  const amounts = price.currencyOptions[currency];
  return tiered && amounts !== undefined && !amounts.tiers;
}

function discountsOf(subscription: Subscription): Discount[] {
  return [
    ...subscription.discounts,
    ...subscription.items.flatMap((item) => item.discounts),
    ...(subscription.customer.discount ? [subscription.customer.discount] : []),
  ];
}
