import { useEffect, useState } from "react";
import { nextSlide } from "@/lib/display/rotation";

/**
 * The slide on screen, turning every `seconds` (see `src/lib/display/rotation.ts`). While a moment
 * plays, `focus` holds its account's slide on screen; the rotation then resumes from there, for a
 * full turn. `turn` counts turns, restarted ones included: it keys what times a turn.
 */
export function useRotation(
  slides: readonly string[],
  seconds: number,
  focus: string | undefined,
): { slide: string; turn: number } {
  const [current, setCurrent] = useState(slides[0]);
  const [turn, setTurn] = useState(0);
  const [focused, setFocused] = useState(focus);

  // A moment starting or ending adjusts the rotation right away, during this render.
  if (focus !== focused) {
    setFocused(focus);
    if (focus !== undefined && slides.includes(focus)) setCurrent(focus);
    setTurn((count) => count + 1);
  }

  const slide = slides.includes(current) ? current : slides[0];
  const rotating = slides.length > 1 && focus === undefined;
  // Slides are recomputed with every state: compare them by value.
  const order = slides.join(" ");
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => {
      setCurrent(nextSlide(order.split(" "), slide));
      setTurn((count) => count + 1);
    }, seconds * 1000);
    return () => clearTimeout(timer);
  }, [rotating, order, slide, seconds, turn]);

  return { slide, turn };
}
