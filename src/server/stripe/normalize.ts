import "server-only";
import { z } from "zod";
import type {
  AccountInfo,
  Charge,
  Coupon,
  Discount,
  EventSignal,
  Price,
  PriceAmounts,
  Product,
  StripeEvent,
  Subscription,
  SubscriptionItem,
} from "./types";

/*
 * Every Stripe object goes through these schemas: typed SDK responses and event payloads alike.
 * They only describe the fields the app reads, so fixtures stay small and objects rendered with an
 * older API version (events) still parse as long as those fields are there.
 */

/**
 * Reads a `decimal_string` field such as `unit_amount_decimal`. The SDK turns them into its own
 * `Decimal` objects in typed responses, while event payloads and `currency_options` keep strings.
 */
export function parseDecimal(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const isDecimalObject = typeof value === "object" && value !== null && "toFixed" in value;
  if (typeof value !== "string" && !isDecimalObject) return null;
  const text = String(value).trim();
  const amount = Number(text);
  return text !== "" && Number.isFinite(amount) ? amount : null;
}

const decimal = z.unknown().transform((value, context) => {
  const amount = parseDecimal(value);
  if (amount === null) {
    context.addIssue({ code: "custom", message: "Expected a decimal amount" });
    return z.NEVER;
  }
  return amount;
});

/** ISO 4217 codes are compared everywhere in lowercase, as Stripe writes them. */
const currencyCode = z.string().transform((code) => code.toLowerCase());

/** An expandable reference: either the id or the expanded object. */
const reference = z.union([z.string(), z.object({ id: z.string() })]);
const idOf = (value: z.infer<typeof reference>) => (typeof value === "string" ? value : value.id);

const discountSchema = z
  .object({
    id: z.string(),
    end: z.number().nullish(),
    source: z.object({ coupon: reference.nullish() }).nullish(),
  })
  .transform((discount): Discount => ({
    id: discount.id,
    couponId: discount.source?.coupon ? idOf(discount.source.coupon) : null,
    end: discount.end ?? null,
  }));

const customerSchema = z.union([
  z.string().transform((id) => ({ id, name: null, country: null, discount: null })),
  z
    .object({
      id: z.string(),
      name: z.string().nullish(),
      business_name: z.string().nullish(),
      individual_name: z.string().nullish(),
      address: z.object({ country: z.string().nullish() }).nullish(),
      discount: discountSchema.nullish(),
    })
    .transform((customer) => ({
      id: customer.id,
      name: customer.name || customer.business_name || customer.individual_name || null,
      country: customer.address?.country || null,
      discount: customer.discount ?? null,
    })),
]);

const tierSchema = z
  .object({
    up_to: z.number().nullable(),
    unit_amount: z.number().nullish(),
    unit_amount_decimal: decimal.nullish(),
    flat_amount: z.number().nullish(),
    flat_amount_decimal: decimal.nullish(),
  })
  .transform((tier) => ({
    upTo: tier.up_to,
    unitAmount: tier.unit_amount_decimal ?? tier.unit_amount ?? 0,
    flatAmount: tier.flat_amount_decimal ?? tier.flat_amount ?? 0,
  }));

const priceAmountsSchema = z.object({
  unit_amount: z.number().nullish(),
  unit_amount_decimal: decimal.nullish(),
  tiers: z.array(tierSchema).optional(),
});

function toAmounts(price: z.infer<typeof priceAmountsSchema>): PriceAmounts {
  return {
    // The decimal field carries sub-minor-unit precision; the integer one is a rounded copy.
    unitAmount: price.unit_amount_decimal ?? price.unit_amount ?? null,
    tiers: price.tiers ?? null,
  };
}

export const priceSchema = priceAmountsSchema
  .extend({
    id: z.string(),
    product: z.union([
      z.string(),
      z.object({ id: z.string(), name: z.string().nullish(), deleted: z.boolean().optional() }),
    ]),
    nickname: z.string().nullish(),
    currency: currencyCode,
    recurring: z
      .object({
        interval: z.string(),
        interval_count: z.number().int().positive(),
        usage_type: z.string().default("licensed"),
      })
      .nullish(),
    billing_scheme: z.string().default("per_unit"),
    tiers_mode: z.string().nullish(),
    transform_quantity: z
      .object({ divide_by: z.number().int().positive(), round: z.string() })
      .nullish(),
    currency_options: z.record(z.string(), priceAmountsSchema).optional(),
  })
  .transform((price): Price => ({
    id: price.id,
    productId: typeof price.product === "string" ? price.product : price.product.id,
    productName: typeof price.product === "string" ? null : (price.product.name ?? null),
    nickname: price.nickname ?? null,
    currency: price.currency,
    recurring: price.recurring
      ? {
          interval: price.recurring.interval,
          intervalCount: price.recurring.interval_count,
          usageType: price.recurring.usage_type,
        }
      : null,
    billingScheme: price.billing_scheme,
    tiersMode: price.tiers_mode ?? null,
    transformQuantity: price.transform_quantity
      ? {
          divideBy: price.transform_quantity.divide_by,
          round: price.transform_quantity.round,
        }
      : null,
    amounts: toAmounts(price),
    currencyOptions: price.currency_options
      ? Object.fromEntries(
          Object.entries(price.currency_options).map(([currency, options]) => [
            currency.toLowerCase(),
            toAmounts(options),
          ]),
        )
      : null,
  }));

export const subscriptionItemSchema = z
  .object({
    id: z.string(),
    // Absent on metered items, which are billed by usage rather than quantity.
    quantity: z.number().int().nonnegative().optional(),
    current_period_start: z.number(),
    price: priceSchema,
    discounts: z.array(discountSchema).default([]),
  })
  .transform((item): SubscriptionItem => ({
    id: item.id,
    quantity: item.quantity ?? 1,
    currentPeriodStart: item.current_period_start,
    price: item.price,
    discounts: item.discounts,
  }));

export const subscriptionSchema = z
  .object({
    id: z.string(),
    customer: customerSchema,
    status: z.string(),
    currency: currencyCode,
    start_date: z.number(),
    trial_end: z.number().nullish(),
    ended_at: z.number().nullish(),
    canceled_at: z.number().nullish(),
    cancel_at_period_end: z.boolean().default(false),
    discounts: z.array(discountSchema).default([]),
    items: z.object({ data: z.array(subscriptionItemSchema), has_more: z.boolean() }),
  })
  .transform((subscription): Subscription => ({
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    currency: subscription.currency,
    startDate: subscription.start_date,
    trialEnd: subscription.trial_end ?? null,
    endedAt: subscription.ended_at ?? null,
    canceledAt: subscription.canceled_at ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    discounts: subscription.discounts,
    items: subscription.items.data,
    hasMoreItems: subscription.items.has_more,
  }));

export const couponSchema = z
  .object({
    id: z.string(),
    percent_off: z.number().nullish(),
    amount_off: z.number().nullish(),
    currency: currencyCode.nullish(),
    currency_options: z.record(z.string(), z.object({ amount_off: z.number() })).optional(),
    duration: z.string(),
    applies_to: z.object({ products: z.array(z.string()) }).nullish(),
  })
  .transform((coupon): Coupon => ({
    id: coupon.id,
    percentOff: coupon.percent_off ?? null,
    amountOff: coupon.amount_off ?? null,
    currency: coupon.currency ?? null,
    amountOffByCurrency: Object.fromEntries(
      Object.entries(coupon.currency_options ?? {}).map(([currency, option]) => [
        currency.toLowerCase(),
        option.amount_off,
      ]),
    ),
    duration: coupon.duration,
    // An empty list restricts nothing: it is what Stripe renders for unrestricted coupons.
    appliesToProducts: coupon.applies_to?.products.length ? coupon.applies_to.products : null,
  }));

/**
 * Charges come from typed listings and from event payloads of any API version: only fields that
 * have been stable for years are read, and `amount_captured` (2020) falls back to `amount`.
 */
export const chargeSchema = z
  .object({
    id: z.string(),
    amount: z.number().int(),
    amount_captured: z.number().int().nullish(),
    amount_refunded: z.number().int().nullish(),
    captured: z.boolean().nullish(),
    currency: currencyCode,
    created: z.number(),
    status: z.string(),
    customer: reference.nullish(),
    description: z.string().nullish(),
    billing_details: z
      .object({
        name: z.string().nullish(),
        address: z.object({ country: z.string().nullish() }).nullish(),
      })
      .nullish(),
    payment_method_details: z
      .object({ card: z.object({ country: z.string().nullish() }).nullish() })
      .nullish(),
  })
  .transform((charge): Charge => ({
    id: charge.id,
    customerId: charge.customer ? idOf(charge.customer) : null,
    amount: charge.amount_captured || charge.amount,
    amountRefunded: charge.amount_refunded ?? 0,
    currency: charge.currency,
    created: charge.created,
    collected: charge.status === "succeeded" && charge.captured !== false,
    description: charge.description || null,
    customerName: charge.billing_details?.name || null,
    country:
      charge.billing_details?.address?.country ||
      charge.payment_method_details?.card?.country ||
      null,
  }));

export const productSchema = z
  .object({ id: z.string(), name: z.string() })
  .transform((product): Product => ({ id: product.id, name: product.name }));

export const accountSchema = z
  .object({
    id: z.string(),
    settings: z
      .object({ dashboard: z.object({ display_name: z.string().nullish() }).nullish() })
      .nullish(),
    business_profile: z.object({ name: z.string().nullish() }).nullish(),
    default_currency: currencyCode.nullish(),
  })
  .transform((account): AccountInfo => ({
    id: account.id,
    name: account.settings?.dashboard?.display_name || account.business_profile?.name || null,
    defaultCurrency: account.default_currency ?? null,
  }));

export const eventSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    created: z.number(),
    data: z.object({ object: z.unknown() }),
  })
  .transform((event): StripeEvent => ({
    id: event.id,
    type: event.type,
    created: event.created,
    object: event.data.object,
  }));

const subscriptionEventObject = z.object({ id: z.string() });
const discountEventObject = z.object({
  subscription: z.string().nullish(),
  customer: reference.nullish(),
});

/**
 * Reads what matters in an event. Subscription and discount events are only notifications: the
 * subscription is fetched again, because payloads may use an older API version. Charges are read
 * from the payload, whose fields of interest are stable. Returns `null` for anything else.
 */
export function readEventSignal(event: StripeEvent): EventSignal | null {
  if (event.type.startsWith("customer.subscription.")) {
    const object = subscriptionEventObject.safeParse(event.object);
    return object.success ? { kind: "subscription", subscriptionId: object.data.id } : null;
  }
  if (event.type.startsWith("customer.discount.")) {
    const object = discountEventObject.safeParse(event.object);
    if (!object.success) return null;
    return {
      kind: "discount",
      subscriptionId: object.data.subscription ?? null,
      customerId: object.data.customer ? idOf(object.data.customer) : null,
    };
  }
  if (event.type.startsWith("charge.")) {
    const charge = chargeSchema.safeParse(event.object);
    return charge.success ? { kind: "charge", charge: charge.data } : null;
  }
  return null;
}

/** Stripe-shaped inputs accepted by the schemas, handy to write fixtures. */
export type SubscriptionInput = z.input<typeof subscriptionSchema>;
export type SubscriptionItemInput = z.input<typeof subscriptionItemSchema>;
export type PriceInput = z.input<typeof priceSchema>;
export type CouponInput = z.input<typeof couponSchema>;
export type ChargeInput = z.input<typeof chargeSchema>;
export type ProductInput = z.input<typeof productSchema>;
export type AccountInput = z.input<typeof accountSchema>;
