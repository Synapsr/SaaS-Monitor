import "server-only";
import { listAll, type StripeGateway } from "./gateway";
import { isLicensedRecurring } from "./mrr";
import type { Coupon, Price, Subscription, SubscriptionItem } from "./types";

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
 * `bulk` suits full scans: every coupon and product is listed with a few requests. Otherwise the
 * catalog fetches only what a handful of live updates need (retrieved subscriptions already come
 * with their product names).
 */
export function createCatalog(gateway: StripeGateway, { bulk }: { bulk: boolean }): StripeCatalog {
  const coupons = new Map<string, Coupon>();
  const deletedCoupons = new Set<string>();
  let couponsListed = false;
  const productNames = new Map<string, string>();
  let productsListed = false;
  const prices = new Map<string, Promise<Price>>();

  async function loadCoupons(ids: readonly string[]) {
    const missing = [...new Set(ids)].filter((id) => !coupons.has(id) && !deletedCoupons.has(id));
    if (!missing.length) return;
    if (bulk && !couponsListed) {
      couponsListed = true;
      for (const coupon of await listAll((after) => gateway.listCoupons(after))) {
        coupons.set(coupon.id, coupon);
      }
    }
    // Deleted coupons are not listed, although existing discounts may still use them.
    for (const id of missing.filter((candidate) => !coupons.has(candidate))) {
      const coupon = await gateway.retrieveCoupon(id);
      if (coupon) coupons.set(id, coupon);
      else deletedCoupons.add(id);
    }
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
      await loadCoupons(completed.flatMap(couponIds));
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

function couponIds(subscription: Subscription): string[] {
  const discounts = [
    ...subscription.discounts,
    ...subscription.items.flatMap((item) => item.discounts),
    ...(subscription.customer.discount ? [subscription.customer.discount] : []),
  ];
  return discounts.flatMap((discount) => (discount.couponId ? [discount.couponId] : []));
}
