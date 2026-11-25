"use client";

import {
  ChevronRightIcon,
  CircleAlertIcon,
  EyeOffIcon,
  LockIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { startTransition, useActionState, useId, useState } from "react";
import { connectRevenueCatAccountAction } from "@/app/(product)/app/accounts/actions";
import { SecretInput } from "@/components/secret-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { NAME_MAX_LENGTH } from "@/lib/names";
import { revenueCatPermissionLabel } from "@/lib/revenuecat-permissions";

type ConnectInput = Parameters<typeof connectRevenueCatAccountAction>[0];
type ConnectResult = Awaited<ReturnType<typeof connectRevenueCatAccountAction>>;

const REASSURANCES = [
  {
    Icon: ShieldCheckIcon,
    text: "Read-only, apart from its own webhook: it can’t modify subscribers, grant entitlements or refund.",
  },
  { Icon: LockIcon, text: "Encrypted at rest (AES-256-GCM). It never leaves the server." },
  { Icon: EyeOffIcon, text: "Never displayed again: only its last characters are shown." },
];

function keyHint(key: string): { tone: "info" | "warning"; text: string } | null {
  const value = key.trim();
  if (/^(?:sk|rk|pk)_(?:live|test)_/.test(value)) {
    return {
      tone: "warning",
      text: "This looks like a Stripe key. Switch to Stripe above, or paste a RevenueCat v2 secret key (sk_…).",
    };
  }
  if (/^(?:appl|goog|amzn|strp|rcb|test)_/.test(value)) {
    return {
      tone: "warning",
      text: "This is a public SDK key. Create an API v2 secret key instead (starts with sk_).",
    };
  }
  return null;
}

export function ConnectRevenueCatForm() {
  const [name, setName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [projectId, setProjectId] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [state, connect, pending] = useActionState(
    (_: ConnectResult | null, input: ConnectInput) => connectRevenueCatAccountAction(input),
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
            projectId: projectId.trim() || undefined,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        );
      }}
    >
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="rc-account-name">Name</FieldLabel>
          <Input
            id="rc-account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme iOS & Android"
            required
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            className="h-9"
          />
          <FieldDescription>Usually your app’s name. Shown on your screens.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="rc-secret-key">Secret API key (v2)</FieldLabel>
          <SecretInput
            id="rc-secret-key"
            secretName="API key"
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder="sk_…"
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

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="group/trigger flex items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            <ChevronRightIcon className="size-4 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
            Project ID (optional)
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden pt-3 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <Field>
              <FieldLabel htmlFor="rc-project-id">Project ID</FieldLabel>
              <Input
                id="rc-project-id"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                placeholder="proj1ab2c3d4"
                autoComplete="off"
                spellCheck={false}
                className="h-9 font-mono text-[0.8rem]"
              />
              <FieldDescription>
                Detected automatically for project-scoped keys. Only needed if your key can read
                multiple projects.
              </FieldDescription>
            </Field>
          </CollapsibleContent>
        </Collapsible>

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
                  Add {missingPermissions.length === 1 ? "it" : "them"} to the key in RevenueCat,
                  then try again:
                </p>
                <ul className="mt-1.5 list-disc pl-4">
                  {missingPermissions.map((permission) => (
                    <li key={permission}>{revenueCatPermissionLabel(permission)}</li>
                  ))}
                </ul>
              </AlertDescription>
            )}
          </Alert>
        )}

        <Button type="submit" size="lg" className="self-start" disabled={pending}>
          {pending && <Spinner />}
          {pending ? "Checking the key…" : "Connect RevenueCat"}
        </Button>
      </FieldGroup>
    </form>
  );
}
