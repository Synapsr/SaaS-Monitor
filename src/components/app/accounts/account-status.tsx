import { CircleAlertIcon, ClockIcon, ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatApproximateDuration, formatCount, formatRelativeTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { StripeAccountSummary } from "@/server/stripe/accounts";

// Relative times are computed where these render: keep them in server components so the HTML
// never disagrees with the browser's clock during hydration.

export function ModeBadge({ livemode, className }: { livemode: boolean; className?: string }) {
  return livemode ? (
    <Badge variant="outline" className={cn("text-muted-foreground", className)}>
      Live
    </Badge>
  ) : (
    <Badge
      className={cn(
        "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
        className,
      )}
    >
      Test mode
    </Badge>
  );
}

export function SyncStatus({ account }: { account: StripeAccountSummary }) {
  if (account.status === "importing") {
    const progress = account.importProgress;
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Spinner aria-hidden="true" role="presentation" className="size-3.5" />
        <span>
          Importing history
          {progress && (
            <span className="tabular-nums">
              {" "}
              · {formatCount(progress.subscriptions)} subscriptions,{" "}
              {formatCount(progress.payments)} payments
            </span>
          )}
        </span>
      </span>
    );
  }
  if (account.status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-destructive">
        <CircleAlertIcon className="size-3.5" />
        Needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
      Up to date
      {account.lastSyncedAt && ` · synced ${formatRelativeTime(account.lastSyncedAt)}`}
    </span>
  );
}

export function UpdatesStatus({ updates }: { updates: StripeAccountSummary["updates"] }) {
  if (updates.mode === "webhook") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
        <ZapIcon className="size-3.5" />
        Instant updates
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <ClockIcon className="size-3.5" />
      Checks Stripe every {formatApproximateDuration(updates.intervalSeconds)}
    </span>
  );
}

export function MrrValue({
  mrr,
  className,
}: {
  mrr: NonNullable<StripeAccountSummary["mrr"]>;
  className?: string;
}) {
  return (
    <span className={cn("tabular-nums", className)}>{formatMoney(mrr.amount, mrr.currency)}</span>
  );
}
