/** Roles of a workspace's members, from the most to the least powerful. */
export const WORKSPACE_ROLES = ["owner", "admin", "member"] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** How the app names and explains each role. */
export const ROLE_DETAILS: Record<WorkspaceRole, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Everything, including deleting the workspace" },
  admin: { label: "Admin", description: "Screens, Stripe accounts and people" },
  member: { label: "Member", description: "Screens and Stripe accounts" },
};

/** Better Auth stores multiple roles comma-separated: the highest one wins. */
export function parseRole(role: string | null): WorkspaceRole {
  const roles = (role ?? "").split(",").map((value) => value.trim());
  return WORKSPACE_ROLES.find((candidate) => roles.includes(candidate)) ?? "member";
}

/** Owners and admins manage the workspace and its people; members use it. */
export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}
