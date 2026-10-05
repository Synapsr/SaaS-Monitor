import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { rememberState } from "@/screens/actions";
import { fetchScreenState, type StateResult } from "@/screens/api";
import { screensStore } from "@/screens/store";
import type { SavedScreen } from "@/screens/types";

export type ScreenSummary = StateResult | { kind: "loading" };

/**
 * The state of each screen, for the list: fetched when the list shows, and on demand (pull to
 * refresh). Each fetch also syncs the screen on its instance, so the list doesn't poll.
 */
export function useScreenSummaries(screens: readonly SavedScreen[]): {
  summaries: ReadonlyMap<string, ScreenSummary>;
  refresh: () => Promise<void>;
} {
  const [summaries, setSummaries] = useState<ReadonlyMap<string, ScreenSummary>>(new Map());
  const refresh = useCallback(async () => {
    await Promise.all(
      screensStore.getSnapshot().screens.map(async (screen) => {
        const result = await fetchScreenState(screen);
        if (result.kind === "ok") rememberState(screen.key, result.state);
        setSummaries((previous) => new Map(previous).set(screen.key, result));
      }),
    );
  }, []);

  // `screens` changes as states are remembered: only a new set of screens fetches again.
  const keys = screens.map((screen) => `${screen.key}:${screen.accessProof}`).join();
  useFocusEffect(
    useCallback(() => {
      if (keys !== "") void refresh();
    }, [refresh, keys]),
  );

  return { summaries, refresh };
}
