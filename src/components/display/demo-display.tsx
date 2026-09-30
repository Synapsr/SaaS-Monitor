"use client";

import { Display } from "@/components/display/display";
import { useDemoSimulation } from "@/hooks/use-demo-simulation";
import { useDemoSoundSwitch } from "@/hooks/use-demo-sound";
import type { DemoOptions } from "@/lib/display/demo/options";

interface DemoDisplayProps {
  options: DemoOptions;
  /** When the server rendered the page: the demo's history ends there, on both sides. */
  startedAt: string;
  preview: boolean;
}

/** The demo screen of "Acme Analytics": a live simulation, no database involved. */
export function DemoDisplay({ options, startedAt, preview }: DemoDisplayProps) {
  const { state, playSoon } = useDemoSimulation(options, startedAt);
  // The landing page's TV turns its preview up, and a sale lands right away to be heard.
  const audible = useDemoSoundSwitch(preview, playSoon);
  return (
    <Display
      state={state}
      online
      preview={preview}
      muted={preview && !audible}
      followServerVersion={false}
      announcementEndpoint={null}
    />
  );
}
