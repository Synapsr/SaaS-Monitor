import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect based on the presence of a session cookie only. The authoritative checks
 * happen server-side in `requireSession()` / `requireWorkspace()`. Signed-in users are not
 * bounced away from the auth pages here: a stale cookie would create a redirect loop.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app/:path*"],
};
