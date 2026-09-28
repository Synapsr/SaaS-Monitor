"use client";

import { EllipsisIcon, PencilIcon, RotateCcwIcon, UnplugIcon } from "lucide-react";
import { startTransition, useActionState, useId, useState } from "react";
import { toast } from "sonner";
import {
  disconnectAccountAction,
  reimportAccountAction,
  renameAccountAction,
} from "@/app/app/accounts/actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/lib/action-result";
import { NAME_MAX_LENGTH } from "@/lib/names";
import { siteConfig } from "@/lib/site";

type OpenDialog = "rename" | "reimport" | "disconnect" | null;

export function AccountActions({ account }: { account: { id: string; name: string } }) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const close = (open: boolean) => open || setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${account.name}`}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setDialog("rename")}>
            <PencilIcon />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("reimport")}>
            <RotateCcwIcon />
            Re-import data
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("disconnect")}>
            <UnplugIcon />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameAccountDialog account={account} open={dialog === "rename"} onOpenChange={close} />
      <ConfirmDialog
        open={dialog === "reimport"}
        onOpenChange={close}
        title={`Re-import ${account.name}?`}
        description={
          <p>
            The data imported from this account is deleted and imported again from Stripe. Screens
            show “Importing” until it’s done. Nothing changes in Stripe.
          </p>
        }
        confirmLabel="Re-import"
        successMessage="Import started."
        onConfirm={() => reimportAccountAction(account.id)}
      />
      <ConfirmDialog
        open={dialog === "disconnect"}
        onOpenChange={close}
        title={`Disconnect ${account.name}?`}
        description={
          <>
            <p>
              Its subscriptions, payments and MRR history are deleted from {siteConfig.name}, and it
              disappears from your screens.
            </p>
            <p>
              Nothing changes in Stripe: you can connect it again later. If you won’t, delete the
              restricted key in Stripe too.
            </p>
          </>
        }
        confirmLabel="Disconnect"
        destructive
        successMessage={`${account.name} disconnected.`}
        onConfirm={() => disconnectAccountAction(account.id)}
      />
    </>
  );
}

function RenameAccountDialog({
  account,
  open,
  onOpenChange,
}: {
  account: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, rename, pending] = useActionState(async (_: ActionResult | null, name: string) => {
    const result = await renameAccountAction(account.id, name);
    if (result.ok) {
      startTransition(() => onOpenChange(false));
      toast.success("Account renamed.");
    }
    return result;
  }, null);
  const id = useId();
  const error = state && !state.ok ? state.error : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get("name"));
            startTransition(() => rename(name));
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename account</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
            <Input
              id={`${id}-name`}
              name="name"
              defaultValue={account.name}
              required
              maxLength={NAME_MAX_LENGTH}
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
