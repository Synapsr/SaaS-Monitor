import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ScreenSettings } from "@/lib/screens/settings";
import { organizations } from "./auth";

// Column names are derived from keys (snake_case), see `casing` in drizzle.config.ts.
// Money is always an integer amount in the currency's minor unit (cents), like in Stripe.

const timestamptz = () => timestamp({ withTimezone: true });
const money = () => bigint({ mode: "number" });

const timestamps = {
  createdAt: timestamptz().defaultNow().notNull(),
  updatedAt: timestamptz()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const stripeAccountStatus = pgEnum("stripe_account_status", ["importing", "ready", "error"]);

/** How a row entered the database. Only `live` rows trigger sounds and celebrations. */
export const dataOrigin = pgEnum("data_origin", ["backfill", "live", "reconcile"]);

export const mrrMovementKind = pgEnum("mrr_movement_kind", [
  "new",
  "expansion",
  "reactivation",
  "contraction",
  "churn",
]);

/** Resumable state of the initial import, so large accounts can be imported in several runs. */
export interface BackfillProgress {
  phase: "subscriptions" | "payments";
  /** Stripe pagination cursor (`starting_after`) within the current phase. */
  cursor: string | null;
  startedAt: string;
  subscriptions: number;
  payments: number;
}

/** A Stripe account connected to a workspace with a (preferably restricted, read-only) API key. */
export const stripeAccounts = pgTable(
  "stripe_accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    /** `acct_…` identifier, used to prevent connecting the same account twice. */
    stripeAccountId: text(),
    livemode: boolean().notNull(),
    /** API key encrypted with ENCRYPTION_KEY, see src/server/crypto.ts. Never sent to clients. */
    encryptedSecretKey: text().notNull(),
    /** Masked key for the UI, e.g. `rk_live_…4f2a`. */
    secretKeyHint: text().notNull(),
    defaultCurrency: text(),
    status: stripeAccountStatus().notNull().default("importing"),
    lastError: text(),
    backfill: jsonb().$type<BackfillProgress>(),
    /** Unix time (seconds) of the newest Stripe event applied by the incremental sync. */
    eventsCursor: bigint({ mode: "number" }),
    lastSyncedAt: timestamptz(),
    lastReconciledAt: timestamptz(),
    /** Sync lease: a sync may only start when this is null or in the past. */
    syncLockedUntil: timestamptz(),
    /** Set by incoming webhooks: a sync must run as soon as possible. */
    syncRequestedAt: timestamptz(),
    /**
     * Instant updates. Stripe caps read requests (~500 per transaction over 30 days), so polling
     * is slow for small accounts; a webhook tells us exactly when to sync. The endpoint id is set
     * when the app created the endpoint itself, so it can remove it on disconnect.
     */
    webhookEndpointId: text(),
    encryptedWebhookSecret: text(),
    lastWebhookAt: timestamptz(),
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId),
    uniqueIndex().on(table.workspaceId, table.stripeAccountId),
  ],
);

/** Local mirror of every Stripe subscription, with its current contribution to MRR. */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text().notNull(),
    stripeCustomerId: text().notNull(),
    customerName: text(),
    /** ISO 3166-1 alpha-2 country code. */
    customerCountry: text(),
    /** Stripe status: active, past_due, trialing, canceled, unpaid, paused, incomplete… */
    status: text().notNull(),
    currency: text().notNull(),
    /** Monthly-normalized recurring amount after discounts; 0 when the subscription is not paying. */
    mrr: money().notNull(),
    planName: text(),
    /** Billing interval of the main item: day, week, month or year. */
    billingInterval: text(),
    startedAt: timestamptz().notNull(),
    trialEndsAt: timestamptz(),
    canceledAt: timestamptz(),
    endedAt: timestamptz(),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.accountId, table.stripeSubscriptionId),
    index().on(table.accountId, table.stripeCustomerId),
  ],
);

/**
 * Ledger of MRR changes. The running sum per account and currency equals the current MRR, which
 * gives the MRR history chart and the new/expansion/contraction/churn breakdown.
 */
export const mrrMovements = pgTable(
  "mrr_movements",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text().notNull(),
    stripeCustomerId: text().notNull(),
    customerName: text(),
    customerCountry: text(),
    planName: text(),
    kind: mrrMovementKind().notNull(),
    /** Signed change of monthly recurring revenue. */
    amount: money().notNull(),
    currency: text().notNull(),
    occurredAt: timestamptz().notNull(),
    origin: dataOrigin().notNull(),
    /** Stripe event that revealed the change, when there is one. */
    stripeEventId: text(),
    createdAt: timestamptz().defaultNow().notNull(),
  },
  (table) => [index().on(table.accountId, table.occurredAt)],
);

/** Successful charges, used for revenue metrics and the "payment received" moments. */
export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: uuid()
      .notNull()
      .references(() => stripeAccounts.id, { onDelete: "cascade" }),
    stripeChargeId: text().notNull(),
    stripeCustomerId: text(),
    customerName: text(),
    customerCountry: text(),
    description: text(),
    /** Gross amount charged. */
    amount: money().notNull(),
    amountRefunded: money().notNull().default(0),
    currency: text().notNull(),
    occurredAt: timestamptz().notNull(),
    origin: dataOrigin().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.accountId, table.stripeChargeId),
    index().on(table.accountId, table.occurredAt),
  ],
);

/** A wall display. Anyone with its public URL can view it, so it never exposes secrets. */
export const screens = pgTable(
  "screens",
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    /** Unguessable secret in the public URL (`/d/<token>`). Regenerating it revokes old links. */
    publicToken: text().notNull().unique(),
    settings: jsonb().$type<ScreenSettings>().notNull(),
    /** Last "send a test celebration" request, picked up by open displays. */
    testEventAt: timestamptz(),
    ...timestamps,
  },
  (table) => [index().on(table.workspaceId)],
);

export const screenAccounts = pgTable(
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

/** Cached exchange rates, refreshed daily, to combine accounts billed in different currencies. */
export const exchangeRates = pgTable("exchange_rates", {
  base: text().primaryKey(),
  /** Units of each quote currency for one unit of `base`, keyed by lowercase ISO code. */
  rates: jsonb().$type<Record<string, number>>().notNull(),
  fetchedAt: timestamptz().notNull(),
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
