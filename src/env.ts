import "server-only";
import { z } from "zod";

const booleanFlag = z
  .enum(["true", "false", "1", "0"])
  .default("false")
  .transform((value) => value === "true" || value === "1");

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_URL: z
      .url()
      .default("http://localhost:3000")
      .transform((url) => url.replace(/\/+$/, "")),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "must be a postgres:// URL" }),
    AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
    ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, "must be 64 hexadecimal characters (openssl rand -hex 32)"),
    DISABLE_SIGNUPS: booleanFlag,
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FX_RATES_URL: z
      .url()
      .default("https://api.frankfurter.dev/v1")
      .transform((url) => url.replace(/\/+$/, "")),
  })
  .superRefine((values, context) => {
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
