#!/usr/bin/env node
// Creates `.env` from `.env.example` with freshly generated secrets.
// Never overwrites an existing `.env`: your encryption key must stay stable.
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const GENERATED = ["AUTH_SECRET", "ENCRYPTION_KEY", "POSTGRES_PASSWORD"];

const template = await readFile(new URL("../.env.example", import.meta.url), "utf8");
const content = template.replace(
  new RegExp(`^(${GENERATED.join("|")})=$`, "gm"),
  (_, key) => `${key}=${randomBytes(32).toString("hex")}`,
);

try {
  await writeFile(new URL("../.env", import.meta.url), content, { mode: 0o600, flag: "wx" });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log(".env already exists, nothing changed.");
  process.exit(0);
}

console.log(`Created .env with fresh secrets.

Next steps:
  Self-hosting   docker compose up -d                 → http://localhost:3000
  Development    pnpm install && pnpm db:up && pnpm dev`);
