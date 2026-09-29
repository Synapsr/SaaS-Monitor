import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { Transaction } from "@/db";
import { customers } from "@/db/schema";
import type { Customer } from "@/server/stripe/types";
import type { DataOrigin } from "./apply";

/**
 * Records the customers Stripe `created` lately, and keeps the name and country of those already
 * recorded up to date. `updated` customers are only refreshed, never added: the update of someone
 * who signed up long ago is no sign-up. A customer seen again (replayed event, scan) keeps its
 * origin, so it is never celebrated twice. Stored rows are locked first, like subscriptions.
 * Returns how many customers were added or changed.
 */
export async function applyCustomers(
  tx: Transaction,
  accountId: string,
  { created, updated = [] }: { created: readonly Customer[]; updated?: readonly Customer[] },
  origin: DataOrigin,
): Promise<number> {
  const seen = [...created, ...updated];
  if (!seen.length) return 0;

  const storedRows = await tx
    .select({
      id: customers.id,
      stripeCustomerId: customers.stripeCustomerId,
      name: customers.name,
      country: customers.country,
    })
    .from(customers)
    .where(
      and(
        eq(customers.accountId, accountId),
        inArray(
          customers.stripeCustomerId,
          seen.map((customer) => customer.id),
        ),
      ),
    )
    .for("update");
  const stored = new Map(storedRows.map((row) => [row.stripeCustomerId, row]));

  let changed = 0;
  for (const customer of seen) {
    const previous = stored.get(customer.id);
    if (previous && (previous.name !== customer.name || previous.country !== customer.country)) {
      await tx
        .update(customers)
        .set({ name: customer.name, country: customer.country })
        .where(eq(customers.id, previous.id));
      changed += 1;
    }
  }
  const added = created.filter((customer) => !stored.has(customer.id));
  if (added.length) {
    // A concurrent insert of the same customer fails here, and the sync is retried later.
    await tx.insert(customers).values(
      added.map((customer) => ({
        accountId,
        stripeCustomerId: customer.id,
        name: customer.name,
        country: customer.country,
        occurredAt: new Date(customer.created * 1000),
        origin,
      })),
    );
  }
  return added.length + changed;
}

/** Forgets deleted customers: spam and test data leave the screen with them. */
export async function deleteCustomers(
  tx: Transaction,
  accountId: string,
  customerIds: readonly string[],
): Promise<number> {
  if (!customerIds.length) return 0;
  const [{ affectedRows }] = await tx
    .delete(customers)
    .where(
      and(
        eq(customers.accountId, accountId),
        inArray(customers.stripeCustomerId, [...customerIds]),
      ),
    );
  return affectedRows;
}
