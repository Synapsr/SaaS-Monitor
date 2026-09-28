"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DisplayFrame } from "@/components/display-frame";
import {
  isPreviewReadyMessage,
  PREVIEW_MESSAGE_TYPE,
  type PreviewMessage,
} from "@/lib/display/preview";
import type { ScreenSettings } from "@/lib/screens/settings";
import { cn } from "@/lib/utils";
import { ScreenThumbnail } from "./screen-thumbnail";

/**
 * The real display (`/d/<token>?preview=1`) scaled down to its container. Unsaved settings are
 * posted to it (see `src/lib/display/preview.ts`) so that it reacts instantly to every change.
 */
export function ScreenPreview({
  token,
  name,
  settings,
  className,
}: {
  token: string;
  name: string;
  settings: ScreenSettings;
  className?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  // The settings are posted after each load of the display, and each time it says it listens: it
  // may still be hydrating when it loads. Applying the same settings twice is harmless.
  const [postRequests, setPostRequests] = useState(0);
  const requestPost = useCallback(() => setPostRequests((count) => count + 1), []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const fromFrame = event.source !== null && event.source === frameRef.current?.contentWindow;
      if (fromFrame && event.origin === window.location.origin && isPreviewReadyMessage(event.data))
        requestPost();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [requestPost]);

  useEffect(() => {
    if (!postRequests) return;
    const message: PreviewMessage = { type: PREVIEW_MESSAGE_TYPE, name, settings };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [postRequests, name, settings]);

  return (
    // A thin bezel makes it read as a TV, and separates it from dark pages.
    <div
      className={cn(
        "rounded-xl bg-neutral-900 p-1.5 shadow-sm ring-1 ring-black/10 dark:ring-white/10",
        className,
      )}
    >
      <DisplayFrame
        src={`/d/${token}?preview=1`}
        title={`Live preview of ${name}`}
        frameRef={frameRef}
        onLoad={requestPost}
        placeholder={<ScreenThumbnail accent={settings.accent} />}
        className="isolate rounded-md bg-neutral-950"
      />
    </div>
  );
}
