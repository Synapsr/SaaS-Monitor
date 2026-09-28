import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path("./src"),
      "server-only": path("./src/test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
      ENCRYPTION_KEY: "0f".repeat(32),
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgres://saas_monitor:saas_monitor@127.0.0.1:5433/saas_monitor_test",
    },
  },
});
