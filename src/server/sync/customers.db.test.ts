import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { customerSchema } from "@/server/stripe/normalize";
import type { Customer } from "@/server/stripe/types";
import { createUserWithWorkspace, resetDatabase } from "@/test/db";
import { JANUARY_1, stripeCustomer } from "@/test/stripe-fixtures";
import { createStripeAccount } from "@/test/stripe-accounts";
import type { DataOrigin } from "./apply";
import { applyCustomers, deleteCustomers } from "./customers";

describe("customers", () => {
  let workspaceId: string;
  let accountId: string;

  beforeEach(async () => {
    await resetDatabase();
    ({ workspaceId } = await createUserWithWorkspace());
    accountId = (await createStripeAccount(workspaceId, { status: "ready", backfill: null })).id;
  });

  const ada = (overrides: Parameters<typeof stripeCustomer>[0] = {}) =>
    customerSchema.parse(
      stripeCustomer({ id: "cus_ada", name: "Ada Lovelace", country: "GB", ...overrides }),
    );

  const apply = (
    changes: { created: Customer[]; updated?: Customer[] },
    origin: DataOrigin = "live",
    account = accountId,
  ) => db().transaction((tx) => applyCustomers(tx, account, changes, origin));

  const stored = (account = accountId) =>
    db()
      .select({
        id: customers.stripeCustomerId,
        name: customers.name,
        country: customers.country,
        occurredAt: customers.occurredAt,
        origin: customers.origin,
      })
      .from(customers)
      .where(eq(customers.accountId, account))
      .orderBy(asc(customers.stripeCustomerId));

  it("records a new customer once, with the origin it was first seen with", async () => {
    expect(await apply({ created: [ada()] }, "backfill")).toBe(1);
    // Its `customer.created` event, read after the import: nothing to celebrate.
    expect(await apply({ created: [ada()] }, "live")).toBe(0);

    expect(await stored()).toEqual([
      {
        id: "cus_ada",
        name: "Ada Lovelace",
        country: "GB",
        occurredAt: new Date(JANUARY_1 * 1000),
        origin: "backfill",
      },
    ]);
  });

  it("keeps the name and country of a known customer up to date", async () => {
    await apply({ created: [ada({ name: null, country: null })] });

    expect(await apply({ created: [], updated: [ada()] })).toBe(1);
    expect(await apply({ created: [], updated: [ada()] })).toBe(0);
    expect(await stored()).toMatchObject([{ name: "Ada Lovelace", country: "GB", origin: "live" }]);
  });

  it("never takes the update of an unknown customer for a sign-up", async () => {
    expect(await apply({ created: [], updated: [ada()] })).toBe(0);

    expect(await stored()).toEqual([]);
  });

  it("forgets deleted customers, in their own account only", async () => {
    const other = (await createStripeAccount(workspaceId, { stripeAccountId: "acct_other" })).id;
    await apply({ created: [ada(), ada({ id: "cus_bob" })] });
    await apply({ created: [ada()] }, "live", other);

    const deleted = await db().transaction((tx) =>
      deleteCustomers(tx, accountId, ["cus_ada", "cus_unknown"]),
    );

    expect(deleted).toBe(1);
    expect((await stored()).map(({ id }) => id)).toEqual(["cus_bob"]);
    expect((await stored(other)).map(({ id }) => id)).toEqual(["cus_ada"]);
  });
});
