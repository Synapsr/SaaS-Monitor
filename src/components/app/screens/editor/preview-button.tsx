"use client";

import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Plays a sample of a setting: a sound, a voice, a phrase. */
export function PreviewButton({
  label,
  onClick,
  disabled,
  pending,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Play ${label}`}
      onClick={onClick}
      disabled={disabled || pending}
      className="text-muted-foreground"
    >
      {pending ? (
        <Spinner />
      ) : (
        // The triangle's visual center sits right of its box: nudge it.
        <PlayIcon className="size-3.5 translate-x-px fill-current" />
      )}
    </Button>
  );
}
