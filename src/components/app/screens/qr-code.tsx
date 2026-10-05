import { useMemo } from "react";
import { encode } from "uqr";
import { cn } from "@/lib/utils";

/**
 * A QR code of `value`, drawn as one SVG path. Dark on light whatever the theme: some scanners
 * read nothing else.
 */
export function QrCode({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const { size, path } = useMemo(() => {
    // Medium error correction: still readable from a screen with glare or a smudge.
    const { size, data } = encode(value, { ecc: "M", border: 0 });
    const modules = data.flatMap((row, y) =>
      row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : [])),
    );
    return { size, path: modules.join("") };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={cn("bg-white text-black", className)}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
