"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useId } from "react";
import { SecretInput } from "@/components/secret-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { PERSON_NAME_MAX_LENGTH } from "@/lib/names";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import type { SocialProvider } from "@/lib/social-providers";
import { authErrorMessage } from "./auth-errors";
import { OrDivider, SocialSignIn } from "./social-sign-in";

export function SignUpForm({
  next,
  providers,
  invitedEmail,
  signupsDisabled,
}: {
  next: string;
  providers: SocialProvider[];
  /** Set when signing up to accept an invitation: only this address can accept it. */
  invitedEmail: string | null;
  /** The server only accepts invited people: a refused sign-up means this address was not. */
  signupsDisabled: boolean;
}) {
  const router = useRouter();
  const [error, signUp, pending] = useActionState(async (_: string | null, form: FormData) => {
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email: invitedEmail ?? String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) return authErrorMessage(error, { signupsDisabled });
    router.replace(next);
    router.refresh();
    return null;
  }, null);
  const passwordHintId = useId();
  const errorId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => signUp(form));
  }

  return (
    <div className="flex flex-col gap-6">
      {providers.length > 0 && !invitedEmail && (
        <>
          <SocialSignIn providers={providers} next={next} />
          <OrDivider />
        </>
      )}
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              autoFocus
              maxLength={PERSON_NAME_MAX_LENGTH}
              className="h-9"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-9 read-only:bg-muted read-only:text-muted-foreground"
              {...(invitedEmail ? { value: invitedEmail, readOnly: true } : {})}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <SecretInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${passwordHintId} ${errorId}` : passwordHintId}
            />
            <FieldDescription id={passwordHintId}>
              At least {MIN_PASSWORD_LENGTH} characters.
            </FieldDescription>
          </Field>
          {error && <FieldError id={errorId}>{error}</FieldError>}
          <Button type="submit" size="lg" className="mt-1" disabled={pending}>
            {pending && <Spinner />}
            Create account
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
