"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    try {
      await copyText(value);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  }

  return { copied, copy };
}

/** Tells screen reader users that the copy worked, since the change is only visual. */
function CopiedAnnouncement({ copied }: { copied: boolean }) {
  return (
    <span className="sr-only" aria-live="polite">
      {copied ? "Copied to the clipboard" : ""}
    </span>
  );
}

/** Swaps the copy icon for a check mark, without animating on first render. */
function CopyIconSwap({ copied }: { copied: boolean }) {
  return (
    <span className="relative grid size-4 place-items-center">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={copied ? "copied" : "copy"}
          className="grid place-items-center"
          initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  className,
  variant = "outline",
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const { copied, copy } = useCopy(value);
  return (
    <Button type="button" variant={variant} size="sm" className={className} onClick={copy}>
      <CopyIconSwap copied={copied} />
      <span>{copied ? "Copied" : label}</span>
      <CopiedAnnouncement copied={copied} />
    </Button>
  );
}

/** A shell command or snippet, wrapped between words to stay readable on small screens. */
export function CopyCode({ code, label }: { code: string; label: string }) {
  const { copied, copy } = useCopy(code);
  return (
    <div className="overflow-hidden rounded-lg bg-muted/60 ring-1 ring-foreground/10 dark:bg-input/20">
      <div className="flex items-center justify-between gap-2 border-b py-1 pr-1 pl-3">
        <span className="text-xs text-muted-foreground first-letter:uppercase">{label}</span>
        <Button type="button" variant="ghost" size="xs" onClick={copy} aria-label={`Copy ${label}`}>
          <CopyIconSwap copied={copied} />
          <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre className="p-3 font-mono text-[0.78rem] leading-relaxed wrap-anywhere whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
      <CopiedAnnouncement copied={copied} />
    </div>
  );
}

/** Read-only value (URL, identifier) with a copy button inside the field. */
export function CopyField({
  value,
  label,
  className,
  id,
}: {
  value: string;
  /** Accessible name of the field when no visible label points to it. */
  label?: string;
  className?: string;
  id?: string;
}) {
  const { copied, copy } = useCopy(value);
  const generatedId = useId();
  return (
    <InputGroup className={cn("h-9 bg-muted/40 dark:bg-input/20", className)}>
      <InputGroupInput
        id={id ?? generatedId}
        value={value}
        readOnly
        // A visible <label htmlFor={id}> names the field when there is one.
        aria-label={id ? undefined : label}
        spellCheck={false}
        className="font-mono text-[0.8rem] text-ellipsis"
        onFocus={(event) => event.currentTarget.select()}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="xs" onClick={copy} aria-label={`Copy ${label ?? "value"}`}>
          <CopyIconSwap copied={copied} />
          <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
        </InputGroupButton>
      </InputGroupAddon>
      <CopiedAnnouncement copied={copied} />
    </InputGroup>
  );
}
