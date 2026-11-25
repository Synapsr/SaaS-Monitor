"use client";

import { ArrowUpRightIcon, ChevronRightIcon, ClockIcon, ZapIcon } from "lucide-react";
import { startTransition, useActionState, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  enableInstantUpdatesAction,
  saveWebhookSecretAction,
} from "@/app/(product)/app/accounts/actions";
import { CopyCode, CopyField } from "@/components/app/copy-button";
import { SecretInput } from "@/components/secret-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/lib/action-result";
import { providerLabel, type AccountProvider } from "@/lib/account-providers";
import { formatApproximateDuration } from "@/lib/format";
import { REVENUECAT_DASHBOARD_URL } from "@/lib/revenuecat-permissions";
import { siteConfig } from "@/lib/site";
import type { StripeAccountSummary } from "@/server/stripe/accounts";

interface WebhookInstructions {
  url: string;
  events: string[];
}

/**
 * How new activity reaches the app. Polling works everywhere but is slow; a webhook makes
 * sales show up (and play their sound) within seconds.
 */
export function InstantUpdates({
  accountId,
  provider,
  livemode,
  updates,
  lastEventLabel,
  instructions,
}: {
  accountId: string;
  provider: AccountProvider;
  livemode: boolean;
  updates: StripeAccountSummary["updates"];
  /** "3 minutes ago", computed on the server. */
  lastEventLabel: string | null;
  instructions: WebhookInstructions | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [enabling, startEnabling] = useTransition();
  const providerName = providerLabel(provider);

  if (updates.mode === "webhook") {
    return (
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
          <ZapIcon className="size-4" />
          Instant updates are on
        </p>
        <p className="text-sm text-muted-foreground">
          {providerName} notifies {siteConfig.name} of every change.{" "}
          {lastEventLabel ? `Last event ${lastEventLabel}.` : "No event received yet."}
        </p>
      </div>
    );
  }

  function enable() {
    setError(null);
    startEnabling(async () => {
      const result = await enableInstantUpdatesAction(accountId);
      if (result.ok) {
        toast.success("Instant updates are on.");
        return;
      }
      setError(result.error);
      setManualOpen(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1.5 font-medium">
            <ClockIcon className="size-4 text-muted-foreground" />
            Checks {providerName} every {formatApproximateDuration(updates.intervalSeconds)}
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            {provider === "revenuecat"
              ? "Turn on webhooks to see live purchases in the feed and hear each sale the moment it happens."
              : "Turn on instant updates to hear each sale the moment it happens."}
          </p>
        </div>
        <Button variant="outline" onClick={enable} disabled={enabling} className="shrink-0">
          {enabling ? <Spinner /> : <ZapIcon data-icon="inline-start" />}
          Enable instant updates
        </Button>
      </div>

      {error && (
        <Alert>
          <ZapIcon />
          <AlertTitle>Instant updates couldn’t be turned on automatically</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <p>You can still set them up by hand in {providerName}, see below.</p>
          </AlertDescription>
        </Alert>
      )}

      {instructions && (
        <Collapsible open={manualOpen} onOpenChange={setManualOpen}>
          <CollapsibleTrigger className="group/trigger flex items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            <ChevronRightIcon className="size-4 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
            Set it up manually in {providerName}
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <ManualWebhookSetup
              accountId={accountId}
              provider={provider}
              livemode={livemode}
              instructions={instructions}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function ManualWebhookSetup({
  accountId,
  provider,
  livemode,
  instructions,
}: {
  accountId: string;
  provider: AccountProvider;
  livemode: boolean;
  instructions: WebhookInstructions;
}) {
  const [secret, setSecret] = useState("");
  const [state, save, pending] = useActionState(async (_: ActionResult | null, value: string) => {
    const result = await saveWebhookSecretAction(accountId, value);
    if (result.ok) toast.success("Instant updates are on.");
    return result;
  }, null);
  const error = state && !state.ok ? state.error : null;
  const id = useId();
  const isRevenueCat = provider === "revenuecat";
  const webhooksUrl = isRevenueCat
    ? REVENUECAT_DASHBOARD_URL
    : `https://dashboard.stripe.com/${livemode ? "" : "test/"}webhooks`;

  return (
    <ol className="mt-4 flex flex-col gap-5 border-l pl-5 text-sm">
      <li className="flex flex-col gap-2">
        <p className="text-pretty">
          <span className="font-medium">
            In {providerLabel(provider)}, add a webhook {isRevenueCat ? "integration" : "endpoint"}
          </span>{" "}
          <span className="text-muted-foreground">
            {isRevenueCat
              ? "(Project › Integrations › Webhooks) with this URL:"
              : "(Developers › Webhooks) with this URL:"}
          </span>
        </p>
        <CopyField value={instructions.url} label="Endpoint URL" />
        <a
          href={webhooksUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 self-start rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Open {isRevenueCat ? "RevenueCat" : "webhooks in Stripe"}
          <ArrowUpRightIcon className="size-3.5" />
        </a>
      </li>
      <li className="flex flex-col gap-2">
        <p>
          <span className="font-medium">Select these events</span>{" "}
          <span className="text-muted-foreground">({instructions.events.length})</span>
        </p>
        <CopyCode code={instructions.events.join("\n")} label="events" />
      </li>
      <li>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() => save(secret));
          }}
          className="flex flex-col gap-2"
        >
          <Field>
            <FieldLabel htmlFor={`${id}-secret`}>
              {isRevenueCat
                ? "Paste the Authorization header or HMAC signing secret"
                : "Paste the endpoint’s signing secret"}
            </FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="sm:flex-1">
                <SecretInput
                  id={`${id}-secret`}
                  secretName={isRevenueCat ? "webhook secret" : "signing secret"}
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  placeholder={isRevenueCat ? "Bearer … or signing secret" : "whsec_…"}
                  autoComplete="off"
                  spellCheck={false}
                  required
                  className="font-mono text-[0.8rem]"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
              </div>
              <Button type="submit" size="lg" disabled={pending}>
                {pending && <Spinner />}
                Save
              </Button>
            </div>
            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          </Field>
        </form>
      </li>
    </ol>
  );
}
