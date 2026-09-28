import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";
import { siteConfig } from "@/lib/site";
import { ensureWorkspace } from "@/server/workspaces";

const INVITATION_TTL_SECONDS = 7 * 24 * 60 * 60;

function socialProviders() {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env();
  return {
    ...(GITHUB_CLIENT_ID &&
      GITHUB_CLIENT_SECRET && {
        github: { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET },
      }),
    ...(GOOGLE_CLIENT_ID &&
      GOOGLE_CLIENT_SECRET && {
        google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET },
      }),
  };
}

/** With DISABLE_SIGNUPS, only people holding a pending invitation can still create an account. */
async function hasPendingInvitation(email: string): Promise<boolean> {
  const [invitation] = await db()
    .select({ id: schema.invitations.id })
    .from(schema.invitations)
    .where(
      and(
        eq(schema.invitations.email, email.toLowerCase()),
        eq(schema.invitations.status, "pending"),
        gt(schema.invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(invitation);
}

function createAuth() {
  const config = env();
  return betterAuth({
    appName: siteConfig.name,
    baseURL: config.APP_URL,
    secret: config.AUTH_SECRET,
    trustedOrigins: [config.APP_URL],
    database: drizzleAdapter(db(), { provider: "pg", schema, usePlural: true }),
    telemetry: { enabled: false },
    emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
    socialProviders: socialProviders(),
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (config.DISABLE_SIGNUPS && !(await hasPendingInvitation(user.email))) return false;
          },
        },
      },
      session: {
        create: {
          // Runs after the user row is committed (the adapter does not wrap sign-up in a
          // transaction), so a first session can also create the personal workspace.
          before: async (session) => ({
            data: { ...session, activeOrganizationId: await ensureWorkspace(session.userId) },
          }),
        },
      },
    },
    plugins: [
      // Invitations are shared as links from the members page, so no email provider is needed.
      organization({ creatorRole: "owner", invitationExpiresIn: INVITATION_TTL_SECONDS }),
      // Must stay last: lets server actions set auth cookies.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/** Better Auth instance, created on first use (see `env()` for why nothing runs at import time). */
export function auth(): Auth {
  return (instance ??= createAuth());
}
