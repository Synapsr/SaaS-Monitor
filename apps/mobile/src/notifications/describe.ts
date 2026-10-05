import type { NotificationsStatus } from "@/notifications/status";

/** How the notifications of this device stand, for a note under the switches; `null` when fine. */
export function notificationsNote(status: NotificationsStatus): string | null {
  switch (status.kind) {
    case "loading":
    case "ready":
    case "undetermined":
      return null;
    case "denied":
      return "Notifications are off for SaaS Monitor. Turn them on in Settings to get your screens’ moments.";
    case "unconfigured":
      return "This build of the app can’t receive notifications: it has no push configuration.";
    case "unavailable":
      return "Notifications can’t be set up right now. The app tries again next time it opens.";
  }
}
