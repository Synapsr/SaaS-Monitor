import { isSocialProvider, type SocialProvider } from "@/lib/social-providers";

/*
 * A sign-up with GitHub or Google ends on the provider's redirect, not in a form of this app.
 * Better Auth sends new accounts to a URL of their own (`newUserCallbackURL`): the usual
 * destination, marked with this parameter. The page they land on counts the sign-up, then drops
 * the mark from its URL.
 */
const SIGNUP_PARAM = "signup";

const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

/** `next`, a path of this site, marked as the landing page of a sign-up with `provider`. */
export function markSignup(next: string, provider: SocialProvider): string {
  const url = new URL(next, PLACEHOLDER_ORIGIN);
  url.searchParams.set(SIGNUP_PARAM, provider);
  return `${url.pathname}${url.search}${url.hash}`;
}

export interface SignupMark {
  method: SocialProvider;
  /** The new account came to join a workspace, through an invitation link. */
  invited: boolean;
  /** The page's path without the mark, for `history.replaceState`. */
  path: string;
}

/** The social sign-up whose landing page `href` is, or `null`. */
export function readSignupMark(href: string): SignupMark | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const method = url.searchParams.get(SIGNUP_PARAM);
  if (method === null || !isSocialProvider(method)) return null;

  url.searchParams.delete(SIGNUP_PARAM);
  return {
    method,
    invited: url.pathname.startsWith("/invite/"),
    path: `${url.pathname}${url.search}${url.hash}`,
  };
}
