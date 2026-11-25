import { ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ConnectAccountForm } from "@/components/app/accounts/connect-account-form";
import { ConnectRevenueCatForm } from "@/components/app/accounts/connect-revenuecat-form";
import { ConnectStep } from "@/components/app/accounts/connect-step";
import { KeyPermissions } from "@/components/app/accounts/key-permissions";
import { RevenueCatKeyPermissions } from "@/components/app/accounts/revenuecat-key-permissions";
import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import type { AccountProvider } from "@/lib/account-providers";
import { REVENUECAT_DASHBOARD_URL } from "@/lib/revenuecat-permissions";
import { siteConfig } from "@/lib/site";
import { restrictedKeyCreationUrl } from "@/lib/stripe-permissions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Connect account" };

const PROVIDERS: readonly { id: AccountProvider; name: string; summary: string }[] = [
  { id: "stripe", name: "Stripe", summary: "Web subscriptions, invoices & charges" },
  {
    id: "revenuecat",
    name: "RevenueCat",
    summary: "App Store, Google Play & mobile subscriptions",
  },
];

export default async function ConnectAccountPage({ searchParams }: PageProps<"/app/accounts/new">) {
  const params = await searchParams;
  const provider: AccountProvider = params.provider === "revenuecat" ? "revenuecat" : "stripe";
  const keyUrl = restrictedKeyCreationUrl(siteConfig.name);
  const testKeyUrl = keyUrl.replace("dashboard.stripe.com/", "dashboard.stripe.com/test/");

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/app/accounts">Accounts</BackLink>
      <PageHeader
        title={
          provider === "revenuecat" ? "Connect a RevenueCat project" : "Connect a Stripe account"
        }
        description={
          provider === "revenuecat"
            ? "Takes about a minute. Your MRR, charts and revenue are imported from RevenueCat, and webhooks stream live sales."
            : "Takes about a minute. Your subscriptions and payments are imported once, then kept in sync."
        }
      />

      <div role="tablist" aria-label="Revenue source" className="mb-6 grid gap-3 sm:grid-cols-2">
        {PROVIDERS.map((option) => {
          const active = option.id === provider;
          return (
            <Link
              key={option.id}
              href={
                option.id === "revenuecat"
                  ? "/app/accounts/new?provider=revenuecat"
                  : "/app/accounts/new"
              }
              role="tab"
              aria-selected={active}
              className={cn(
                "flex flex-col gap-0.5 rounded-xl bg-card px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active ? "ring-2 ring-foreground" : "ring-1 ring-foreground/10 hover:bg-muted/40",
              )}
            >
              <span className="font-medium">{option.name}</span>
              <span className="text-sm text-muted-foreground">{option.summary}</span>
            </Link>
          );
        })}
      </div>

      {provider === "revenuecat" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-6">
          <ConnectStep
            number={1}
            title="Create an API v2 secret key in RevenueCat"
            className="lg:col-start-1"
          >
            <p className="text-sm text-pretty text-muted-foreground">
              Open your project in RevenueCat, go to{" "}
              <span className="font-medium text-foreground">Project Settings › API keys</span>,
              click <span className="font-medium text-foreground">+ New</span>, pick{" "}
              <span className="font-medium text-foreground">V2</span>, and select the permissions
              listed on the right.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button asChild size="lg">
                <a href={REVENUECAT_DASHBOARD_URL} target="_blank" rel="noreferrer">
                  Open RevenueCat Dashboard
                  <ArrowUpRightIcon data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </ConnectStep>

          <section
            aria-labelledby="rc-permissions-title"
            className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <div className="flex flex-col gap-1">
              <h2 id="rc-permissions-title" className="font-medium">
                Permissions (API v2)
              </h2>
              <p className="text-sm text-pretty text-muted-foreground">
                Set these on your RevenueCat secret key and leave everything else unchecked.
              </p>
            </div>
            <RevenueCatKeyPermissions />
          </section>

          <ConnectStep number={2} title="Paste it here" className="lg:col-start-1">
            <ConnectRevenueCatForm />
          </ConnectStep>
        </div>
      ) : (
        /* On small screens the permissions sit between both steps, where they are needed. */
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-6">
          <ConnectStep
            number={1}
            title="Create a restricted key in Stripe"
            className="lg:col-start-1"
          >
            <p className="text-sm text-pretty text-muted-foreground">
              This opens Stripe with the right permissions selected. Check them against the list,
              then click <span className="font-medium text-foreground">Create key</span>.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button asChild size="lg">
                <a href={keyUrl} target="_blank" rel="noreferrer">
                  Create a restricted key on Stripe
                  <ArrowUpRightIcon data-icon="inline-end" />
                </a>
              </Button>
              <a
                href={testKeyUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Or a test mode key
              </a>
            </div>
          </ConnectStep>

          <section
            aria-labelledby="permissions-title"
            className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <div className="flex flex-col gap-1">
              <h2 id="permissions-title" className="font-medium">
                Permissions
              </h2>
              <p className="text-sm text-pretty text-muted-foreground">
                Set these in Stripe and leave everything else on None.
              </p>
            </div>
            <KeyPermissions />
          </section>

          <ConnectStep number={2} title="Paste it here" className="lg:col-start-1">
            <ConnectAccountForm />
          </ConnectStep>
        </div>
      )}
    </div>
  );
}
