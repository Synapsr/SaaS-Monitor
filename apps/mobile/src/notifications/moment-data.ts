/** What the server notifies phones of: a screen's moment, or the test sent from its dashboard. */
const SCREEN_NOTIFICATIONS: readonly unknown[] = ["moment", "test"];

/**
 * The screen a notification is about: `data: { type: "moment" | "test", screen: key, event }`, as
 * the server sends them (AGENTS.md). `null` for anything else.
 */
export function notificationScreen(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const { type, screen } = data as { type?: unknown; screen?: unknown };
  if (!SCREEN_NOTIFICATIONS.includes(type) || typeof screen !== "string") return null;
  return /^[0-9a-f]{16}$/.test(screen) ? screen : null;
}

interface NotificationRequestLike {
  content: { data?: unknown };
  trigger?: unknown;
}

/**
 * The screen of a notification, whichever way it came: through Expo, whose data
 * expo-notifications reads, or straight from APNs or FCM, whose payload only the trigger keeps
 * (on iOS, `data` comes from the payload's `body`; FCM data is flat).
 */
export function notificationRequestScreen(request: NotificationRequestLike): string | null {
  const trigger = (typeof request.trigger === "object" ? request.trigger : null) as {
    payload?: { body?: unknown } & Record<string, unknown>;
    remoteMessage?: { data?: unknown };
  } | null;
  const candidates = [
    request.content.data,
    trigger?.payload?.body,
    trigger?.payload,
    trigger?.remoteMessage?.data,
  ];
  for (const candidate of candidates) {
    const key = notificationScreen(candidate);
    if (key !== null) return key;
  }
  return null;
}

/**
 * Whether a notification came from a server (APNs, FCM or Expo), rather than from this device: a
 * test scheduled in a screen's settings.
 */
export function isPushNotification(request: Pick<NotificationRequestLike, "trigger">): boolean {
  const trigger = request.trigger;
  return typeof trigger === "object" && trigger !== null && (trigger as { type?: unknown }).type === "push";
}
