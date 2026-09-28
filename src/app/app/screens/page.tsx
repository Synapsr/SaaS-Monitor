import { MonitorIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { NewScreenButton } from "@/components/app/screens/new-screen-button";
import { ScreenCard } from "@/components/app/screens/screen-card";
import { screenUrl } from "@/components/app/screens/screen-url";
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

export const metadata: Metadata = { title: "Screens" };

export default async function ScreensPage() {
  const { workspace } = await requireWorkspace();
  const screens = await listScreens(workspace.id);
  const { APP_URL } = env();

  return (
    <>
      <PageHeader
        title="Screens"
        description="A screen is a page made for a TV: your MRR, revenue and live sales. Make one per room or per product."
        actions={screens.length > 0 && <NewScreenButton />}
      />
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
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MonitorIcon />
            </EmptyMedia>
            <EmptyTitle>No screen yet</EmptyTitle>
            <EmptyDescription>
              Create one, open its link on a TV, and every sale plays a sound in the room.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <NewScreenButton label="Create a screen" />
          </EmptyContent>
        </Empty>
      )}
    </>
  );
}
