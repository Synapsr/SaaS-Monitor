"use client";

import { PlayIcon } from "lucide-react";
import { useState } from "react";
import { VoiceBoard } from "@/components/marketing/voice-board";
import { SOUND_EVENT_LABELS, SOUND_EVENTS } from "@/lib/marketing/sound-files";
import { SOUND_PACKS, type SoundPack } from "@/lib/screens/options";
import {
  playSound,
  SOUND_PACK_DESCRIPTIONS,
  SOUND_PACK_NAMES,
  type SoundEvent,
} from "@/lib/sounds";
import { cn } from "@/lib/utils";

/**
 * Every sound of every pack, one click away, then every voice. Sounds are synthesized in the
 * browser; voices are the recorded clips screens play.
 */
export function SoundBoard() {
  const [playing, setPlaying] = useState<string | null>(null);

  function play(pack: SoundPack, event: SoundEvent) {
    playSound(event, { pack, volume: 0.8 });
    const key = `${pack}:${event}`;
    setPlaying(key);
    setTimeout(() => setPlaying((current) => (current === key ? null : current)), 1200);
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-4 md:grid-cols-3">
        {SOUND_PACKS.map((pack) => (
          <li
            key={pack}
            className="flex flex-col gap-5 rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08]"
          >
            <div>
              <h3 className="font-medium text-(--ink)">{SOUND_PACK_NAMES[pack]}</h3>
              <p className="mt-1 text-sm text-(--ink-3)">{SOUND_PACK_DESCRIPTIONS[pack]}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SOUND_EVENTS.map((event) => {
                const label = SOUND_EVENT_LABELS[event];
                const active = playing === `${pack}:${event}`;
                return (
                  <button
                    key={event}
                    type="button"
                    onClick={() => play(pack, event)}
                    aria-label={`Play the ${label} sound of the ${SOUND_PACK_NAMES[pack]} pack`}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-(--ink-2) ring-1 ring-white/10 transition-colors outline-none hover:bg-white/[0.06] hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)",
                      // The fanfare gets the last row to itself.
                      event === "milestone" && "col-span-2",
                      active && "bg-(--glow)/10 text-(--ink) ring-(--glow)/50",
                    )}
                  >
                    <PlayIcon
                      aria-hidden
                      className={cn("size-3.5 fill-current", active && "text-(--glow)")}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <VoiceBoard
        heading={{
          title: "Voices",
          description:
            "After the sound, a voice says what happened, in the screen’s language. Two voices per language.",
        }}
      />
    </div>
  );
}
