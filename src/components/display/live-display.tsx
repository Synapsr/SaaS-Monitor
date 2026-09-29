"use client";

import { Display } from "@/components/display/display";
import { ScreenGone } from "@/components/display/screen-gone";
import { ScreenLock } from "@/components/display/screen-lock";
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
  const { language, theme, accent } = state.screen.settings;
  if (connection === "gone") return <ScreenGone language={language} theme={theme} />;
  if (connection === "locked") {
    return <ScreenLock token={token} language={language} theme={theme} accent={accent} />;
  }
  return (
    <Display state={state} online={connection === "online"} preview={preview} followServerVersion />
  );
}
