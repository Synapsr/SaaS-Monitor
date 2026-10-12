import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { isHostedInstance } from "@/lib/site";
import { siteRoute } from "@/lib/site/routing";

/**
 * Two jobs. The dashboard (`/app`) redirects visitors without a session cookie to sign in: an
 * optimistic check, the authoritative ones happen server-side in `requireSession()` /
 * `requireWorkspace()`. Signed-in users are not bounced away from the auth pages here: a stale
 * cookie would create a redirect loop.
 *
 * And the public site, under `app/[lang]`, serves English without a prefix (`siteRoute`). Its
 * language is the address's, never the browser's: a crawler that sends no `Accept-Language` must
 * find the same page as everyone.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/app" || pathname.startsWith("/app/")) return dashboard(request);

  const route = siteRoute(pathname);
  if (route.kind === "other") return NextResponse.next();
  if (route.kind === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = route.pathname;
    return NextResponse.redirect(url, 308);
  }

  const response = route.rewrite
    ? NextResponse.rewrite(new URL(`${route.rewrite}${request.nextUrl.search}`, request.url))
    : NextResponse.next();
  // Self-hosted instances serve the same site as saas-monitor.com: keep their copy out of search
  // results (its canonical links point to the original). Decided at request time: one Docker
  // image, built once, serves every instance.
  if (!servesHostedSite()) response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

function servesHostedSite(): boolean {
  try {
    return isHostedInstance(process.env.APP_URL || "http://localhost:3000");
  } catch {
    return false;
  }
}

function dashboard(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything but the build's files, the API, screens, invitations, audio and other files with
  // an extension: `siteRoute` sorts out the rest.
  matcher: ["/((?!_next/|api/|d/|sounds/|voices/|invite/|.*\\.[a-zA-Z0-9]+$).*)"],
};
