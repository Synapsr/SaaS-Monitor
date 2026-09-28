import Link from "next/link";
import type { StripeAccountSummary } from "@/server/stripe/accounts";
import { ModeBadge, MrrValue, SyncStatus, UpdatesStatus } from "./account-status";

/** Compact list of the workspace's Stripe accounts for the home page. */
export function AccountsOverview({ accounts }: { accounts: StripeAccountSummary[] }) {
  return (
    <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_8rem]"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href="/app/accounts"
                className="truncate rounded-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {account.name}
              </Link>
              <ModeBadge livemode={account.livemode} />
            </div>
            <p className="text-sm">
              <SyncStatus account={account} />
            </p>
          </div>
          <p className="col-start-1 row-start-2 text-sm sm:col-start-2 sm:row-start-1">
            <UpdatesStatus updates={account.updates} />
          </p>
          {account.mrr && (
            <div className="col-start-2 row-span-2 row-start-1 text-right sm:col-start-3 sm:row-span-1">
              <MrrValue mrr={account.mrr} className="text-lg font-semibold tracking-tight" />
              <p className="text-xs text-muted-foreground">MRR</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
