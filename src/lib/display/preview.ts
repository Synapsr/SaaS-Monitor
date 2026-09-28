import type { ScreenSettings } from "@/lib/screens/settings";

/**
 * The screen editor embeds `/d/<token>?preview=1` in an iframe and posts unsaved changes to it,
 * so the preview reacts instantly instead of waiting for the next poll.
 */
export const PREVIEW_MESSAGE_TYPE = "saas-monitor:preview";

export interface PreviewMessage {
  type: typeof PREVIEW_MESSAGE_TYPE;
  name: string;
  settings: ScreenSettings;
}

export function isPreviewMessage(value: unknown): value is PreviewMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === PREVIEW_MESSAGE_TYPE
  );
}
