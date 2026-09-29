"use client";

import { KeyRoundIcon, LockIcon } from "lucide-react";
import { startTransition, useActionState, useId, useState } from "react";
import { toast } from "sonner";
import { setScreenPasswordAction } from "@/app/app/screens/actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { SecretInput } from "@/components/secret-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/lib/action-result";

/**
 * An optional password on top of the screen's link: each TV asks for it once. Members of the
 * workspace never need it, which keeps the live preview working.
 */
export function ScreenPassword({
  screenId,
  hasPassword,
}: {
  screenId: string;
  hasPassword: boolean;
}) {
  const [dialog, setDialog] = useState<"set" | "remove" | null>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <div className="flex items-start justify-between gap-3 border-t pt-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {hasPassword && <LockIcon className="size-3.5" />}
          {hasPassword ? "Protected by a password" : "Password"}
        </p>
        <p className="text-xs text-pretty text-muted-foreground">
          {hasPassword
            ? "Each device asks for it once, then remembers it."
            : "Ask for a password before showing the screen, on top of its link."}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {hasPassword ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setDialog("set")}>
              Change
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDialog("remove")}>
              Remove
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setDialog("set")}>
            <KeyRoundIcon data-icon="inline-start" />
            Set a password
          </Button>
        )}
      </div>

      <PasswordDialog
        screenId={screenId}
        replacing={hasPassword}
        open={dialog === "set"}
        onOpenChange={close}
      />
      <ConfirmDialog
        open={dialog === "remove"}
        onOpenChange={close}
        title="Remove the password?"
        description={<p>Anyone with the screen’s link can watch it again, without a password.</p>}
        confirmLabel="Remove password"
        successMessage="Password removed."
        onConfirm={() => setScreenPasswordAction(screenId, null)}
      />
    </div>
  );
}

function PasswordDialog({
  screenId,
  replacing,
  open,
  onOpenChange,
}: {
  screenId: string;
  /** A new password locks out the devices that knew the previous one. */
  replacing: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, save, pending] = useActionState(
    async (_: ActionResult | null, password: string) => {
      const result = await setScreenPasswordAction(screenId, password);
      if (result.ok) {
        startTransition(() => onOpenChange(false));
        toast.success(replacing ? "Password changed." : "Password set.", {
          description: "Each TV asks for it once.",
        });
      }
      return result;
    },
    null,
  );
  const id = useId();
  const error = state && !state.ok ? state.error : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const password = String(new FormData(event.currentTarget).get("password"));
            startTransition(() => save(password));
          }}
        >
          <DialogHeader>
            <DialogTitle>{replacing ? "Change the password" : "Set a password"}</DialogTitle>
            <DialogDescription>
              {replacing
                ? "Every device that knew the previous password asks for the new one."
                : "Open copies of the screen ask for it right away, then remember it."}
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={Boolean(error) || undefined}>
            <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
            <SecretInput
              id={`${id}-password`}
              name="password"
              required
              minLength={4}
              maxLength={128}
              autoComplete="new-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : `${id}-hint`}
            />
            {error ? (
              <FieldError id={`${id}-error`}>{error}</FieldError>
            ) : (
              <FieldDescription id={`${id}-hint`}>
                4 characters at least: it may be typed with a TV remote.
              </FieldDescription>
            )}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {replacing ? "Change password" : "Set password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
