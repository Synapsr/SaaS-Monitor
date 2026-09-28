import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "mysql",
  casing: "snake_case",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ?? "mysql://saas_monitor:saas_monitor@127.0.0.1:3307/saas_monitor",
  },
  strict: true,
  verbose: true,
});
