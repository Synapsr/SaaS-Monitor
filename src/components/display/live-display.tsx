"use client";

import { Display } from "@/components/display/display";
import { ScreenGone } from "@/components/display/screen-gone";
import { usePolledState } from "@/hooks/use-polled-state";
import type { DisplayState } from "@/lib/display/types";

interface LiveDisplayProps {
  token: string;
  initialState: DisplayState;
  preview: boolean;
}

/** A real screen: rendered by the server first, then kept fresh by polling. */
export function LiveDisplay({ token, initialState, preview }: LiveDisplayProps) {
  const { state, connection } = usePolledState(token, initialState);
  if (connection === "gone") {
    const { language, theme } = state.screen.settings;
    return <ScreenGone language={language} theme={theme} />;
  }
  return (
    <Display state={state} online={connection === "online"} preview={preview} followServerVersion />
  );
}
