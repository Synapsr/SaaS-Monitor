"use client";

import { Display } from "@/components/display/display";
import { useDemoAnalytics } from "@/hooks/use-demo-analytics";
import { useDemoSimulation } from "@/hooks/use-demo-simulation";
import type { DemoOptions } from "@/lib/display/demo/options";

interface DemoDisplayProps {
  options: DemoOptions;
  /** When the server rendered the page: the demo's history ends there, on both sides. */
  startedAt: string;
  preview: boolean;
  /** Where visitors of the standalone demo create an account, if this server lets them. */
  signUpHref: string | null;
}

/** The demo screen of "Acme Analytics": a live simulation, no database involved. */
export function DemoDisplay({ options, startedAt, preview, signUpHref }: DemoDisplayProps) {
  const state = useDemoSimulation(options, startedAt);
  useDemoAnalytics(!preview, state.screen.settings);
  return (
    <Display
      state={state}
      online
      preview={preview}
      followServerVersion={false}
      announcementEndpoint={null}
      // Embedded in the landing page, the page around it says what it is.
      demoFooter={preview ? null : { signUpHref }}
    />
  );
}
