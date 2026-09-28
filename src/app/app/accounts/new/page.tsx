import { ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { ConnectAccountForm } from "@/components/app/accounts/connect-account-form";
import { ConnectStep } from "@/components/app/accounts/connect-step";
import { KeyPermissions } from "@/components/app/accounts/key-permissions";
import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { restrictedKeyCreationUrl } from "@/lib/stripe-permissions";

export const metadata: Metadata = { title: "Connect Stripe" };

export default function ConnectAccountPage() {
  const keyUrl = restrictedKeyCreationUrl(siteConfig.name);
  const testKeyUrl = keyUrl.replace("dashboard.stripe.com/", "dashboard.stripe.com/test/");

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/app/accounts">Stripe accounts</BackLink>
      <PageHeader
        title="Connect a Stripe account"
        description="Takes about a minute. Your subscriptions and payments are imported once, then kept in sync."
      />
      {/* On small screens the permissions sit between both steps, where they are needed. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-6">
        <ConnectStep
          number={1}
          title="Create a restricted key in Stripe"
          className="lg:col-start-1"
        >
          <p className="text-sm text-pretty text-muted-foreground">
            This opens Stripe with the right permissions selected. Check them against the list, then
            click <span className="font-medium text-foreground">Create key</span>.
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
    </div>
  );
}
