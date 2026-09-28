/** Tests never run against the development database. Override with TEST_DATABASE_URL. */
export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://saas_monitor:saas_monitor@127.0.0.1:5433/saas_monitor_test";
