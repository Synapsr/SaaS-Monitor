import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Celebration } from "@/lib/display/moments";

/**
 * Confetti on one canvas for the lifetime of the screen, animated in a worker so that the main
 * thread (and the numbers rolling on screen) stay smooth, even on a Raspberry Pi.
 */
export function useConfetti(): {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  fire: (celebration: Celebration, colors: readonly string[]) => void;
} {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cannon = useRef<confetti.CreateTypes | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
      cannon.current?.reset();
    };
  }, []);

  const fire = useCallback((celebration: Celebration, colors: readonly string[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cannon.current ??= confetti.create(canvas, {
      resize: true,
      useWorker: true,
      disableForReducedMotion: true,
    });
    const shoot = cannon.current;
    const later = (delay: number, burst: () => void) => {
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        burst();
      }, delay);
      timers.current.add(timer);
    };

    // Confetti physics are in pixels: scaled with the screen, a 4K TV or a vertical screen gets
    // the same show as a laptop. Flights scale with the height, particles with the short side.
    const flight = window.innerHeight / 1080;
    const size = Math.min(window.innerWidth, window.innerHeight) / 1080;
    const base: confetti.Options = {
      colors: [...colors],
      scalar: 1.5 * size,
      gravity: 1.1 * flight,
      startVelocity: 64 * flight,
      ticks: 340,
      decay: 0.92,
    };
    const sides = (particleCount: number, spread = 62) => {
      void shoot({ ...base, particleCount, spread, angle: 58, origin: { x: -0.02, y: 0.95 } });
      void shoot({ ...base, particleCount, spread, angle: 122, origin: { x: 1.02, y: 0.95 } });
    };

    if (celebration === "payment") {
      sides(110);
      later(220, () => sides(50, 80));
      return;
    }
    const stars: confetti.Options = { ...base, shapes: ["star", "circle", "square"] };
    void shoot({
      ...stars,
      particleCount: 180,
      spread: 120,
      startVelocity: 72 * flight,
      origin: { x: 0.5, y: 0.62 },
    });
    later(300, () => sides(90, 75));
    later(900, () => sides(70, 90));
    later(1600, () =>
      shoot({
        ...stars,
        particleCount: 120,
        spread: 160,
        startVelocity: 45 * flight,
        origin: { x: 0.5, y: 0.3 },
      }),
    );
  }, []);

  return { canvasRef, fire };
}
