import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHeader } from "@/components/app/page-header";
import { DeleteWorkspaceCard } from "@/components/app/settings/delete-workspace-card";
import { InviteCard } from "@/components/app/settings/invite-card";
import { MembersCard } from "@/components/app/settings/members-card";
import { ProfileCard } from "@/components/app/settings/profile-card";
import { WorkspaceNameCard } from "@/components/app/settings/workspace-name-card";
import { env } from "@/env";
import { formatRelativeTime } from "@/lib/format";
import { canManageMembers } from "@/lib/roles";
import { listMembers, listPendingInvitations } from "@/server/members";
import { requireWorkspace } from "@/server/session";
import { listUserWorkspaces } from "@/server/workspace-admin";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const context = await requireWorkspace();
  const requestHeaders = await headers();
  const canManage = canManageMembers(context.role);
  const [members, invitations, workspaces] = await Promise.all([
    listMembers(context, requestHeaders),
    canManage ? listPendingInvitations(context, requestHeaders) : [],
    listUserWorkspaces(context.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="The workspace, the people in it, and your profile."
      />
      <div className="flex flex-col gap-6">
        <WorkspaceNameCard name={context.workspace.name} canEdit={canManage} />
        <MembersCard members={members} context={context} />
        {canManage && (
          <InviteCard
            appUrl={env().APP_URL}
            canInviteOwners={context.role === "owner"}
            invitations={invitations.map((invitation) => ({
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
              expiresLabel: formatRelativeTime(invitation.expiresAt),
            }))}
          />
        )}
        <ProfileCard name={context.user.name} email={context.user.email} />
        {context.role === "owner" && (
          <DeleteWorkspaceCard
            workspaceName={context.workspace.name}
            isOnlyWorkspace={workspaces.length === 1}
          />
        )}
      </div>
    </div>
  );
}
