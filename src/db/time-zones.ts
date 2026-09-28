import "server-only";
import { createConnection, type RowDataPacket } from "mysql2/promise";

/**
 * Checks that MySQL can convert between named time zones, when the server starts. Screens bucket
 * their days with `CONVERT_TZ`, which needs the server's time zone tables: without them it returns
 * NULL, and every total and chart comes out empty. The official Docker image loads them; other
 * servers may not.
 */
export async function checkTimeZoneTables(databaseUrl: string) {
  const connection = await createConnection(databaseUrl);
  try {
    const [[{ converted }]] = await connection.query<RowDataPacket[]>(
      "select convert_tz('2026-01-01 00:00:00', '+00:00', 'Europe/Paris') as converted",
    );
    if (converted === null) {
      throw new Error(
        "MySQL cannot convert time zones: its time zone tables are empty. Load them with " +
          "`mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root -p mysql` on the database " +
          "server, then start the app again. See " +
          "https://dev.mysql.com/doc/refman/8.4/en/time-zone-support.html",
      );
    }
  } finally {
    await connection.end();
  }
}
