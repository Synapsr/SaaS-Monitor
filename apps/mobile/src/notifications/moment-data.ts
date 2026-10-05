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
