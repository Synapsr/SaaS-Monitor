/**
 * Permissions of the restricted key users create for the app. Read access is enough to compute
 * every metric; the only write permission lets the app register its own webhook endpoint for
 * instant updates. `id` is Stripe's identifier, `label` what the Dashboard shows.
 */
export const STRIPE_KEY_PERMISSIONS = [
  { id: "rak_subscription_read", label: "Subscriptions", section: "Billing", access: "Read" },
  { id: "rak_customer_read", label: "Customers", section: "Core", access: "Read" },
  { id: "rak_charge_read", label: "Charges and Refunds", section: "Core", access: "Read" },
  { id: "rak_event_read", label: "Events", section: "Core", access: "Read" },
  { id: "rak_product_read", label: "Products", section: "Core", access: "Read" },
  { id: "rak_plan_read", label: "Prices", section: "Billing", access: "Read" },
  { id: "rak_coupon_read", label: "Coupons", section: "Billing", access: "Read" },
  {
    id: "rak_webhook_write",
    label: "Webhook Endpoints",
    section: "Webhook",
    access: "Write",
    optional: true,
    purpose: "Instant updates instead of periodic checks",
  },
] as const satisfies readonly StripeKeyPermission[];

export interface StripeKeyPermission {
  id: string;
  label: string;
  section: string;
  access: "Read" | "Write";
  optional?: boolean;
  purpose?: string;
}

export type StripePermissionId = (typeof STRIPE_KEY_PERMISSIONS)[number]["id"];

/**
 * Opens the Stripe Dashboard on the restricted key form with the permissions pre-selected.
 * Stripe does not document these parameters, so the UI must also list the permissions.
 */
export function restrictedKeyCreationUrl(keyName: string): string {
  const params = new URLSearchParams({ name: keyName });
  STRIPE_KEY_PERMISSIONS.forEach((permission, index) => {
    params.set(`permissions[${index}]`, permission.id);
  });
  return `https://dashboard.stripe.com/apikeys/create?${params.toString()}`;
}
