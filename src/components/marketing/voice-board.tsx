"use client";

import { PlayIcon } from "lucide-react";
import { useId, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { unlockAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { Phrase } from "@/lib/voice/announcements";
import { recordedClipUrl } from "@/lib/voice/moment-speech";
import { RECORDED_PHRASES } from "@/lib/voice/phrases";
import { recordedClip, speak } from "@/lib/voice/player";
import { VOICE_LANGUAGES, voicesOf, type Voice, type VoiceLanguage } from "@/lib/voice/voices";

/** The landing page is in English: languages go by their English names here. */
const LANGUAGE_LABELS: Record<VoiceLanguage, string> = {
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
};

const PHRASES: { id: Phrase; label: string }[] = [
  { id: "payment", label: "Payment" },
  { id: "subscription", label: "New subscriber" },
  { id: "customer", label: "New customer" },
  { id: "upgrade", label: "Upgrade" },
  { id: "goal", label: "Goal reached" },
];

/**
 * Every voice saying the same recorded phrase, in its own language: the clips screens play.
 * `heading` introduces the board where the section around it doesn't.
 */
export function VoiceBoard({ heading }: { heading?: { title: string; description: string } }) {
  const id = useId();
  const [phrase, setPhrase] = useState<Phrase>("payment");
  const [playing, setPlaying] = useState<string | null>(null);

  function play(voice: Voice) {
    const key = `${voice.id}:${phrase}`;
    const clip = recordedClip(recordedClipUrl(voice.id, phrase));
    setPlaying(key);
    const done = () => setPlaying((current) => (current === key ? null : current));
    // Browsers only allow audio from a click: unlock it now, the clip plays once downloaded.
    void unlockAudio().then(() => speak(clip, { volume: 0.9, delayMs: 0 }));
    clip.then((buffer) => setTimeout(done, buffer.duration * 1000 + 200), done);
  }

  return (
    <section
      aria-labelledby={heading ? `${id}-title` : undefined}
      aria-label={heading ? undefined : "Voices"}
      className="flex flex-col gap-6 rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {heading && (
          <div>
            <h3 id={`${id}-title`} className="font-medium text-(--ink)">
              {heading.title}
            </h3>
            <p className="mt-1 text-sm text-pretty text-(--ink-3)">{heading.description}</p>
          </div>
        )}
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={phrase}
          onValueChange={(value) => {
            // Empty when the chosen phrase is clicked again: one stays chosen.
            const chosen = PHRASES.find((option) => option.id === value);
            if (chosen) setPhrase(chosen.id);
          }}
          aria-label="Phrase the voices say"
          className="flex-wrap"
        >
          {PHRASES.map((option) => (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              className="border-white/10 text-(--ink-2) hover:bg-white/[0.06] hover:text-(--ink) focus-visible:ring-(--glow)/50 data-[state=on]:bg-(--glow)/10 data-[state=on]:text-(--ink) data-[state=on]:ring-1 data-[state=on]:ring-(--glow)/50"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {VOICE_LANGUAGES.map((language) => {
          const words = RECORDED_PHRASES[language][phrase];
          return (
            <li key={language} className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-(--ink-2)">{LANGUAGE_LABELS[language]}</p>
                <p lang={language} className="mt-0.5 text-xs text-pretty text-(--ink-3)">
                  “{words}”
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {voicesOf(language).map((voice) => {
                  const active = playing === `${voice.id}:${phrase}`;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => play(voice)}
                      title={voice.description}
                      aria-label={`Play ${voice.name}, a ${LANGUAGE_LABELS[language]} voice, saying “${words}”`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-(--ink-2) ring-1 ring-white/10 transition-colors outline-none hover:bg-white/[0.06] hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)",
                        active && "bg-(--glow)/10 text-(--ink) ring-(--glow)/50",
                      )}
                    >
                      <PlayIcon
                        aria-hidden
                        className={cn("size-3.5 shrink-0 fill-current", active && "text-(--glow)")}
                      />
                      {voice.name}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
