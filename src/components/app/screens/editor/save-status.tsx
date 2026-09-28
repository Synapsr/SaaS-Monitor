"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SaveStatus as Status } from "@/hooks/use-auto-save";
import { cn } from "@/lib/utils";

const CONTENT = {
  saved: { Icon: CircleCheckIcon, label: "Saved", className: "text-muted-foreground" },
  unsaved: { Icon: Spinner, label: "Saving…", className: "text-muted-foreground" },
  saving: { Icon: Spinner, label: "Saving…", className: "text-muted-foreground" },
  failed: { Icon: CircleAlertIcon, label: "Not saved", className: "text-destructive" },
} as const;

/** Discreet auto-save indicator: every change is saved on its own, nothing to click. */
export function SaveStatus({ status, onRetry }: { status: Status; onRetry?: () => void }) {
  const { Icon, label, className } = CONTENT[status];
  return (
    <div className="flex h-8 items-center gap-2 text-sm" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={label}
          className={cn("flex items-center gap-1.5", className)}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </motion.span>
      </AnimatePresence>
      {status === "failed" && onRetry && (
        <Button variant="outline" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
