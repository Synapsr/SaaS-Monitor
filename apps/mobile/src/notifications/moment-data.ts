/**
 * The screen a notification is about: `data: { type: "moment", screen: key, event }`, as the
 * server sends moments (AGENTS.md). `null` for anything else.
 */
export function notificationScreen(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const { type, screen } = data as { type?: unknown; screen?: unknown };
  if (type !== "moment" || typeof screen !== "string") return null;
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
