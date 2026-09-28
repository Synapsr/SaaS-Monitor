"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

export type SaveStatus = "saved" | "unsaved" | "saving" | "failed";

/**
 * Saves `value` a moment after it stops changing. The UI keeps showing the edited value
 * (optimistic); saves never overlap, and edits made during a save are saved right after it.
 * Failures are reported with a toast offering to retry.
 */
export function useAutoSave<T>(
  value: T,
  save: (value: T) => Promise<ActionResult>,
  { delayMs = 600, enabled = true }: { delayMs?: number; enabled?: boolean } = {},
) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const latest = useRef(value);
  const lastSaved = useRef(JSON.stringify(value));
  const saving = useRef(false);
  const saveRef = useRef(save);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    saveRef.current = save;
    enabledRef.current = enabled;
  });

  const flush = useCallback(async function flush(): Promise<void> {
    if (saving.current) return;
    const snapshot = JSON.stringify(latest.current);
    if (snapshot === lastSaved.current) {
      setStatus("saved");
      return;
    }

    saving.current = true;
    setStatus("saving");
    const result = await saveRef.current(latest.current).catch((): ActionResult => ({
      ok: false,
      error: "Your changes couldn't be saved. Check your connection.",
    }));
    saving.current = false;

    if (!result.ok) {
      setStatus("failed");
      toast.error(result.error, {
        id: "auto-save",
        action: { label: "Retry", onClick: () => void flush() },
      });
      return;
    }
    lastSaved.current = snapshot;
    if (JSON.stringify(latest.current) === snapshot) setStatus("saved");
    else await flush();
  }, []);

  useEffect(() => {
    latest.current = value;
    if (!enabled || JSON.stringify(value) === lastSaved.current) return;
    setStatus("unsaved");
    const timeout = setTimeout(flush, delayMs);
    return () => clearTimeout(timeout);
  }, [value, enabled, delayMs, flush]);

  // Leaving the page right after an edit: save it now, and let the browser warn on unload.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(latest.current) !== lastSaved.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (enabledRef.current) void flush();
    };
  }, [flush]);

  return { status, retry: flush };
}
