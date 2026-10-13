import type { NotificationsStatus } from "@/notifications/status";

/**
 * Whether a device token the system reports is news. Fetching the token reports it too, unchanged:
 * refreshing for it would fetch it again, and again. A rolled token is new, and every screen's
 * instance must hear of it.
 */
export function isNewDeviceToken(status: NotificationsStatus, token: string): boolean {
  return status.kind !== "ready" || status.tokens.deviceToken !== token;
}
