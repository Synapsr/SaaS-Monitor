/**
 * Tests never run against the development database. Override with TEST_DATABASE_URL. They connect
 * as root, which creates the database when it is missing (see compose.dev.yaml).
 */
export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? "mysql://root:saas_monitor@127.0.0.1:3307/saas_monitor_test";
