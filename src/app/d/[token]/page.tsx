import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LiveDisplay } from "@/components/display/live-display";
import { getDisplayStateByToken } from "@/server/display/state";
import { scheduleSync } from "@/server/sync";

// `generateMetadata` and the page need the same state: load it once per request.
const loadState = cache(getDisplayStateByToken);

export async function generateMetadata({ params }: PageProps<"/d/[token]">): Promise<Metadata> {
  const { token } = await params;
  const state = await loadState(token);
  if (!state) notFound();
  return { title: state.screen.name, robots: { index: false, follow: false } };
}

export default async function DisplayPage({ params, searchParams }: PageProps<"/d/[token]">) {
  const { token } = await params;
  const state = await loadState(token);
  if (!state) notFound();

  scheduleSync(state.accounts.map((account) => account.id));
  const { preview } = await searchParams;
  return <LiveDisplay token={token} initialState={state} preview={preview === "1"} />;
}
