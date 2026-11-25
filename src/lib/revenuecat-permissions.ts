/**
 * Permissions of the RevenueCat API v2 secret key users create for the app. Read access is enough
 * to compute every metric; the only write permission lets the app register its own webhook
 * integration for instant updates. `id` is RevenueCat's scope identifier, `label` what the
 * dashboard shows.
 */
export const REVENUECAT_KEY_PERMISSIONS = [
  {
    id: "project_configuration:projects:read",
    label: "Projects",
    section: "Project configuration",
    access: "Read",
  },
  {
    id: "charts_metrics:overview:read",
    label: "Overview",
    section: "Charts & metrics",
    access: "Read",
  },
  {
    id: "charts_metrics:charts:read",
    label: "Charts",
    section: "Charts & metrics",
    access: "Read",
  },
  {
    id: "project_configuration:products:read",
    label: "Products",
    section: "Project configuration",
    access: "Read",
    optional: true,
    purpose: "Show product names and billing intervals on live sales",
  },
  {
    id: "project_configuration:integrations:read_write",
    label: "Integrations",
    section: "Project configuration",
    access: "Write",
    optional: true,
    purpose: "Instant updates instead of periodic checks",
  },
] as const satisfies readonly RevenueCatKeyPermission[];

export interface RevenueCatKeyPermission {
  id: string;
  label: string;
  section: string;
  access: "Read" | "Write";
  optional?: boolean;
  purpose?: string;
}

export type RevenueCatPermissionId = (typeof REVENUECAT_KEY_PERMISSIONS)[number]["id"];

/** How the RevenueCat dashboard names a permission, e.g. `Charts (Read)`. */
export function revenueCatPermissionLabel(id: string): string {
  const permission = REVENUECAT_KEY_PERMISSIONS.find((candidate) => candidate.id === id);
  return permission ? `${permission.label} (${permission.access})` : id;
}

export const REVENUECAT_DASHBOARD_URL = "https://app.revenuecat.com/";
