"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Copies `value`. Self-hosted instances are often reached over plain HTTP on a local network,
 * where the async Clipboard API does not exist: fall back to a hidden textarea.
 */
async function copyText(value: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy command refused.");
}

/**
 * A copy button for the site, light enough for its pages (no toast): its icon turns into a check,
 * and its label says when copying failed.
 */
export function CopyText({
  value,
  labels,
}: {
  value: string;
  labels: { copy: string; copied: string; failed: string };
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timeout = setTimeout(() => setState("idle"), 2200);
    return () => clearTimeout(timeout);
  }, [state]);

  const copied = state === "copied";
  return (
    <button
      type="button"
      onClick={() =>
        copyText(value).then(
          () => setState("copied"),
          () => setState("failed"),
        )
      }
      className="relative flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs text-(--ink-2) transition-[background-color,color,scale] duration-150 after:absolute after:-inset-1 hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--glow) active:scale-[0.96]"
    >
      <span aria-hidden className="relative size-3.5">
        <CopyIcon
          className={cn(
            "ease-out-soft absolute inset-0 size-3.5 transition-[opacity,filter,scale] duration-300",
            copied ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-[0px]",
          )}
        />
        <CheckIcon
          className={cn(
            "ease-out-soft absolute inset-0 size-3.5 text-(--glow) transition-[opacity,filter,scale] duration-300",
            copied ? "scale-100 opacity-100 blur-[0px]" : "scale-25 opacity-0 blur-[4px]",
          )}
        />
      </span>
      <span aria-live="polite">
        {state === "copied" ? labels.copied : state === "failed" ? labels.failed : labels.copy}
      </span>
    </button>
  );
}
