"use client";

import { PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DisplayFrame } from "@/components/display-frame";
import { useDemoSound } from "@/hooks/use-demo-sound";
import type { DemoSoundStatus } from "@/lib/demo-sound";
import { cn } from "@/lib/utils";

export interface DemoTvText {
  title: string;
  caption: string;
  captionOn: string;
  captionBlocked: string;
  hear: string;
  mute: string;
  posterAlt: string;
  open: string;
}

/** Wide enough for the live demo to be read and heard: phones get its picture and a link. */
const WIDE = "(min-width: 640px)";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The live demo display on a wall-mounted TV. Its picture shows at once, from the server; on wide
 * screens the demo itself (`/d/demo?preview=1`, silent) replaces it once the TV is near the
 * viewport, and "Hear it" turns its sound and voice on. A sale lands every 20 seconds or so.
 */
export function DemoTv({
  text,
  src,
  standalone,
  poster,
}: {
  text: DemoTvText;
  /** The preview to embed, in the page's language. */
  src: string;
  /** The demo on its own page, for phones. */
  standalone: string;
  poster: string;
}) {
  const tv = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const wide = useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  const [near, setNear] = useState(false);
  const { status, toggle } = useDemoSound(frame);
  const live = wide && near;
  const on = status === "on";

  useEffect(() => {
    const element = tv.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const picture = (
    <Image
      src={poster}
      alt={text.posterAlt}
      fill
      preload
      sizes="(min-width: 1200px) 1120px, 94vw"
      className="object-cover"
    />
  );

  const captions: Record<DemoSoundStatus, string> = {
    loading: text.caption,
    off: text.caption,
    on: text.captionOn,
    blocked: text.captionBlocked,
  };

  return (
    <figure ref={tv}>
      <div className="relative rounded-[clamp(0.875rem,1.6vw,1.375rem)] bg-linear-to-b from-(--bezel-top) to-(--bezel-bottom) p-[clamp(0.375rem,0.8vw,0.75rem)] shadow-(--shadow-device)">
        {live ? (
          <DisplayFrame
            src={src}
            title={text.title}
            frameRef={frame}
            allow="autoplay"
            placeholder={picture}
            className="rounded-[clamp(0.5rem,0.8vw,0.625rem)] bg-(--screen)"
          />
        ) : (
          <div className="relative aspect-video overflow-hidden rounded-[clamp(0.5rem,0.8vw,0.625rem)] bg-(--screen)">
            {picture}
            <a
              href={standalone}
              className="group absolute inset-0 flex items-end justify-center bg-linear-to-t from-(--screen)/80 via-transparent to-transparent p-4 outline-none sm:hidden"
            >
              <span className="flex h-10 items-center gap-2 rounded-full bg-(--popover)/80 pr-4.5 pl-4 text-sm font-medium text-(--ink) shadow-(--shadow-popover) backdrop-blur-md transition-[scale] duration-150 group-focus-visible:ring-2 group-focus-visible:ring-(--glow) group-active:scale-[0.96]">
                <PlayIcon aria-hidden className="ml-0.5 size-3.5 fill-current" />
                {text.open}
              </span>
            </a>
          </div>
        )}

        {live && status !== "loading" && (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "animate-rise absolute right-[clamp(0.875rem,2vw,1.75rem)] bottom-[clamp(0.875rem,2vw,1.75rem)] flex h-10 cursor-pointer items-center gap-2 rounded-full bg-(--popover)/80 pr-4.5 pl-3.5 text-sm font-medium text-(--ink) backdrop-blur-md transition-[background-color,box-shadow,scale] duration-300 outline-none hover:bg-(--popover) focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.96]",
              on ? "shadow-(--edge-glow)" : "shadow-(--shadow-popover)",
            )}
          >
            <span className="relative size-4">
              <Volume2Icon
                aria-hidden
                className={cn(
                  "absolute inset-0 size-4 text-(--glow) transition-[opacity,filter,scale] duration-300 ease-(--ease-out-soft)",
                  on ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-[0px]",
                )}
              />
              <VolumeXIcon
                aria-hidden
                className={cn(
                  "absolute inset-0 size-4 transition-[opacity,filter,scale] duration-300 ease-(--ease-out-soft)",
                  on ? "scale-100 opacity-100 blur-[0px]" : "scale-25 opacity-0 blur-[4px]",
                )}
              />
            </span>
            {on ? text.mute : text.hear}
          </button>
        )}
      </div>
      <figcaption
        aria-live="polite"
        className="mt-5 text-center text-sm text-balance text-(--ink-3)"
      >
        {live ? captions[status] : text.caption}
      </figcaption>
    </figure>
  );
}
