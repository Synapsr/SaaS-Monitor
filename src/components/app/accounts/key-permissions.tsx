import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STRIPE_KEY_PERMISSIONS, type StripeKeyPermission } from "@/lib/stripe-permissions";
import { cn } from "@/lib/utils";

/** Stripe lists core resources first on the restricted key form: follow the same order. */
const SECTION_ORDER = ["Core", "Billing"];

function sections(): [string, StripeKeyPermission[]][] {
  const groups = new Map<string, StripeKeyPermission[]>();
  for (const permission of STRIPE_KEY_PERMISSIONS) {
    groups.set(permission.section, [...(groups.get(permission.section) ?? []), permission]);
  }
  const rank = (section: string) => {
    const index = SECTION_ORDER.indexOf(section);
    return index === -1 ? SECTION_ORDER.length : index;
  };
  return [...groups].sort(([a], [b]) => rank(a) - rank(b));
}

/** "Subscriptions (Read)" for a permission id reported as missing by Stripe. */
export function describePermission(id: string): string {
  const permission = STRIPE_KEY_PERMISSIONS.find((candidate) => candidate.id === id);
  return permission ? `${permission.label} (${permission.access})` : id;
}

/** The permissions to set on the restricted key, as Stripe's form names them. */
export function KeyPermissions() {
  return (
    <div className="flex flex-col gap-5">
      {sections().map(([section, permissions]) => (
        <div key={section} className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-muted-foreground">{section}</h3>
          <ul className="flex flex-col">
            {permissions.map((permission) => (
              <li key={permission.id} className="flex items-start gap-3 py-1.5 text-sm">
                <CheckIcon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    permission.optional
                      ? "text-muted-foreground"
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span>{permission.label}</span>
                  {permission.purpose && (
                    <span className="text-xs text-pretty text-muted-foreground">
                      Optional: {permission.purpose.toLowerCase()}.
                    </span>
                  )}
                </div>
                <Badge variant={permission.access === "Write" ? "outline" : "secondary"}>
                  {permission.access}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
