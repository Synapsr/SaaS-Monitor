import { useEffect, useState } from "react";
import { isPreviewMessage } from "@/lib/display/preview";
import type { PreviewOverride } from "@/lib/display/state";
import { parseScreenSettings } from "@/lib/screens/settings";

/**
 * Unsaved changes posted by the screen editor that embeds this display as a live preview. Only
 * messages from the app itself are accepted: any other page could frame a public screen URL.
 */
export function usePreviewOverride(enabled: boolean): PreviewOverride | null {
  const [override, setOverride] = useState<PreviewOverride | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) return;
      setOverride({
        name: String(event.data.name),
        settings: parseScreenSettings(event.data.settings),
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled]);

  return enabled ? override : null;
}
