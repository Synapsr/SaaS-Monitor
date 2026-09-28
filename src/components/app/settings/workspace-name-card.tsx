"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { renameWorkspaceAction } from "@/app/app/settings/actions";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SettingsCard } from "./settings-card";

export function WorkspaceNameCard({ name, canEdit }: { name: string; canEdit: boolean }) {
  const id = useId();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await renameWorkspaceAction(value);
      if (result.ok) toast.success("Workspace renamed.");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={save}>
      <SettingsCard
        title="Workspace name"
        description="Shown in the workspace switcher and in invitations."
        footer={
          <>
            <p className="text-sm text-muted-foreground">
              {canEdit ? "Up to 60 characters." : "Only owners and admins can rename it."}
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
            maxLength={60}
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
