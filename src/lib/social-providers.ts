/** Social sign-in providers the app supports. The server enables those it has credentials for. */
const SOCIAL_PROVIDERS = ["github", "google"] as const;

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const SOCIAL_PROVIDER_NAMES: Record<SocialProvider, string> = {
  github: "GitHub",
  google: "Google",
};

export function isSocialProvider(id: string): id is SocialProvider {
  return SOCIAL_PROVIDERS.some((provider) => provider === id);
}
