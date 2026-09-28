import { CircleAlertIcon } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import type { StripeAccountSummary } from "@/server/stripe/accounts";
import { AccountActions } from "./account-actions";
import { ModeBadge, MrrValue, SyncStatus } from "./account-status";
import { ImportProgress } from "./import-progress";
import { InstantUpdates } from "./instant-updates";
import { ReimportButton } from "./reimport-button";

export function AccountCard({
  account,
  webhookInstructions,
}: {
  account: StripeAccountSummary;
  /** Only for accounts still polling: what to configure in Stripe for instant updates. */
  webhookInstructions: { url: string; events: string[] } | null;
}) {
  const lastEventAt = account.updates.mode === "webhook" ? account.updates.lastEventAt : null;
  return (
    <article
      aria-labelledby={`account-${account.id}`}
      className="rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <header className="flex items-start gap-4 p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 id={`account-${account.id}`} className="truncate text-base font-medium">
              {account.name}
            </h2>
            <ModeBadge livemode={account.livemode} />
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">{account.keyHint}</p>
        </div>
        {account.mrr && (
          <div className="text-right">
            <MrrValue mrr={account.mrr} className="text-xl font-semibold tracking-tight" />
            <p className="text-xs text-muted-foreground">MRR</p>
          </div>
        )}
        <AccountActions account={{ id: account.id, name: account.name }} />
      </header>

      <dl className="divide-y border-t">
        <Row label="Data">
          {account.status === "error" ? (
            <ErrorDetails accountId={account.id} message={account.lastError} />
          ) : (
            <SyncStatus account={account} />
          )}
          {account.status === "importing" && <ImportingDetails />}
        </Row>
        <Row label="Updates">
          <InstantUpdates
            accountId={account.id}
            livemode={account.livemode}
            updates={account.updates}
            lastEventLabel={lastEventAt && formatRelativeTime(lastEventAt)}
            instructions={webhookInstructions}
          />
        </Row>
      </dl>
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted-foreground sm:pt-px">{label}</dt>
      <dd className="flex min-w-0 flex-col gap-3">{children}</dd>
    </div>
  );
}

function ImportingDetails() {
  return (
    <>
      <ImportProgress className="max-w-sm" />
      <p className="text-pretty text-muted-foreground">
        The first import reads your whole Stripe history, a few minutes for large accounts. Screens
        show “Importing” until it’s done.
      </p>
    </>
  );
}

function ErrorDetails({ accountId, message }: { accountId: string; message: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 font-medium text-destructive">
        <CircleAlertIcon className="size-4 shrink-0" />
        Needs attention
      </p>
      {message && <p className="text-pretty">{message}</p>}
      <p className="text-pretty text-muted-foreground">
        Most often the key was revoked or lost a permission. Fix the key in Stripe (it is checked
        again every 30 minutes), or create a new restricted key and{" "}
        <Link
          href="/app/accounts/new"
          className="font-medium text-foreground underline underline-offset-4"
        >
          connect the account again
        </Link>
        : your imported data is kept.
      </p>
      <div className="pt-1">
        <ReimportButton accountId={accountId} />
      </div>
    </div>
  );
}
