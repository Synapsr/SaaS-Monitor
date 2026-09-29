import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LiveDisplay } from "@/components/display/live-display";
import { ScreenLock } from "@/components/display/screen-lock";
import { siteConfig } from "@/lib/site";
import { getDisplayStateByToken } from "@/server/display/state";
import { canViewScreen, findScreenLock } from "@/server/screen-access";
import { scheduleSync } from "@/server/sync";

// `generateMetadata` and the page need the same data: load it once per request.
const loadAccess = cache(async (token: string) => {
  const lock = await findScreenLock(token);
  return lock && { lock, allowed: await canViewScreen(lock, await headers()) };
});
const loadState = cache(getDisplayStateByToken);

const robots = { index: false, follow: false };

export async function generateMetadata({ params }: PageProps<"/d/[token]">): Promise<Metadata> {
  const { token } = await params;
  const access = await loadAccess(token);
  if (!access) notFound();
  // A locked screen keeps even its name to itself.
  if (!access.allowed) return { title: { absolute: siteConfig.name }, robots };
  const state = await loadState(token);
  if (!state) notFound();
  return { title: state.screen.name, robots };
}

export default async function DisplayPage({ params, searchParams }: PageProps<"/d/[token]">) {
  const { token } = await params;
  const access = await loadAccess(token);
  if (!access) notFound();
  if (!access.allowed) {
    const { language, theme, accent } = access.lock;
    return <ScreenLock token={token} language={language} theme={theme} accent={accent} />;
  }

  const state = await loadState(token);
  if (!state) notFound();
  scheduleSync(state.accounts.map((account) => account.id));
  const { preview } = await searchParams;
  return <LiveDisplay token={token} initialState={state} preview={preview === "1"} />;
}
