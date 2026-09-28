"use client";

import {
  CircleAlertIcon,
  EyeOffIcon,
  LockIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { startTransition, useActionState, useId, useState } from "react";
import { connectAccountAction } from "@/app/app/accounts/actions";
import { SecretInput } from "@/components/secret-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { NAME_MAX_LENGTH } from "@/lib/names";
import { permissionLabel } from "@/lib/stripe-permissions";

type ConnectInput = Parameters<typeof connectAccountAction>[0];
type ConnectResult = Awaited<ReturnType<typeof connectAccountAction>>;

const REASSURANCES = [
  { Icon: ShieldCheckIcon, text: "Read-only: it can’t charge, refund or change anything." },
  { Icon: LockIcon, text: "Encrypted at rest (AES-256-GCM). It never leaves the server." },
  { Icon: EyeOffIcon, text: "Never displayed again: only its last characters are shown." },
];

/** What the pasted key looks like, to warn before sending it. */
function keyHint(key: string): { tone: "info" | "warning"; text: string } | null {
  const value = key.trim();
  if (value.startsWith("sk_")) {
    return {
      tone: "warning",
      text: "This is a secret key with full access to your Stripe account. A restricted key is safer: it can only read.",
    };
  }
  if (value.startsWith("rk_test_")) {
    return { tone: "info", text: "Test mode key: screens will show your test data." };
  }
  return null;
}

export function ConnectAccountForm() {
  const [name, setName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [state, connect, pending] = useActionState(
    (_: ConnectResult | null, input: ConnectInput) => connectAccountAction(input),
    null,
  );
  const keyHintId = useId();
  const hint = keyHint(secretKey);
  const missingPermissions = (state && !state.ok && state.missingPermissions) || [];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() =>
          connect({
            name,
            secretKey,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        );
      }}
    >
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="account-name">Name</FieldLabel>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme"
            required
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            className="h-9"
          />
          <FieldDescription>Usually your product’s name. Shown on your screens.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="secret-key">Restricted key</FieldLabel>
          <SecretInput
            id="secret-key"
            secretName="key"
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder="rk_live_…"
            required
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-[0.8rem]"
            aria-describedby={hint ? keyHintId : undefined}
          />
          {hint && (
            <FieldDescription
              id={keyHintId}
              className={hint.tone === "warning" ? "text-amber-700 dark:text-amber-400" : undefined}
            >
              {hint.text}
            </FieldDescription>
          )}
        </Field>

        <ul className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-sm dark:bg-input/20">
          {REASSURANCES.map(({ Icon, text }) => (
            <li key={text} className="flex gap-2.5">
              <Icon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-pretty text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>

        {state && !state.ok && (
          <Alert variant="destructive">
            {missingPermissions.length > 0 ? <TriangleAlertIcon /> : <CircleAlertIcon />}
            <AlertTitle>{state.error}</AlertTitle>
            {missingPermissions.length > 0 && (
              <AlertDescription>
                <p>
                  Add {missingPermissions.length === 1 ? "it" : "them"} to the key in the Stripe
                  Dashboard, then try again:
                </p>
                <ul className="mt-1.5 list-disc pl-4">
                  {missingPermissions.map((permission) => (
                    <li key={permission}>{permissionLabel(permission)}</li>
                  ))}
                </ul>
              </AlertDescription>
            )}
          </Alert>
        )}

        <Button type="submit" size="lg" className="self-start" disabled={pending}>
          {pending && <Spinner />}
          {pending ? "Checking the key…" : "Connect account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
