"use client";

import { CircleCheckIcon, SendIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteMemberAction, revokeInvitationAction } from "@/app/app/settings/actions";
import { CopyButton, CopyField } from "@/components/app/copy-button";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { WorkspaceRole } from "@/server/workspaces";
import { ROLES } from "./roles";
import { SettingsCard } from "./settings-card";

export interface InvitationRow {
  id: string;
  email: string;
  role: WorkspaceRole;
  /** "in 6 days", computed on the server. */
  expiresLabel: string;
}

function invitationUrl(appUrl: string, invitationId: string) {
  return `${appUrl}/invite/${invitationId}`;
}

/** No email provider needed: invitations are links that the inviter shares however they like. */
export function InviteCard({
  invitations,
  appUrl,
  canInviteOwners,
}: {
  invitations: InvitationRow[];
  appUrl: string;
  canInviteOwners: boolean;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [created, setCreated] = useState<{ email: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const roles = canInviteOwners
    ? (["member", "admin", "owner"] as const)
    : (["member", "admin"] as const);

  function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteMemberAction({ email, role });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated({
        email: email.trim().toLowerCase(),
        url: invitationUrl(appUrl, result.invitationId),
      });
      setEmail("");
    });
  }

  return (
    <SettingsCard
      title="Invite people"
      description="No email is sent: you get a link to share. It works for that email address only, for 7 days."
    >
      <div className="flex flex-col gap-5">
        <form onSubmit={invite} className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              name="email"
              aria-label="Email address"
              placeholder="teammate@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="off"
              className="h-9 sm:flex-1"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            <Select value={role} onValueChange={(value) => setRole(value as WorkspaceRole)}>
              <SelectTrigger aria-label="Role" className="h-9 w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end" className="w-72">
                {roles.map((value) => (
                  <SelectItem key={value} value={value} className="items-start py-1.5">
                    <span className="flex flex-col gap-0.5">
                      <span>{ROLES[value].label}</span>
                      <span className="text-xs text-muted-foreground in-data-[slot=select-value]:hidden">
                        {ROLES[value].description}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <Spinner /> : <SendIcon data-icon="inline-start" />}
              Create invite link
            </Button>
          </div>
          {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
        </form>

        {created && (
          <div className="flex flex-col gap-2 rounded-lg bg-emerald-500/5 p-3 ring-1 ring-emerald-600/20 dark:ring-emerald-400/20">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              Invite link for {created.email}
            </p>
            <CopyField value={created.url} label="Invite link" />
            <p className="text-sm text-pretty text-muted-foreground">
              Send it to them: they sign in or create an account with this email address, and join
              right away.
            </p>
          </div>
        )}

        {invitations.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">Pending invitations</h3>
            <ul className="flex flex-col divide-y">
              {invitations.map((invitation) => (
                <PendingInvitation
                  key={invitation.id}
                  invitation={invitation}
                  url={invitationUrl(appUrl, invitation.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}

function PendingInvitation({ invitation, url }: { invitation: InvitationRow; url: string }) {
  const [pending, startTransition] = useTransition();

  function revoke() {
    startTransition(async () => {
      const result = await revokeInvitationAction(invitation.id);
      if (result.ok) toast.success(`Invitation for ${invitation.email} revoked.`);
      else toast.error(result.error);
    });
  }

  return (
    <li
      className="flex items-center gap-3 py-2.5 transition-opacity data-pending:opacity-50"
      data-pending={pending || undefined}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm">{invitation.email}</p>
        <p className="text-xs text-muted-foreground">
          {ROLES[invitation.role].label} · expires {invitation.expiresLabel}
        </p>
      </div>
      <CopyButton value={url} label="Copy link" variant="ghost" />
      <Button variant="ghost" size="sm" onClick={revoke} disabled={pending}>
        {pending && <Spinner />}
        Revoke
      </Button>
    </li>
  );
}
