import { useEffect, useRef, useState } from "react";

/** Close to the web's roll, `cubic-bezier(0.19, 1, 0.22, 1)`: fast, then settling softly. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * A number rolling to `target` over `duration` milliseconds, like the web's NumberFlow: the
 * digits climb when MRR grows. Without motion, it jumps.
 */
export function useTween(target: number, duration: number, animate: boolean): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (!animate || from === target) {
      current.current = target;
      setValue(target);
      return;
    }
    const startedAt = Date.now();
    let frame = requestAnimationFrame(function step() {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      current.current = from + (target - from) * easeOutExpo(progress);
      setValue(current.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration, animate]);

  return value;
}
