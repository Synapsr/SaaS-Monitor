import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";

/** What Better Auth's client returns when a request fails. */
export interface AuthClientError {
  code?: string;
  message?: string;
  status: number;
}

export const SIGNUPS_CLOSED_MESSAGE =
  "Sign-ups are closed on this server. Ask a workspace owner for an invitation link.";

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Wrong email or password.",
  INVALID_EMAIL: "Enter a valid email address.",
  USER_ALREADY_EXISTS: "An account already uses this email. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account already uses this email. Sign in instead.",
  PASSWORD_TOO_SHORT: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
  PASSWORD_TOO_LONG: "This password is too long.",
};

export function authErrorMessage(
  error: AuthClientError,
  { signupsClosed = false }: { signupsClosed?: boolean } = {},
): string {
  if (error.status === 429) return "Too many attempts. Wait a minute, then try again.";
  // With DISABLE_SIGNUPS, the server refuses to create accounts without a pending invitation.
  if (error.code === "FAILED_TO_CREATE_USER" && signupsClosed) return SIGNUPS_CLOSED_MESSAGE;
  return (
    (error.code && MESSAGES[error.code]) ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

/** Social sign-in failures come back to the sign-in page as `?error=<code>`. */
export function socialErrorMessage(code: string): string {
  return code === "unable_to_create_user" || code === "signup_disabled"
    ? SIGNUPS_CLOSED_MESSAGE
    : "We couldn't sign you in with this provider. Please try again.";
}
