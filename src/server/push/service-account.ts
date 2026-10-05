import "server-only";
import { z } from "zod";

/** The JSON key of a Google service account, as Firebase hands it out (`FCM_SERVICE_ACCOUNT`). */
const serviceAccountSchema = z.object({
  project_id: z.string().min(1),
  client_email: z.string().min(1),
  private_key: z.string().min(1),
  token_uri: z.url().default("https://oauth2.googleapis.com/token"),
});

export type ServiceAccount = z.infer<typeof serviceAccountSchema>;

/** `null` when `json` is no service account key. */
export function parseServiceAccount(json: string): ServiceAccount | null {
  try {
    return serviceAccountSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}
