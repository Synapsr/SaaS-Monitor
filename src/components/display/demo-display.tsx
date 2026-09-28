"use client";

import { Display } from "@/components/display/display";
import type { DemoOptions } from "@/lib/display/demo";
import { useDemoSimulation } from "@/lib/display/hooks/use-demo-simulation";

interface DemoDisplayProps {
  options: DemoOptions;
  /** When the server rendered the page: the demo's history ends there, on both sides. */
  startedAt: string;
  preview: boolean;
}

/** The demo screen of "Acme Analytics": a live simulation, no database involved. */
export function DemoDisplay({ options, startedAt, preview }: DemoDisplayProps) {
  const state = useDemoSimulation(options, startedAt);
  return <Display state={state} online preview={preview} followServerVersion={false} />;
}
