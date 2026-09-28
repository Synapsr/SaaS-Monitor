"use client";

import { useEffect, useEffectEvent, useRef, useState, type ReactNode, type RefObject } from "react";
import { useElementSize } from "@/hooks/use-element-size";
import { cn } from "@/lib/utils";

/** Displays are designed for a 1080p TV: they render at that size, then scale down to fit. */
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

interface DisplayFrameProps {
  /** A display in preview mode, silent and passive: `/d/<token>?preview=1`. */
  src: string;
  title: string;
  /** Classes of the 16:9 viewport, such as its background and radius. */
  className?: string;
  /** Shown until the display has loaded, then faded out. */
  placeholder?: ReactNode;
  /** Called whenever the display finishes loading. */
  onLoad?: () => void;
  frameRef?: RefObject<HTMLIFrameElement | null>;
}

/** A wall display embedded in a page, scaled down to the width of its container. */
export function DisplayFrame({
  src,
  title,
  className,
  placeholder,
  onLoad,
  frameRef: givenFrameRef,
}: DisplayFrameProps) {
  const [viewportRef, { width }] = useElementSize<HTMLDivElement>();
  const ownFrameRef = useRef<HTMLIFrameElement>(null);
  const frameRef = givenFrameRef ?? ownFrameRef;
  // Which page finished loading: another `src` fades in again.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const scale = width / FRAME_WIDTH;
  const loaded = loadedSrc === src && scale > 0;

  const handleLoad = () => {
    setLoadedSrc(src);
    onLoad?.();
  };
  const handleLoadBeforeHydration = useEffectEvent(handleLoad);

  // The frame may finish loading before hydration, when React cannot see its load event. The
  // initial about:blank document is "complete" too, so check which page is loaded.
  useEffect(() => {
    const frame = frameRef.current;
    const page = frame?.contentWindow?.location.href ?? "about:blank";
    if (frame?.contentDocument?.readyState === "complete" && page !== "about:blank") {
      handleLoadBeforeHydration();
    }
  }, [src, frameRef]);

  return (
    <div ref={viewportRef} className={cn("relative aspect-video overflow-hidden", className)}>
      {placeholder && (
        <div
          className={cn("absolute inset-0 transition-opacity duration-500", loaded && "opacity-0")}
        >
          {placeholder}
        </div>
      )}
      <iframe
        key={src}
        ref={frameRef}
        src={src}
        title={title}
        tabIndex={-1}
        onLoad={handleLoad}
        className={cn(
          "pointer-events-none absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
      />
    </div>
  );
}
