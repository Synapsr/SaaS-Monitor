import "server-only";
import { z } from "zod";
import { parseServiceAccount } from "@/server/push/service-account";

const booleanFlag = (defaultValue: boolean) =>
  z
    .enum(["true", "false", "1", "0"])
    .transform((value) => value === "true" || value === "1")
    .default(defaultValue);

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_URL: z
      .url()
      .default("http://localhost:3000")
      .transform((url) => url.replace(/\/+$/, "")),
    DATABASE_URL: z.url({ protocol: /^mysql$/, error: "must be a mysql:// URL" }),
    AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
    ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, "must be 64 hexadecimal characters (openssl rand -hex 32)"),
    DISABLE_SIGNUPS: booleanFlag(false),
    /** Apply pending database migrations when the server starts. */
    MIGRATE_ON_START: booleanFlag(true),
    /** Self-hosted instances ask, now and then, for a star on GitHub: `true` never asks. */
    DISABLE_STAR_PROMPT: booleanFlag(false),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FX_RATES_URL: z
      .url()
      .default("https://api.frankfurter.dev/v1")
      .transform((url) => url.replace(/\/+$/, "")),
    /** Lets screens say their own phrases, with names and amounts (Gradium text-to-speech). */
    GRADIUM_API_KEY: z.string().optional(),
    /** `https://eu.api.gradium.ai/api` or `https://us.api.gradium.ai/api` pin a region. */
    GRADIUM_API_URL: z
      .url()
      .default("https://api.gradium.ai/api")
      .transform((url) => url.replace(/\/+$/, "")),
    /*
     * Notifications straight to the store apps, for the instance that publishes them: they only
     * work with the apps' own keys. Other instances send through Expo, with nothing to set.
     */
    APNS_KEY_ID: z.string().optional(),
    APNS_TEAM_ID: z.string().optional(),
    /** The `.p8` key, its line breaks as they are or escaped as `\n`. */
    APNS_PRIVATE_KEY: z
      .string()
      .optional()
      .transform((key) => key?.replace(/\\n/g, "\n")),
    APNS_BUNDLE_ID: z.string().default("com.saasmonitor.app"),
    /** The Firebase service account's JSON key, which names its project. */
    FCM_SERVICE_ACCOUNT: z.string().optional(),
  })
  .superRefine((values, context) => {
    const apns = [values.APNS_KEY_ID, values.APNS_TEAM_ID, values.APNS_PRIVATE_KEY];
    if (apns.some(Boolean) && !apns.every(Boolean)) {
      context.addIssue({
        code: "custom",
        path: ["APNS_PRIVATE_KEY"],
        message: "APNS_KEY_ID, APNS_TEAM_ID and APNS_PRIVATE_KEY go together",
      });
    }
    if (values.FCM_SERVICE_ACCOUNT && !parseServiceAccount(values.FCM_SERVICE_ACCOUNT)) {
      context.addIssue({
        code: "custom",
        path: ["FCM_SERVICE_ACCOUNT"],
        message: "must be the JSON key of a Google service account",
      });
    }
    for (const provider of ["GITHUB", "GOOGLE"] as const) {
      const id = values[`${provider}_CLIENT_ID`];
      const secret = values[`${provider}_CLIENT_SECRET`];
      if (Boolean(id) !== Boolean(secret)) {
        context.addIssue({
          code: "custom",
          path: [`${provider}_CLIENT_${id ? "SECRET" : "ID"}`],
          message: `is required when ${provider}_CLIENT_${id ? "ID" : "SECRET"} is set`,
        });
      }
    }
  });

export type Env = z.infer<typeof schema>;

function parseEnv(): Env {
  // Compose files commonly pass unset variables as empty strings: treat them as missing.
  const values = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = schema.safeParse(values);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example.`);
  }
  return result.data;
}

let cached: Env | undefined;

/**
 * Validated server configuration. Parsed on first use rather than at import time so that
 * `next build` never needs runtime secrets: images are built once and configured at runtime.
 */
export function env(): Env {
  return (cached ??= parseEnv());
}
