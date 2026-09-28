"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useId, useState } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/app/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useSignOut } from "@/hooks/use-sign-out";
import type { ActionResult } from "@/lib/action-result";
import { PERSON_NAME_MAX_LENGTH } from "@/lib/names";
import { SettingsCard } from "./settings-card";

export function ProfileCard({ name, email }: { name: string; email: string }) {
  const id = useId();
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [state, save, saving] = useActionState(async (_: ActionResult | null, newName: string) => {
    const result = await updateProfileAction(newName);
    if (result.ok) {
      toast.success("Profile saved.");
      // The session cookie holding the name was just refreshed: render the header with it.
      router.refresh();
    }
    return result;
  }, null);
  const { signOut, signingOut } = useSignOut();
  const error = state && !state.ok ? state.error : null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => save(value));
      }}
    >
      <SettingsCard
        title="Your profile"
        description="How you appear to the other members."
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={signOut} disabled={signingOut}>
              {signingOut ? <Spinner /> : <LogOutIcon data-icon="inline-start" />}
              Sign out
            </Button>
            <Button type="submit" size="sm" disabled={saving || value.trim() === name}>
              {saving && <Spinner />}
              Save
            </Button>
          </>
        }
      >
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
            <Input
              id={`${id}-name`}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
              maxLength={PERSON_NAME_MAX_LENGTH}
              autoComplete="name"
              className="h-9"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
            <Input id={`${id}-email`} value={email} readOnly disabled className="h-9" />
          </Field>
        </div>
      </SettingsCard>
    </form>
  );
}
