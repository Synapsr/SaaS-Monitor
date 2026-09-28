"use client";

import { useState } from "react";
import { leaveWorkspaceAction, removeMemberAction } from "@/app/app/settings/actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";

export function LeaveWorkspaceButton({ workspaceName }: { workspaceName: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Leave
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Leave ${workspaceName}?`}
        description={
          <p>
            You lose access to its screens and Stripe accounts. An owner or admin can invite you
            again.
          </p>
        }
        confirmLabel="Leave workspace"
        destructive
        onConfirm={leaveWorkspaceAction}
      />
    </>
  );
}

export function RemoveMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Remove
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Remove ${name}?`}
        description={<p>They lose access right away. You can invite them again later.</p>}
        confirmLabel="Remove"
        destructive
        successMessage={`${name} was removed.`}
        onConfirm={() => removeMemberAction(memberId)}
      />
    </>
  );
}
