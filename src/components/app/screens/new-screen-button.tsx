"use client";

import { PlusIcon } from "lucide-react";
import { startTransition, useActionState, useId, useState } from "react";
import { createScreenAction } from "@/app/app/screens/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/lib/action-result";
import { NAME_MAX_LENGTH } from "@/lib/names";

/** Creates a screen with sensible defaults, then opens its editor. */
export function NewScreenButton({
  variant = "default",
  label = "New screen",
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, create, pending] = useActionState(
    (_: ActionResult | null, name: string) =>
      createScreenAction({
        name,
        // "Today" on the screen should match the place where it hangs, usually right here.
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    null,
  );
  const errorId = useId();
  const error = state && !state.ok ? state.error : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <PlusIcon data-icon="inline-start" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get("name"));
            startTransition(() => create(name));
          }}
        >
          <DialogHeader>
            <DialogTitle>New screen</DialogTitle>
            <DialogDescription>
              It shows all your Stripe accounts to start with. You can fine-tune everything next.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="screen-name">Name</FieldLabel>
            <Input
              id="screen-name"
              name="name"
              placeholder="Office TV"
              required
              maxLength={NAME_MAX_LENGTH}
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <FieldError id={errorId}>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Create screen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
