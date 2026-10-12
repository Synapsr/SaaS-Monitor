"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1400;

/** Fast, then settling, like a figure that lands. */
function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * A number that ticks up to `value` when it scrolls into view, from `from`: the server renders
 * the final figure, which visitors who prefer less motion, or who already see it, keep.
 */
export function CountUp({
  value,
  from,
  locale,
  format,
  className,
}: {
  value: number;
  from: number;
  locale: string;
  format: Intl.NumberFormatOptions;
  className?: string;
}) {
  const element = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = element.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Already on screen when the page woke up: changing it now would flash.
        if (first && entry.isIntersecting) return observer.disconnect();
        first = false;
        if (!entry.isIntersecting) return setShown(from);
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          setShown(from + (value - from) * easeOut(progress));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, from]);

  const formatter = new Intl.NumberFormat(locale, format);
  return (
    <span ref={element} className={className}>
      <span aria-hidden className="tabular-nums">
        {formatter.format(Math.round(shown))}
      </span>
      <span className="sr-only">{formatter.format(value)}</span>
    </span>
  );
}
