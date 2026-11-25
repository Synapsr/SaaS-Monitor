export const ACCOUNT_PROVIDERS = ["stripe", "revenuecat"] as const;

export type AccountProvider = (typeof ACCOUNT_PROVIDERS)[number];

export function providerLabel(provider: AccountProvider): string {
  return provider === "revenuecat" ? "RevenueCat" : "Stripe";
}
