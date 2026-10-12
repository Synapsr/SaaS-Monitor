"use client";

import { DownloadIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SOUND_EVENT_LABELS, SOUND_EVENTS, soundFile } from "@/lib/marketing/sound-files";
import { SOUND_PACKS, type SoundPack } from "@/lib/screens/settings";
import {
  playSound,
  SOUND_PACK_DESCRIPTIONS,
  SOUND_PACK_NAMES,
  type SoundEvent,
} from "@/lib/sounds";
import { cn } from "@/lib/utils";

/**
 * Every sound of every pack: played live by the synthesizer screens use, and downloadable as the
 * WAV rendered from it.
 */
export function SoundLibrary() {
  const [playing, setPlaying] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function play(pack: SoundPack, event: SoundEvent) {
    playSound(event, { pack, volume: 0.8 });
    const key = `${pack}:${event}`;
    setPlaying(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(null), 1200);
  }

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {SOUND_PACKS.map((pack) => (
        <li
          key={pack}
          className="flex flex-col gap-5 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.08] sm:p-6"
        >
          <div>
            <h3 className="font-medium">{SOUND_PACK_NAMES[pack]}</h3>
            <p className="mt-1 text-sm text-(--ink-3)">{SOUND_PACK_DESCRIPTIONS[pack]}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {SOUND_EVENTS.map((event) => {
              const file = soundFile(pack, event);
              const label = SOUND_EVENT_LABELS[event];
              const active = playing === `${pack}:${event}`;
              return (
                <li key={event} className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => play(pack, event)}
                    aria-label={`Play the ${label} sound of the ${SOUND_PACK_NAMES[pack]} pack`}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-(--ink-2) ring-1 ring-white/10 transition-colors outline-none hover:bg-white/[0.06] hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)",
                      active && "bg-(--glow)/10 text-(--ink) ring-(--glow)/50",
                    )}
                  >
                    <PlayIcon
                      aria-hidden
                      className={cn("size-3.5 fill-current", active && "text-(--glow)")}
                    />
                    {label}
                  </button>
                  <a
                    href={file.url}
                    download={file.fileName}
                    aria-label={`Download the ${label} sound of the ${SOUND_PACK_NAMES[pack]} pack, as WAV`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-(--ink-3) ring-1 ring-white/10 transition-colors outline-none hover:bg-white/[0.06] hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)"
                  >
                    <DownloadIcon aria-hidden className="size-3.5" />
                    WAV
                  </a>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
