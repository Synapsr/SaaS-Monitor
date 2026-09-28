import { useEffect, type RefObject } from "react";

/** A slow tour around the center, in `--u` units: a few pixels, never noticeable. */
const OFFSETS = [
  [0, 0],
  [0.25, 0.15],
  [-0.15, 0.3],
  [-0.3, -0.1],
  [0.1, -0.3],
  [0.3, 0.05],
  [-0.05, 0.25],
] as const;

const SHIFT_INTERVAL_MS = 4 * 60_000;

/**
 * Moves a screen by a few pixels every few minutes, so that text shown for months at the same
 * place never burns into OLED and plasma panels.
 */
export function usePixelShift(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    let step = 0;
    const timer = setInterval(() => {
      step = (step + 1) % OFFSETS.length;
      const [x, y] = OFFSETS[step];
      element.style.translate = `calc(var(--u) * ${x}) calc(var(--u) * ${y})`;
    }, SHIFT_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      element.style.translate = "";
    };
  }, [ref, enabled]);
}
