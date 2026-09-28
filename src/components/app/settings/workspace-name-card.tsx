"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { toast } from "sonner";
import { renameWorkspaceAction } from "@/app/app/settings/actions";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/lib/action-result";
import { NAME_MAX_LENGTH } from "@/lib/names";
import { SettingsCard } from "./settings-card";

export function WorkspaceNameCard({ name, canEdit }: { name: string; canEdit: boolean }) {
  const id = useId();
  const [value, setValue] = useState(name);
  const [state, rename, pending] = useActionState(
    async (_: ActionResult | null, newName: string) => {
      const result = await renameWorkspaceAction(newName);
      if (result.ok) toast.success("Workspace renamed.");
      return result;
    },
    null,
  );
  const error = state && !state.ok ? state.error : null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => rename(value));
      }}
    >
      <SettingsCard
        title="Workspace name"
        description="Shown in the workspace switcher and in invitations."
        footer={
          <>
            <p className="text-sm text-muted-foreground">
              {canEdit
                ? `Up to ${NAME_MAX_LENGTH} characters.`
                : "Only owners and admins can rename it."}
            </p>
            {canEdit && (
              <Button type="submit" size="sm" disabled={pending || value.trim() === name}>
                {pending && <Spinner />}
                Save
              </Button>
            )}
          </>
        }
      >
        <div className="flex max-w-sm flex-col gap-2">
          <Input
            id={`${id}-name`}
            aria-label="Workspace name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={!canEdit}
            maxLength={NAME_MAX_LENGTH}
            required
            autoComplete="off"
            className="h-9"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
        </div>
      </SettingsCard>
    </form>
  );
}
