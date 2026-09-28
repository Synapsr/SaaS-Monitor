"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
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
  signupsClosed,
}: {
  next: string;
  providers: SocialProvider[];
  /** Set when signing up to accept an invitation: only this address can accept it. */
  invitedEmail: string | null;
  signupsClosed: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const passwordHintId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const { error } = await authClient.signUp.email({
        name: String(form.get("name")).trim(),
        email: invitedEmail ?? String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error) {
        setError(authErrorMessage(error, { signupsClosed }));
        return;
      }
      router.replace(next);
      router.refresh();
    });
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
              aria-describedby={passwordHintId}
            />
            <FieldDescription id={passwordHintId}>
              At least {MIN_PASSWORD_LENGTH} characters.
            </FieldDescription>
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" size="lg" className="mt-1" disabled={pending}>
            {pending && <Spinner />}
            Create account
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
