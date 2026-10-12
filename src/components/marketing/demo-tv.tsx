"use client";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useRef } from "react";
import { DisplayFrame } from "@/components/display-frame";
import { useDemoSound } from "@/hooks/use-demo-sound";
import type { DemoSoundStatus } from "@/lib/demo-sound";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const CAPTIONS: Record<DemoSoundStatus, string> = {
  loading: "The live demo, with a fictional SaaS. A sale lands every 20 seconds or so.",
  off: "The live demo, with a fictional SaaS. A sale lands every 20 seconds or so.",
  on: "Sound on: every sale rings, then a voice says what happened.",
  blocked: "Your browser kept the sound off. Click “Hear it” to try again.",
};

/**
 * The live demo display (`/d/demo`, a silent preview) in a wall-mounted TV: a sale lands every 20
 * seconds or so, with its card and confetti. "Hear it" turns its sound and voice on.
 */
export function DemoTv({ className }: { className?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const { status, toggle } = useDemoSound(frame);
  const on = status === "on";

  return (
    <div className={className}>
      <div className="relative rounded-[clamp(0.75rem,1.6vw,1.25rem)] bg-linear-to-b from-neutral-800 to-neutral-950 p-[clamp(0.375rem,0.8vw,0.75rem)] shadow-[0_50px_140px_-30px_rgb(0_0_0/0.95)] ring-1 ring-white/10">
        <DisplayFrame
          src="/d/demo?preview=1"
          title={`Live demo of a ${siteConfig.name} screen`}
          frameRef={frame}
          allow="autoplay"
          className="rounded-[clamp(0.375rem,0.8vw,0.625rem)] bg-(--screen)"
        />
        {status !== "loading" && (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "absolute right-[clamp(0.875rem,2vw,1.75rem)] bottom-[clamp(0.875rem,2vw,1.75rem)] flex h-9 animate-in items-center gap-2 rounded-full bg-black/60 pr-4 pl-3 text-sm font-medium text-(--ink) ring-1 ring-white/15 backdrop-blur-md transition-[background-color,box-shadow,scale] duration-500 outline-none fade-in hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.96] motion-reduce:animate-none sm:h-10 sm:pr-4.5 sm:pl-3.5",
              on
                ? "shadow-[0_0_24px_-4px_var(--glow)] ring-(--glow)/60"
                : "shadow-[0_8px_30px_-6px_rgb(0_0_0/0.8)]",
            )}
          >
            {on ? (
              <VolumeXIcon aria-hidden className="size-4" />
            ) : (
              <Volume2Icon aria-hidden className="size-4 text-(--glow)" />
            )}
            {on ? "Mute" : "Hear it"}
          </button>
        )}
      </div>
      <p aria-live="polite" className="mt-6 text-center text-sm text-balance text-(--ink-3)">
        {CAPTIONS[status]}
      </p>
    </div>
  );
}
