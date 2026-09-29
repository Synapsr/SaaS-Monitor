"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Backdrop } from "@/components/display/backdrop";
import { Dashboard } from "@/components/display/dashboard";
import { MomentOverlay } from "@/components/display/moment-overlay";
import { StatusScreen } from "@/components/display/status-screen";
import { TopBar } from "@/components/display/top-bar";
import { useAudioUnlock } from "@/hooks/use-audio-unlock";
import { useConfetti } from "@/hooks/use-confetti";
import { DisplayLocaleContext } from "@/hooks/use-display-locale";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useIdle } from "@/hooks/use-idle";
import { useMoments } from "@/hooks/use-moments";
import { usePixelShift } from "@/hooks/use-pixel-shift";
import { usePreviewOverride } from "@/hooks/use-preview-override";
import { useRotation } from "@/hooks/use-rotation";
import { useVersionReload } from "@/hooks/use-version-reload";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { accentPalette, accentVariables } from "@/lib/display/accents";
import { displayLocale } from "@/lib/display/i18n";
import { momentAccount, momentCelebration, momentSound } from "@/lib/display/moments";
import { rotationSlides, screenView, TOTAL } from "@/lib/display/rotation";
import { resolveDisplayState } from "@/lib/display/state";
import type { DisplayState } from "@/lib/display/types";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface DisplayProps {
  state: DisplayState;
  /** `false` while polls fail: the last data stays on screen with a discreet indicator. */
  online: boolean;
  /**
   * Embedded in the screen editor (`?preview=1`): silent and passive (no wake lock, no cursor
   * hiding, no reload), and following the editor's unsaved changes.
   */
  preview: boolean;
  /** Reload when the server runs another build. Off for the demo, which has no server. */
  followServerVersion: boolean;
}

/**
 * A wall display: the screen's numbers, the moments that celebrate what just happened, and
 * everything that keeps a kiosk healthy for weeks (wake lock, hidden cursor, pixel shift, updates).
 */
export function Display({ state: fetched, online, preview, followServerVersion }: DisplayProps) {
  const override = usePreviewOverride(preview);
  const state = useMemo(() => resolveDisplayState(fetched, override), [fetched, override]);
  const { settings } = state.screen;
  const serverTime = Date.parse(state.generatedAt);
  const palette = accentPalette(settings.accent, settings.theme);

  const { canvasRef, fire: fireConfetti } = useConfetti();
  const { moment, idle: quiet } = useMoments(state, (started) => {
    const sound = preview ? null : momentSound(started, settings.sound);
    if (sound) playSound(sound, { pack: settings.sound.pack, volume: settings.sound.volume });
    const celebration = momentCelebration(started);
    if (celebration && settings.celebrations) {
      fireConfetti(celebration, palette.confetti);
    }
  });

  // A moment brings the slide of its account on screen: the numbers behind it are the ones it moves.
  const slides = rotationSlides(state);
  const focus = moment && moment.kind !== "test" ? (momentAccount(moment) ?? TOTAL) : undefined;
  const { slide, turn } = useRotation(slides, settings.rotation.seconds, focus);
  const rotation =
    slides.length > 1
      ? { slides, slide, turn, seconds: settings.rotation.seconds, paused: focus !== undefined }
      : null;

  const kiosk = !preview;
  const idle = useIdle(kiosk);
  const fullscreen = useFullscreen();
  const audioUnlocked = useAudioUnlock(kiosk && settings.sound.enabled);
  const content = useRef<HTMLDivElement>(null);
  useWakeLock(kiosk);
  usePixelShift(content, kiosk);
  useVersionReload(state.version, followServerVersion && kiosk && quiet);

  const { toggle: toggleFullscreen } = fullscreen;
  useEffect(() => {
    if (!kiosk) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "f" || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      toggleFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [kiosk, toggleFullscreen]);

  return (
    <DisplayLocaleContext value={displayLocale(settings.language)}>
      <MotionConfig reducedMotion="user">
        <div
          style={accentVariables(palette) as CSSProperties}
          data-theme={settings.theme}
          className={cn("display fixed inset-0 overflow-hidden select-none", idle && "cursor-none")}
        >
          <Backdrop />
          <div
            ref={content}
            className="relative flex h-full flex-col gap-10 px-13 pt-10 pb-12 transition-[translate] duration-[3s] ease-in-out"
          >
            <TopBar
              name={state.screen.name}
              accounts={state.accounts}
              showAccounts={state.status === "ready"}
              rotation={rotation}
              online={online}
              timeZone={settings.timeZone}
              serverTime={serverTime}
              fullscreen={kiosk ? fullscreen : null}
              soundPrompt={kiosk && settings.sound.enabled && !audioUnlocked}
              idle={idle}
            />
            {state.status === "ready" ? (
              // Each account of a rotation fades in with its own numbers, rather than rolling
              // them from the previous account's.
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide}
                  className="flex min-h-0 flex-1 flex-col"
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Dashboard
                    state={state}
                    view={screenView(state, slide)}
                    moment={moment}
                    serverTime={serverTime}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <StatusScreen state={state} />
            )}
          </div>
          <MomentOverlay moment={moment} state={state} />
          <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40 size-full"
          />
        </div>
      </MotionConfig>
    </DisplayLocaleContext>
  );
}
