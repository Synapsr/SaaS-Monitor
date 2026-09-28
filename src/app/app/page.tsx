import { MonitorIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountsOverview } from "@/components/app/accounts/accounts-overview";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { SetupGuide } from "@/components/app/home/setup-guide";
import { PageHeader, PageSection } from "@/components/app/page-header";
import { NewScreenButton } from "@/components/app/screens/new-screen-button";
import { ScreenCard } from "@/components/app/screens/screen-card";
import { screenUrl } from "@/components/app/screens/screen-url";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { env } from "@/env";
import { listScreens } from "@/server/screens";
import { requireWorkspace } from "@/server/session";
import { listStripeAccountSummaries } from "@/server/stripe/accounts";
import { scheduleSync } from "@/server/sync";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage({ searchParams }: PageProps<"/app">) {
  const { workspace } = await requireWorkspace();
  const [accounts, screens, { onboarding }] = await Promise.all([
    listStripeAccountSummaries(workspace.id),
    listScreens(workspace.id),
    searchParams,
  ]);
  // Keeps the numbers fresh while someone looks at them.
  scheduleSync(accounts.map((account) => account.id));

  const { APP_URL } = env();
  const importing = accounts.some((account) => account.status === "importing");
  const refresh = importing && <AutoRefresh />;

  // The guide stays until Stripe is connected, and right after (`?onboarding=1`) for the last step.
  if (accounts.length === 0 || onboarding === "1") {
    const [screen = null] = screens;
    return (
      <>
        {refresh}
        <SetupGuide
          account={accounts[0] ?? null}
          screen={screen}
          url={screen && screenUrl(APP_URL, screen.publicToken)}
        />
      </>
    );
  }

  return (
    <>
      {refresh}
      <PageHeader
        title={workspace.name}
        description="Your screens, and the Stripe accounts they show."
        actions={<NewScreenButton />}
      />
      <div className="flex flex-col gap-12">
        <PageSection
          title="Screens"
          actions={
            screens.length > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/screens">View all</Link>
              </Button>
            )
          }
        >
          {screens.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {screens.map((screen) => (
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  url={screenUrl(APP_URL, screen.publicToken)}
                />
              ))}
            </div>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MonitorIcon />
                </EmptyMedia>
                <EmptyTitle>No screen yet</EmptyTitle>
                <EmptyDescription>
                  A screen is a page to open on a TV. It shows your MRR, revenue and every sale.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <NewScreenButton label="Create a screen" />
              </EmptyContent>
            </Empty>
          )}
        </PageSection>
        <PageSection
          title="Stripe accounts"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/accounts">Manage</Link>
            </Button>
          }
        >
          <AccountsOverview accounts={accounts} />
        </PageSection>
      </div>
    </>
  );
}
