import { CircleAlertIcon, KeyRoundIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { providerLabel, type AccountProvider } from "@/lib/account-providers";
import { formatRelativeTime } from "@/lib/format";
import type { StripeAccountSummary } from "@/server/stripe/accounts";
import { AccountActions } from "./account-actions";
import { ModeBadge, MrrValue, ProviderBadge, SyncStatus } from "./account-status";
import { ImportProgress } from "./import-progress";
import { InstantUpdates } from "./instant-updates";

export function AccountCard({
  account,
  webhookInstructions,
}: {
  account: StripeAccountSummary;
  /** Only for accounts still polling: what to configure in the provider for instant updates. */
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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 id={`account-${account.id}`} className="truncate text-base font-medium">
              {account.name}
            </h2>
            <ProviderBadge provider={account.provider} />
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
        <AccountActions
          account={{ id: account.id, name: account.name, provider: account.provider }}
          // Accounts only fail when their key needs a fix: nothing could be imported again.
          canReimport={account.status !== "error"}
        />
      </header>

      <dl className="divide-y border-t">
        <Row label="Data">
          {account.status === "error" ? (
            <ErrorDetails provider={account.provider} message={account.lastError} />
          ) : (
            <SyncStatus account={account} />
          )}
          {account.status === "importing" && <ImportingDetails provider={account.provider} />}
        </Row>
        <Row label="Updates">
          <InstantUpdates
            accountId={account.id}
            provider={account.provider}
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

function ImportingDetails({ provider }: { provider: AccountProvider }) {
  return (
    <>
      <ImportProgress className="max-w-sm" />
      <p className="text-pretty text-muted-foreground">
        {provider === "revenuecat"
          ? "Importing your MRR, charts and revenue from RevenueCat. This usually takes a few seconds."
          : "The first import reads your whole Stripe history, a few minutes for large accounts. Screens show “Importing” until it’s done."}
      </p>
    </>
  );
}

/**
 * Accounts only fail when their key needs a fix (revoked, missing a permission, undecryptable):
 * connecting again with a new key replaces it and keeps the data, while a re-import would drop it.
 */
function ErrorDetails({
  provider,
  message,
}: {
  provider: AccountProvider;
  message: string | null;
}) {
  const providerName = providerLabel(provider);
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 font-medium text-destructive">
        <CircleAlertIcon className="size-4 shrink-0" />
        Needs attention
      </p>
      {message && <p className="text-pretty">{message}</p>}
      <p className="text-pretty text-muted-foreground">
        Most often the key was revoked or lost a permission. Fix the key in {providerName} (it is
        checked again every 30 minutes), or connect the account again with a new key: your imported
        data is kept.
      </p>
      <div className="pt-1">
        <Button asChild variant="outline" size="sm">
          <Link
            href={
              provider === "revenuecat"
                ? "/app/accounts/new?provider=revenuecat"
                : "/app/accounts/new"
            }
          >
            <KeyRoundIcon data-icon="inline-start" />
            Connect with a new key
          </Link>
        </Button>
      </div>
    </div>
  );
}
