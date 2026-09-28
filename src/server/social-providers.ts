import "server-only";
import { isSocialProvider, type SocialProvider } from "@/components/auth/social-providers";
import { auth } from "@/server/auth";

/** Social sign-in buttons to show: only the providers configured on this server. */
export function enabledSocialProviders(): SocialProvider[] {
  return Object.keys(auth().options.socialProviders ?? {}).filter(isSocialProvider);
}
