import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import type { ChurnReason } from "@/lib/display/types";
import type { ScreenSettings } from "@/lib/screens/settings";
import type { CouponTerms } from "@/server/stripe/types";
import { organizations } from "./auth";
import { identifier, instant, now, uuid } from "./columns";

// Column names are derived from keys (snake_case), see `casing` in drizzle.config.ts.
// Money is always an integer amount in the currency's minor unit (cents), like in Stripe.

const money = () => bigint({ mode: "number" });
/** ISO 4217 code, lowercase like Stripe. */
const currency = () => varchar({ length: 3 });
/** Stripe's ids have at most 255 characters. */
const stripeId = () => identifier({ length: 255 });
/** A Better Auth id, such as a workspace's (see ./auth.ts). */
const authId = () => identifier({ length: 36 });

const id = () =>
  uuid()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: instant().default(now).notNull(),
  updatedAt: instant()
    .default(now)
    .notNull()
    .$onUpdate(() => new Date()),
};

/** How a row entered the database. Only `live` rows trigger sounds and celebrations. */
export const DATA_ORIGINS = ["backfill", "live", "reconcile"] as const;

/** Why a subscription stopped counting (see `ChurnReason`). */
export const CHURN_REASONS = [
  "canceled",
  "scheduled",
  "unpaid",
  "paused",
] as const satisfies readonly ChurnReason[];

/**
 * What a scan reads after every subscription. Scans are stored as JSON: fields added since the
 * first version are optional, as scans saved before lack them.
 */
export interface ScanWindows {
  /** Unix time (seconds) of the oldest charge to import; `null` skips the payments phase. */
  paymentsSince: number | null;
  /** Unix time (seconds) of the oldest customer to import; `null` skips the customers phase. */
  customersSince?: number | null;
}

/**
 * Resumable state of a full scan of a Stripe account: the initial import or a reconcile. Large
 * accounts are scanned in several short runs, so a scan survives restarts and serverless limits.
 */
export interface ScanProgress extends ScanWindows {
  phase: "subscriptions" | "payments" | "customers";
  /** Stripe pagination cursor (`starting_after`) within the current phase. */
  cursor: string | null;
  startedAt: string;
  subscriptions: number;
  payments: number;
  /** Optional like `customersSince`. */
  customers?: number;
  /**
   * A catch-up that came once the scan had passed some pages, which may predate the changes to
   * catch up with: another scan runs when this one completes (see `startCatchUp`).
   */
  followUp?: ScanWindows;
}

/** A Stripe account connected to a workspace with a (preferably restricted, read-only) API key. */
export const stripeAccounts = mysqlTable(
  "stripe_accounts",
  {
    id: id(),
    workspaceId: authId()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    /**
     * `acct_…` identifier, used to prevent connecting the same account twice. Test mode shares it
     * with live mode, although their data is separate: both may be connected.
     */
    stripeAccountId: stripeId(),
    livemode: boolean().notNull(),
    /** API key encrypted with ENCRYPTION_KEY, see src/server/crypto.ts. Never sent to clients. */
    encryptedSecretKey: text().notNull(),
    /** Masked key for the UI, e.g. `rk_live_…4f2a`. */
    secretKeyHint: text().notNull(),
    defaultCurrency: currency(),
    status: mysqlEnum(["importing", "ready", "error"]).notNull().default("importing"),
    lastError: text(),
    /** Initial import in progress; `null` once the account is imported. */
    backfill: json().$type<ScanProgress>(),
    /** Daily reconcile in progress, see src/server/sync/scan.ts. */
    reconcile: json().$type<ScanProgress>(),
    /** Unix time (seconds) of the newest Stripe event applied by the incremental sync. */
    eventsCursor: bigint({ mode: "number" }),
    /**
     * Events already handled that the next sync lists again, as it reads from a few minutes before
     * `eventsCursor` (events may be listed late): it skips them.
     */
    recentEventIds: json().$type<string[]>().notNull().default([]),
    /** Creation time of the newest Stripe event applied: webhooks are healthy if they keep up. */
    lastEventAt: instant(),
    lastSyncedAt: instant(),
    lastReconciledAt: instant(),
    /** Sync lease: a sync may only start when this is null or in the past. */
    syncLockedUntil: instant(),
    /** Consecutive failed syncs (rate limits, network): the next attempt backs off accordingly. */
    syncFailures: int().notNull().default(0),
    /** Set by incoming webhooks: a sync must run as soon as possible. */
    syncRequestedAt: instant(),
    /**
     * Instant updates. Stripe caps read requests (~500 per transaction over 30 days), so polling
     * is slow for small accounts; a webhook tells us exactly when to sync. The endpoint id is set
     * when the app created the endpoint itself, so it can remove it on disconnect.
     */
    webhookEndpointId: stripeId(),
    encryptedWebhookSecret: text(),
    lastWebhookAt: instant(),
    ...timestamps,
  },
  (table) => [
    index("stripe_accounts_workspace_id_index").on(table.workspaceId),
    uniqueIndex("stripe_accounts_workspace_id_stripe_account_id_livemode_index").on(
      table.workspaceId,
      table.stripeAccountId,
      table.livemode,
    ),
  ],
);

/** Local mirror of every Stripe subscription, with its current contribution to MRR. */
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: id(),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    stripeSubscriptionId: stripeId().notNull(),
    stripeCustomerId: stripeId().notNull(),
    customerName: text(),
    /** Shown on screens that allow it, for customers without a name. */
    customerEmail: text(),
    /** ISO 3166-1 alpha-2 country code. */
    customerCountry: text(),
    /** Stripe status: active, past_due, trialing, canceled, unpaid, paused, incomplete… */
    status: text().notNull(),
    currency: currency().notNull(),
    /** Monthly-normalized recurring amount after discounts; 0 when the subscription is not paying. */
    mrr: money().notNull(),
    planName: text(),
    /** Billing interval of the main item: day, week, month or year. */
    billingInterval: text(),
    startedAt: instant().notNull(),
    trialEndsAt: instant(),
    canceledAt: instant(),
    endedAt: instant(),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    /**
     * When Stripe last returned the subscription, in a scan or a live update: a complete scan ends
     * the ones it did not see (deleted test data). Rows that predate the column get the time of
     * its migration, which no scan under way at that time can end.
     */
    lastSeenAt: instant().default(now).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("subscriptions_account_id_stripe_subscription_id_index").on(
      table.accountId,
      table.stripeSubscriptionId,
    ),
    index("subscriptions_account_id_stripe_customer_id_index").on(
      table.accountId,
      table.stripeCustomerId,
    ),
  ],
);

/**
 * Ledger of MRR changes. The running sum per account and currency equals the current MRR, which
 * gives the MRR history chart and the new/expansion/contraction/churn breakdown.
 */
export const mrrMovements = mysqlTable(
  "mrr_movements",
  {
    id: id(),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    stripeSubscriptionId: stripeId().notNull(),
    stripeCustomerId: stripeId().notNull(),
    customerName: text(),
    customerCountry: text(),
    planName: text(),
    kind: mysqlEnum(["new", "expansion", "reactivation", "contraction", "churn"]).notNull(),
    /** Why a `churn` happened, when known: rows recorded before this was kept have none. */
    churnReason: mysqlEnum(CHURN_REASONS),
    /** When a `scheduled` churn takes effect: the subscription runs, paid, until then. */
    endsAt: instant(),
    /** Signed change of monthly recurring revenue. */
    amount: money().notNull(),
    currency: currency().notNull(),
    occurredAt: instant().notNull(),
    origin: mysqlEnum(DATA_ORIGINS).notNull(),
    /** Stripe event that revealed the change, when there is one. */
    stripeEventId: stripeId(),
    createdAt: instant().default(now).notNull(),
  },
  (table) => [
    index("mrr_movements_account_id_occurred_at_index").on(table.accountId, table.occurredAt),
    // A subscription's history decides between "new" and "reactivation".
    index("mrr_movements_account_id_stripe_subscription_id_index").on(
      table.accountId,
      table.stripeSubscriptionId,
    ),
    // New and churned customers of the month are derived from each customer's movements.
    index("mrr_movements_account_id_stripe_customer_id_index").on(
      table.accountId,
      table.stripeCustomerId,
    ),
  ],
);

/**
 * The coupons of each Stripe account read so far. Deleting a coupon only stops new redemptions:
 * existing discounts keep applying, but Stripe no longer returns the coupon, so its terms are read
 * here (see `loadCoupons` in src/server/stripe/catalog.ts).
 */
export const stripeCoupons = mysqlTable(
  "stripe_coupons",
  {
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    couponId: stripeId().notNull(),
    /** The app's own shape (`Coupon`): a field added to it needs a fallback for older rows. */
    terms: json().$type<CouponTerms>().notNull(),
    updatedAt: instant().default(now).notNull(),
  },
  (table) => [primaryKey({ columns: [table.accountId, table.couponId] })],
);

/** Successful charges, used for revenue metrics and the "payment received" moments. */
export const payments = mysqlTable(
  "payments",
  {
    id: id(),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    stripeChargeId: stripeId().notNull(),
    stripeCustomerId: stripeId(),
    customerName: text(),
    customerEmail: text(),
    customerCountry: text(),
    description: text(),
    /** Gross amount charged. */
    amount: money().notNull(),
    amountRefunded: money().notNull().default(0),
    currency: currency().notNull(),
    /**
     * The Stripe Connect account a destination charge was made for: the money is theirs, and
     * the account's revenue is `applicationFee`. `null` for the account's own payments.
     */
    connectedAccountId: stripeId(),
    applicationFee: money(),
    occurredAt: instant().notNull(),
    origin: mysqlEnum(DATA_ORIGINS).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payments_account_id_stripe_charge_id_index").on(
      table.accountId,
      table.stripeChargeId,
    ),
    index("payments_account_id_occurred_at_index").on(table.accountId, table.occurredAt),
  ],
);

/**
 * Stripe customers created lately, often sign-ups that have not paid yet: the "new customer"
 * moments of the feed and today's count. Only recent ones are imported (see `newBackfill`), and
 * deleted ones are removed. Emails are never stored: screens don't show them.
 */
export const customers = mysqlTable(
  "customers",
  {
    id: id(),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    stripeCustomerId: stripeId().notNull(),
    name: text(),
    email: text(),
    /** ISO 3166-1 alpha-2 country code. */
    country: text(),
    /** When Stripe created the customer. */
    occurredAt: instant().notNull(),
    origin: mysqlEnum(DATA_ORIGINS).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_account_id_stripe_customer_id_index").on(
      table.accountId,
      table.stripeCustomerId,
    ),
    index("customers_account_id_occurred_at_index").on(table.accountId, table.occurredAt),
  ],
);

/** A wall display. Anyone with its public URL can view it, so it never exposes secrets. */
export const screens = mysqlTable(
  "screens",
  {
    id: id(),
    workspaceId: authId()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    /** Unguessable secret in the public URL (`/d/<token>`). Regenerating it revokes old links. */
    publicToken: identifier({ length: 64 }).notNull().unique(),
    settings: json().$type<ScreenSettings>().notNull(),
    /**
     * Optional password asked before showing the screen, on top of its token (hashed like the
     * passwords of users). Browsers that typed it keep a proof of it (`src/server/screen-access.ts`).
     */
    passwordHash: text(),
    /** Last "send a test celebration" request, picked up by open displays. */
    testEventAt: instant(),
    ...timestamps,
  },
  (table) => [index("screens_workspace_id_index").on(table.workspaceId)],
);

export const screenAccounts = mysqlTable(
  "screen_accounts",
  {
    screenId: uuid()
      .notNull()
      .references(() => screens.id, { onDelete: "cascade" }),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.screenId, table.accountId] })],
);

/**
 * Cached exchange rates, refreshed every 12 hours (`src/server/fx.ts`), to combine accounts billed
 * in different currencies.
 */
export const exchangeRates = mysqlTable("exchange_rates", {
  base: currency().primaryKey(),
  /** Units of each quote currency for one unit of `base`, keyed by lowercase ISO code. */
  rates: json().$type<Record<string, number>>().notNull(),
  fetchedAt: instant().notNull(),
});

export const stripeAccountsRelations = relations(stripeAccounts, ({ one, many }) => ({
  workspace: one(organizations, {
    fields: [stripeAccounts.workspaceId],
    references: [organizations.id],
  }),
  screenAccounts: many(screenAccounts),
}));

export const screensRelations = relations(screens, ({ one, many }) => ({
  workspace: one(organizations, {
    fields: [screens.workspaceId],
    references: [organizations.id],
  }),
  screenAccounts: many(screenAccounts),
}));

export const screenAccountsRelations = relations(screenAccounts, ({ one }) => ({
  screen: one(screens, { fields: [screenAccounts.screenId], references: [screens.id] }),
  account: one(stripeAccounts, {
    fields: [screenAccounts.accountId],
    references: [stripeAccounts.id],
  }),
}));
