import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/site/section";
import { SoundBoard } from "@/components/site/sound-board";
import { soundBoardPacks, voiceBoardProps } from "@/components/site/sound-props";
import { VoiceBoard } from "@/components/site/voice-board";
import type { SiteText } from "@/lib/site/i18n";

/**
 * The sounds of a sale, to play right here: a band of its own, lit from above, with the voices
 * that follow them.
 */
export function Sounds({
  text,
  locale,
  files,
}: {
  text: SiteText["sounds"];
  locale: string;
  /** The page offering every sound as a file. */
  files: string;
}) {
  return (
    <section
      aria-labelledby="sounds-title"
      id="sounds"
      className="relative mt-24 py-20 sm:mt-28 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-(--surface-raised) via-(--surface) to-transparent shadow-[0_-1px_0_var(--hairline)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(40%_100%_at_50%_0%,var(--glow-faint),transparent)]"
      />
      <Container>
        <SectionHeading
          id="sounds-title"
          align="center"
          eyebrow={text.eyebrow}
          title={text.title}
          lead={text.lead}
        />
        <div className="mt-14 flex flex-col gap-4">
          <SoundBoard packs={soundBoardPacks(text)} />
          <VoiceBoard
            heading={{ title: text.voices.title, text: text.voices.text }}
            {...voiceBoardProps(text, locale)}
          />
        </div>
        <p className="mt-8 text-center">
          <Link
            href={files}
            className="group inline-flex items-center gap-1.5 rounded-full text-sm text-(--ink-2) transition-colors duration-150 hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--glow)"
          >
            {text.files}
            <ArrowRightIcon
              aria-hidden
              className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        </p>
      </Container>
    </section>
  );
}
