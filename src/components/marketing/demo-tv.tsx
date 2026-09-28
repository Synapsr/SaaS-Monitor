"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** The demo is designed for a 1080p TV: render it at that size, then scale it down. */
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

/**
 * The live demo display (`/d/demo`, muted in preview mode) in a wall-mounted TV: a sale lands
 * every few seconds, with its card and confetti.
 */
export function DemoTv({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / FRAME_WIDTH),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // The frame may finish loading before hydration, when React cannot see its load event.
  useEffect(() => {
    const frame = frameRef.current;
    if (frame?.contentDocument?.readyState === "complete" && frame.contentWindow?.location.href) {
      setLoaded(frame.contentWindow.location.href !== "about:blank");
    }
  }, []);

  return (
    <div
      className={cn(
        "rounded-[clamp(0.75rem,1.6vw,1.25rem)] bg-linear-to-b from-neutral-800 to-neutral-950 p-[clamp(0.375rem,0.8vw,0.75rem)] shadow-[0_50px_140px_-30px_rgb(0_0_0/0.95)] ring-1 ring-white/10",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="relative aspect-video overflow-hidden rounded-[clamp(0.375rem,0.8vw,0.625rem)] bg-(--screen)"
      >
        <iframe
          ref={frameRef}
          src="/d/demo?preview=1"
          title="Live demo of a SaaS Monitor screen"
          tabIndex={-1}
          onLoad={() => setLoaded(true)}
          className={cn(
            "pointer-events-none absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-700",
            loaded && scale ? "opacity-100" : "opacity-0",
          )}
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
