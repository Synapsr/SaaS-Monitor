"use client";

import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { deleteScreenAction } from "@/app/app/screens/actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteScreen({ screenId, name }: { screenId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-pretty text-muted-foreground">
          Its link stops working for good. Your Stripe data is not affected.
        </p>
        <Button variant="destructive" onClick={() => setConfirming(true)} className="shrink-0">
          <Trash2Icon data-icon="inline-start" />
          Delete screen
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${name}?`}
        description={
          <p>
            Any TV showing it goes blank, and the link can’t be brought back. This can’t be undone.
          </p>
        }
        confirmLabel="Delete screen"
        destructive
        onConfirm={() => deleteScreenAction(screenId)}
      />
    </>
  );
}
