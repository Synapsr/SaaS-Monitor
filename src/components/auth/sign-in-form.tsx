"use client";

import { CircleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { SecretInput } from "@/components/secret-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import type { SocialProvider } from "@/lib/social-providers";
import { authErrorMessage } from "./auth-errors";
import { OrDivider, SocialSignIn } from "./social-sign-in";

export function SignInForm({
  next,
  providers,
  initialError,
}: {
  next: string;
  providers: SocialProvider[];
  initialError: string | null;
}) {
  const router = useRouter();
  // A failed social sign-in comes back as a page error; a wrong password is a field error.
  const [pageError, setPageError] = useState(initialError);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const errorId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPageError(null);
    setError(null);
    startTransition(async () => {
      const { error } = await authClient.signIn.email({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error) {
        setError(authErrorMessage(error));
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {pageError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription className="text-destructive">{pageError}</AlertDescription>
        </Alert>
      )}
      {providers.length > 0 && (
        <>
          <SocialSignIn providers={providers} next={next} />
          <OrDivider />
        </>
      )}
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              className="h-9"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <SecretInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </Field>
          {error && <FieldError id={errorId}>{error}</FieldError>}
          <Button type="submit" size="lg" className="mt-1" disabled={pending}>
            {pending && <Spinner />}
            Sign in
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
