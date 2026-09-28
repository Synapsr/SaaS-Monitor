import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./src/test/database-url";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

const shared = {
  resolve: {
    alias: {
      "@": path("./src"),
      "server-only": path("./src/test/server-only.ts"),
    },
  },
};

export default defineConfig({
  test: {
    env: {
      AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
      ENCRYPTION_KEY: "0f".repeat(32),
      DATABASE_URL: testDatabaseUrl,
    },
    projects: [
      {
        ...shared,
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.db.test.{ts,tsx}"],
        },
      },
      {
        ...shared,
        extends: true,
        test: {
          // Tests touching PostgreSQL (`*.db.test.ts`) share one database: run files serially.
          name: "db",
          environment: "node",
          include: ["src/**/*.db.test.{ts,tsx}"],
          globalSetup: ["./src/test/global-setup.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});
