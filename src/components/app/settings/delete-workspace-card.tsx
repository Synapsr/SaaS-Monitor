"use client";

import { Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { deleteWorkspaceAction } from "@/app/app/settings/actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "./settings-card";

export function DeleteWorkspaceCard({
  workspaceName,
  isOnlyWorkspace,
}: {
  workspaceName: string;
  /** Deleting the last workspace gives the owner a fresh, empty one. */
  isOnlyWorkspace: boolean;
}) {
  const id = useId();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  return (
    <>
      <SettingsCard
        danger
        title="Delete workspace"
        description={
          <>
            Deletes its screens, disconnects its Stripe accounts and removes every member. To leave
            a workspace you own instead, invite another owner first.
          </>
        }
        footer={
          <>
            <p className="text-sm text-muted-foreground">This can’t be undone.</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setTyped("");
                setConfirming(true);
              }}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete workspace
            </Button>
          </>
        }
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${workspaceName}?`}
        description={
          <>
            <p>
              Screens go blank and their links stop working. Imported Stripe data is deleted;
              nothing changes in Stripe itself.
            </p>
            {isOnlyWorkspace && <p>You’ll start again in a new, empty workspace.</p>}
          </>
        }
        confirmLabel="Delete workspace"
        destructive
        confirmDisabled={typed.trim() !== workspaceName}
        onConfirm={deleteWorkspaceAction}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-confirm`} className="text-sm">
            Type <span className="font-medium">{workspaceName}</span> to confirm.
          </label>
          <Input
            id={`${id}-confirm`}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
