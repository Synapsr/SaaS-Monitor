import { auth } from "@/server/auth";

/*
 * The browser only needs these Better Auth endpoints: the dashboard manages workspaces, members
 * and profiles through server actions (`auth().api`), which validate input and check roles. Every
 * other endpoint stays closed, so it cannot be called directly to bypass those checks (for
 * example to list invitations or rename a workspace with arbitrary values).
 */
const BROWSER_ENDPOINTS = new Set([
  "/sign-in/email",
  "/sign-up/email",
  "/sign-in/social",
  "/sign-out",
  "/get-session",
  "/error",
]);
/** OAuth providers redirect back to `/callback/<provider>`. */
const BROWSER_ENDPOINT_PREFIXES = ["/callback/"];

function isBrowserEndpoint(request: Request): boolean {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  return (
    BROWSER_ENDPOINTS.has(path) ||
    BROWSER_ENDPOINT_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function handle(request: Request) {
  if (!isBrowserEndpoint(request)) return new Response("Not Found", { status: 404 });
  return auth().handler(request);
}

export { handle as GET, handle as POST };
