import { useCallback, useState, type RefCallback } from "react";

export interface Size {
  width: number;
  height: number;
  /** Font size in pixels, to space out text drawn inside the element (labels of a chart). */
  fontSize: number;
}

/** Size of an element, kept up to date: `[ref, size]`, with a zero size until it is measured. */
export function useElementSize<T extends Element>(): [RefCallback<T>, Size] {
  const [size, setSize] = useState<Size>({ width: 0, height: 0, fontSize: 16 });
  const ref = useCallback((element: T | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const fontSize = parseFloat(getComputedStyle(element).fontSize) || 16;
      setSize((current) =>
        current.width === width && current.height === height && current.fontSize === fontSize
          ? current
          : { width, height, fontSize },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}
