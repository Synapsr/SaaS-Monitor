import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { members, screens } from "@/db/schema";
import { env } from "@/env";
import { DAY_SECONDS } from "@/lib/durations";
import {
  parseScreenSettings,
  type Accent,
  type Language,
  type Theme,
} from "@/lib/screens/settings";
import { auth } from "@/server/auth";
import { isScreenToken } from "@/server/display/state";
import { clientAddress, createRateLimiter } from "@/server/rate-limit";

/*
 * A screen's link is its key. A password may lock it further: a device that types it keeps a
 * cookie proving it, bound to the password, so that a new password locks every device out
 * again. The SaaS Monitor app keeps the same proof, and sends it in a header. Signed-in members of
 * the screen's workspace never need it: the editor's preview and the "Open screen" button just
 * work.
 */

/** Where the app sends the proof of a screen's password: the value of the browsers' cookie. */
export const SCREEN_ACCESS_HEADER = "x-screen-access";

/** How long a device remembers a password: the longest browsers keep a cookie. */
const ACCESS_DAYS = 400;

/** Screen passwords are typed with a remote: short ones are fine, guessing them is not. */
const unlockAttempts = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 });

/** A password typed in the app (`POST /api/screens/:token/access`). */
export const accessRequestSchema = z.object({ password: z.string().min(1).max(128) });

/** What guards a screen, and how its lock looks: in its language, theme and color. */
export interface ScreenLock {
  screenId: string;
  workspaceId: string;
  passwordHash: string | null;
  language: Language;
  theme: Theme;
  accent: Accent;
}

export async function findScreenLock(token: string): Promise<ScreenLock | null> {
  if (!isScreenToken(token)) return null;
  const [screen] = await db()
    .select({
      screenId: screens.id,
      workspaceId: screens.workspaceId,
      passwordHash: screens.passwordHash,
      settings: screens.settings,
    })
    .from(screens)
    .where(eq(screens.publicToken, token));
  if (!screen) return null;
  const { settings, ...lock } = screen;
  const { language, theme, accent } = parseScreenSettings(settings);
  return { ...lock, language, theme, accent };
}

export function hashScreenPassword(password: string): Promise<string> {
  return hashPassword(password);
}

/** One cookie per screen: a device may show several. */
function accessCookieName(screenId: string): string {
  return `screen-access-${screenId}`;
}

/** Changes with the password, and can't be forged without the server's secret. */
function accessProof(screenId: string, passwordHash: string): string {
  return createHmac("sha256", env().AUTH_SECRET)
    .update(`screen-access:${screenId}:${passwordHash}`)
    .digest("base64url");
}

function readCookie(header: string | null, name: string): string | null {
  for (const pair of header?.split(";") ?? []) {
    const [key, ...value] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function isProof(value: string | null, expected: string): boolean {
  if (value === null || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

/**
 * Whether a request may see a screen: it has no password, the request carries the proof of it (a
 * browser's cookie, or the app's header), or it comes from a member of the screen's workspace.
 */
export async function canViewScreen(lock: ScreenLock, headers: Headers): Promise<boolean> {
  if (lock.passwordHash === null) return true;
  const expected = accessProof(lock.screenId, lock.passwordHash);
  const proofs = [
    headers.get(SCREEN_ACCESS_HEADER),
    readCookie(headers.get("cookie"), accessCookieName(lock.screenId)),
  ];
  if (proofs.some((proof) => isProof(proof, expected))) return true;

  const session = await auth().api.getSession({ headers });
  if (!session) return false;
  const [member] = await db()
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.userId, session.user.id), eq(members.organizationId, lock.workspaceId)))
    .limit(1);
  return member !== undefined;
}

export interface AccessCookie {
  name: string;
  /** The proof of the password, which the app sends as `X-Screen-Access` instead. */
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
}

export type UnlockResult =
  | { outcome: "unlocked"; cookie: AccessCookie | null }
  | { outcome: "wrong-password" | "too-many-attempts" | "gone" };

/**
 * Checks a password typed on a screen's lock, and returns the cookie that opens it on this device
 * from now on. Attempts are limited per screen and client address.
 */
export async function unlockScreen(
  token: string,
  password: string,
  headers: Headers,
): Promise<UnlockResult> {
  const lock = await findScreenLock(token);
  if (!lock) return { outcome: "gone" };
  // Removed in the meantime: nothing left to prove.
  if (lock.passwordHash === null) return { outcome: "unlocked", cookie: null };
  if (!unlockAttempts.consume(`${lock.screenId}:${clientAddress(headers)}`)) {
    return { outcome: "too-many-attempts" };
  }
  if (!(await verifyPassword({ hash: lock.passwordHash, password }))) {
    return { outcome: "wrong-password" };
  }
  return {
    outcome: "unlocked",
    cookie: {
      name: accessCookieName(lock.screenId),
      value: accessProof(lock.screenId, lock.passwordHash),
      options: {
        httpOnly: true,
        secure: env().APP_URL.startsWith("https://"),
        sameSite: "lax",
        // The screen's page and its polling endpoint both read it.
        path: "/",
        maxAge: ACCESS_DAYS * DAY_SECONDS,
      },
    },
  };
}
