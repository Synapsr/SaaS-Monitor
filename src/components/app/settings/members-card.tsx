import { UserAvatar } from "@/components/app/user-avatar";
import { Badge } from "@/components/ui/badge";
import { canManageMembers, ROLE_DETAILS } from "@/lib/roles";
import type { WorkspaceMember } from "@/server/members";
import type { WorkspaceContext } from "@/server/session";
import { LeaveWorkspaceButton, RemoveMemberButton } from "./member-actions";
import { SettingsCard } from "./settings-card";

export function MembersCard({
  members,
  context,
}: {
  members: WorkspaceMember[];
  context: WorkspaceContext;
}) {
  const canManage = canManageMembers(context.role);
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const rows = members.map((member) => {
    const isSelf = member.userId === context.user.id;
    return {
      member,
      isSelf,
      // A workspace always keeps an owner, and admins can't remove owners.
      canLeave: isSelf && !(member.role === "owner" && ownerCount === 1),
      canRemove: !isSelf && canManage && (member.role !== "owner" || context.role === "owner"),
    };
  });
  const hasActions = rows.some((row) => row.canLeave || row.canRemove);

  return (
    <SettingsCard
      title="Members"
      description="Everyone here can edit the workspace’s screens and Stripe accounts. Owners and admins also manage people."
    >
      <ul className="-my-2 flex flex-col divide-y">
        {rows.map(({ member, isSelf, canLeave, canRemove }) => (
          <li key={member.id} className="flex items-center gap-3 py-3">
            <UserAvatar name={member.name} image={member.image} className="size-9" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-sm font-medium">
                {member.name}
                {isSelf && <span className="font-normal text-muted-foreground"> (you)</span>}
              </p>
              <p className="truncate text-sm text-muted-foreground">{member.email}</p>
            </div>
            <Badge variant={member.role === "member" ? "outline" : "secondary"}>
              {ROLE_DETAILS[member.role].label}
            </Badge>
            {hasActions && (
              <div className="flex w-20 justify-end">
                {canLeave && <LeaveWorkspaceButton workspaceName={context.workspace.name} />}
                {canRemove && <RemoveMemberButton memberId={member.id} name={member.name} />}
              </div>
            )}
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}
