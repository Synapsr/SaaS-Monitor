"use client";

import { useId, useState } from "react";
import { PlayingIcon } from "@/components/site/sound-board";
import { unlockAudio } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { Phrase } from "@/lib/voice/announcements";
import { recordedClipUrl } from "@/lib/voice/clips";
import { recordedClip, speak } from "@/lib/voice/player";
import type { VoiceId } from "@/lib/voice/voices";

export interface VoiceBoardLanguage {
  /** BCP 47, for the words in that language. */
  tag: string;
  name: string;
  /** What its voices say, phrase by phrase. */
  words: Partial<Record<Phrase, string>>;
  voices: { id: VoiceId; name: string; play: Partial<Record<Phrase, string>> }[];
}

/**
 * Every voice saying the same recorded phrase in its own language: the clips screens play.
 * `heading` introduces the board where the section around it doesn't.
 */
export function VoiceBoard({
  heading,
  choose,
  phrases,
  languages,
}: {
  heading?: { title: string; text: string };
  /** The name of the choice of phrase. */
  choose: string;
  phrases: { id: Phrase; label: string }[];
  languages: VoiceBoardLanguage[];
}) {
  const id = useId();
  const [phrase, setPhrase] = useState<Phrase>(phrases[0].id);
  const [playing, setPlaying] = useState<string | null>(null);

  function play(voice: VoiceId) {
    const key = `${voice}:${phrase}`;
    const clip = recordedClip(recordedClipUrl(voice, phrase));
    setPlaying(key);
    const done = () => setPlaying((current) => (current === key ? null : current));
    // Browsers only allow audio from a click: unlock it now, the clip plays once downloaded.
    void unlockAudio().then(() => speak(clip, { volume: 0.9, delayMs: 0 }));
    clip.then((buffer) => setTimeout(done, buffer.duration * 1000 + 200), done);
  }

  return (
    <section
      aria-labelledby={heading ? `${id}-title` : undefined}
      aria-label={heading ? undefined : choose}
      className="reveal flex flex-col gap-7 rounded-3xl bg-(--surface) p-5 shadow-(--edge) sm:p-7"
    >
      <div className="flex flex-col gap-5">
        {heading && (
          <div className="max-w-md">
            <h3 id={`${id}-title`} className="text-[1.0625rem] font-medium">
              {heading.title}
            </h3>
            <p className="mt-1 text-sm text-pretty text-(--ink-3)">{heading.text}</p>
          </div>
        )}
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">{choose}</legend>
          {phrases.map((option) => (
            <label key={option.id} className="relative cursor-pointer">
              <input
                type="radio"
                name={`${id}-phrase`}
                value={option.id}
                checked={phrase === option.id}
                onChange={() => setPhrase(option.id)}
                className="peer sr-only"
              />
              <span className="flex min-h-9 items-center rounded-full px-3.5 text-sm text-(--ink-2) shadow-(--edge) transition-[background-color,box-shadow,color] duration-150 peer-checked:bg-(--glow)/10 peer-checked:text-(--ink) peer-checked:shadow-(--edge-glow) peer-focus-visible:ring-2 peer-focus-visible:ring-(--glow) hover:text-(--ink)">
                {option.label}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      <ul className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
        {languages.map((language) => (
          <li key={language.tag} className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-(--ink-2)">{language.name}</p>
              <q
                lang={language.tag}
                className="mt-0.5 block min-h-8 text-xs text-pretty text-(--ink-3)"
              >
                {language.words[phrase]}
              </q>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {language.voices.map((voice) => {
                const active = playing === `${voice.id}:${phrase}`;
                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => play(voice.id)}
                    aria-label={voice.play[phrase]}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 text-left text-sm text-(--ink-2) shadow-(--edge) transition-[background-color,box-shadow,color,scale] duration-150 outline-none hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.96]",
                      active && "bg-(--glow)/10 text-(--ink) shadow-(--edge-glow)",
                    )}
                  >
                    <PlayingIcon active={active} />
                    {voice.name}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
