import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenMessageProps {
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Problems are shown in neutral tones: the accent is kept for good news. */
  tone?: "glow" | "neutral";
  className?: string;
}

/** A calm full-screen message, readable across a room: empty screens, imports, broken links. */
export function ScreenMessage({
  icon,
  title,
  children,
  tone = "glow",
  className,
}: ScreenMessageProps) {
  return (
    <div className={cn("grid min-h-0 flex-1 place-items-center px-8", className)}>
      <div className="flex max-w-220 flex-col items-center gap-8 text-center">
        <div
          className={cn(
            "grid size-24 place-items-center rounded-full bg-(--surface) ring-1 ring-(--hairline) [&_svg]:size-10",
            tone === "glow" ? "text-(--glow)" : "text-(--ink-2)",
          )}
        >
          {icon}
        </div>
        <h2 className="text-5xl font-semibold tracking-tight text-balance">{title}</h2>
        {children && (
          <div className="flex flex-col items-center gap-6 text-2xl text-pretty text-(--ink-2)">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
