import type { WorkspaceRole } from "@/server/workspaces";

export const ROLES: Record<WorkspaceRole, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Everything, including deleting the workspace" },
  admin: { label: "Admin", description: "Screens, Stripe accounts and people" },
  member: { label: "Member", description: "Screens and Stripe accounts" },
};
