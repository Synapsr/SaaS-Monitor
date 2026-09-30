"use client";

import { PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "@/lib/sounds";
import type { Phrase } from "@/lib/voice/announcements";
import { recordedClipUrl } from "@/lib/voice/moment-speech";
import { RECORDED_PHRASES } from "@/lib/voice/phrases";
import { recordedClip, speak } from "@/lib/voice/player";
import { VOICE_LANGUAGES, voicesOf, type Voice, type VoiceLanguage } from "@/lib/voice/voices";
import { cn } from "@/lib/utils";

const PHRASES: { phrase: Phrase; label: string }[] = [
  { phrase: "payment", label: "Payment" },
  { phrase: "subscription", label: "New subscriber" },
  { phrase: "customer", label: "New customer" },
  { phrase: "goal", label: "Goal reached" },
];

/** In English, for this page: screens name their language in their own. */
const LANGUAGE_LABELS: Record<VoiceLanguage, string> = {
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
};

/** The recorded voices, each saying a phrase of the moment the visitor picks. */
export function VoiceBoard() {
  const [phrase, setPhrase] = useState<Phrase>("payment");
  const [speaking, setSpeaking] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function say(voice: Voice) {
    // Browsers only let a page play audio from a click: unlock it before the clip arrives.
    void unlockAudio().then(() =>
      speak(recordedClip(recordedClipUrl(voice.id, phrase)), { volume: 0.9, delayMs: 0 }),
    );
    setSpeaking(voice.id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSpeaking(null), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="What the voices say" className="flex flex-wrap gap-2">
        {PHRASES.map((option) => (
          <button
            key={option.phrase}
            type="button"
            aria-pressed={phrase === option.phrase}
            onClick={() => setPhrase(option.phrase)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm text-(--ink-2) ring-1 ring-white/10 transition-colors outline-none hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)",
              phrase === option.phrase &&
                "bg-(--ink) text-(--screen) ring-(--ink) hover:text-(--screen)",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {VOICE_LANGUAGES.map((language) => (
          <li
            key={language}
            className="flex flex-col gap-4 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.08]"
          >
            <div>
              <h3 className="text-sm font-medium">{LANGUAGE_LABELS[language]}</h3>
              <p lang={language} className="mt-1 text-sm text-pretty text-(--ink-3)">
                “{RECORDED_PHRASES[language][phrase]}”
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-2">
              {voicesOf(language).map((voice) => {
                const active = speaking === voice.id;
                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => say(voice)}
                    aria-label={`Hear ${voice.name} (${voice.description})`}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left ring-1 ring-white/10 transition-colors outline-none hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-(--glow)",
                      active && "bg-(--glow)/10 ring-(--glow)/50",
                    )}
                  >
                    <PlayIcon
                      aria-hidden
                      className={cn(
                        "mt-1 size-3.5 shrink-0 fill-current text-(--ink-2)",
                        active && "text-(--glow)",
                      )}
                    />
                    <span>
                      <span className="block text-sm font-medium">{voice.name}</span>
                      <span className="block text-xs text-(--ink-3)">{voice.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
