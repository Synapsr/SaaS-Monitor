import { CreditCardIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountCard } from "@/components/app/accounts/account-card";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { revenueCatWebhookSetupInstructions } from "@/server/revenuecat/webhooks";
import { requireWorkspace } from "@/server/session";
import { listStripeAccountSummaries } from "@/server/stripe/accounts";
import { webhookSetupInstructions } from "@/server/stripe/webhooks";
import { scheduleSync } from "@/server/sync";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const { workspace } = await requireWorkspace();
  const accounts = await listStripeAccountSummaries(workspace.id);
  scheduleSync(accounts.map((account) => account.id));
  const importing = accounts.some((account) => account.status === "importing");

  const connectButton = (
    <Button asChild>
      <Link href="/app/accounts/new">
        <PlusIcon data-icon="inline-start" />
        Connect account
      </Link>
    </Button>
  );

  return (
    <>
      {importing && <AutoRefresh />}
      <PageHeader
        title="Accounts"
        description="Stripe and RevenueCat sources behind your screens. Keys are read-only and encrypted."
        actions={accounts.length > 0 && connectButton}
      />
      {accounts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              webhookInstructions={
                account.updates.mode === "polling"
                  ? account.provider === "revenuecat"
                    ? revenueCatWebhookSetupInstructions(account.id)
                    : webhookSetupInstructions(account.id)
                  : null
              }
            />
          ))}
        </div>
      ) : (
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCardIcon />
            </EmptyMedia>
            <EmptyTitle>No account connected yet</EmptyTitle>
            <EmptyDescription>
              Connect Stripe or RevenueCat with a read-only key: your screens show MRR, revenue and
              every sale.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{connectButton}</EmptyContent>
        </Empty>
      )}
    </>
  );
}
