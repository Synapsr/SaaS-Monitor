/** Social sign-in providers the app supports. The server enables those it has credentials for. */
export const SOCIAL_PROVIDERS = ["github", "google"] as const;

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export function isSocialProvider(id: string): id is SocialProvider {
  return SOCIAL_PROVIDERS.some((provider) => provider === id);
}
