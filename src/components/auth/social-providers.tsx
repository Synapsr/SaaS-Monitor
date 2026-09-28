import { GitHubIcon, GoogleIcon } from "@/components/brand-icons";

/** Providers the sign-in page knows how to display. The server decides which ones are enabled. */
export const SOCIAL_PROVIDERS = {
  github: { label: "GitHub", Icon: GitHubIcon },
  google: { label: "Google", Icon: GoogleIcon },
} as const;

export type SocialProvider = keyof typeof SOCIAL_PROVIDERS;

export function isSocialProvider(id: string): id is SocialProvider {
  return Object.hasOwn(SOCIAL_PROVIDERS, id);
}
