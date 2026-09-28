import "dotenv/config";
import { runMigrations } from "./migrations";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is required.");
  process.exitCode = 1;
} else {
  runMigrations(url)
    .then(() => console.log("Database migrations completed."))
    .catch((error: unknown) => {
      console.error("Migration failed:", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
