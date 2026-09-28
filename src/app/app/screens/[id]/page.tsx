import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ScreenEditor } from "@/components/app/screens/editor/screen-editor";
import { env } from "@/env";
import { getScreen, listAccountOptions } from "@/server/screens";
import { requireWorkspace } from "@/server/session";

/** Shared by the metadata and the page, which render in the same request. */
const loadScreen = cache(async (id: string) => {
  const { workspace } = await requireWorkspace();
  return getScreen(workspace.id, id);
});

export async function generateMetadata({
  params,
}: PageProps<"/app/screens/[id]">): Promise<Metadata> {
  const screen = await loadScreen((await params).id);
  return { title: screen?.name ?? "Screen" };
}

export default async function ScreenPage({ params }: PageProps<"/app/screens/[id]">) {
  const { workspace } = await requireWorkspace();
  const [screen, accounts] = await Promise.all([
    loadScreen((await params).id),
    listAccountOptions(workspace.id),
  ]);
  if (!screen) notFound();

  return <ScreenEditor screen={screen} accounts={accounts} appUrl={env().APP_URL} />;
}
