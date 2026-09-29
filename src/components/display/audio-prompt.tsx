import { VolumeXIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useDisplayLocale } from "@/hooks/use-display-locale";

/**
 * Asks for the one click browsers require before playing sound. It lives in the top bar so that
 * it never hides numbers, even on a kiosk without a mouse. Any click or key press on the page
 * works (see `useAudioUnlock`), and the prompt waits a moment before showing, so screens where
 * audio is already allowed never see it flash.
 */
export function AudioPrompt({ visible }: { visible: boolean }) {
  const { text } = useDisplayLocale();
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)", transition: { delay: 1.5, duration: 0.6 } }}
          exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.25 } }}
          className="flex items-center gap-3 rounded-full bg-(--surface) py-2 pr-5 pl-4 text-lg whitespace-nowrap text-(--ink-2) ring-1 ring-(--hairline) transition-[background-color,color,scale] duration-150 hover:bg-(--fill-hover) hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow) focus-visible:outline-none active:scale-[0.96]"
        >
          <VolumeXIcon aria-hidden className="size-[1.15em] text-(--glow)" />
          {text.topBar.enableSound}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
