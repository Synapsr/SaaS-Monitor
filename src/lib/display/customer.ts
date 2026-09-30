import type { FeedItem } from "@/lib/display/types";
import type { CustomerEmails } from "@/lib/screens/settings";

/**
 * An email with its first letter and domain only: `j•••@gmail.com`. Enough for the team to tell
 * customers apart, not to write to them or look them up. `null` for anything that is no email.
 */
export function maskEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at).trim();
  const domain = email.slice(at + 1).trim();
  if (at < 1 || !local || !domain) return null;
  return `${[...local][0]}•••@${domain}`;
}

/** The email a screen shows for a customer, as its settings allow. */
export function shownEmail(email: string | null, setting: CustomerEmails): string | null {
  if (email === null || setting === "hidden") return null;
  return setting === "masked" ? maskEmail(email) : email;
}

/** Who a feed item is about, as the screen may show them: their name, else their email. */
export function customerLabel(item: Pick<FeedItem, "customerName" | "customerEmail">) {
  return item.customerName ?? item.customerEmail;
}
