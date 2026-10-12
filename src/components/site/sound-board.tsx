"use client";

import { DownloadIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SoundPack } from "@/lib/screens/options";
import { playSound, type SoundEvent } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface SoundBoardPack {
  id: SoundPack;
  name: string;
  description: string;
  sounds: {
    event: SoundEvent;
    label: string;
    /** What a screen reader says the button does. */
    play: string;
    /** The rendered file, where the page offers it. */
    file?: { url: string; name: string; label: string };
  }[];
}

/**
 * Every sound of every pack, one tap away, synthesized as screens do. With `file`, each also
 * downloads as the WAV rendered from it.
 */
export function SoundBoard({ packs }: { packs: SoundBoardPack[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function play(pack: SoundPack, event: SoundEvent) {
    playSound(event, { pack, volume: 0.8 });
    const key = `${pack}:${event}`;
    setPlaying(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(null), 1400);
  }

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {packs.map((pack) => (
        <li
          key={pack.id}
          className="reveal flex flex-col gap-6 rounded-3xl bg-(--surface) p-5 shadow-(--edge) sm:p-6"
        >
          <div>
            <h3 className="text-[1.0625rem] font-medium">{pack.name}</h3>
            <p className="mt-1 text-sm text-pretty text-(--ink-3)">{pack.description}</p>
          </div>
          {/* Pads flow and stretch to fill their rows, whatever the length of their names. */}
          <ul
            className={cn(
              "flex gap-2",
              pack.sounds.some(({ file }) => file) ? "flex-col" : "flex-wrap",
            )}
          >
            {pack.sounds.map((sound) => {
              const active = playing === `${pack.id}:${sound.event}`;
              return (
                <li key={sound.event} className="flex flex-auto gap-2">
                  <button
                    type="button"
                    onClick={() => play(pack.id, sound.event)}
                    aria-label={sound.play}
                    className={cn(
                      "flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 text-left text-sm whitespace-nowrap text-(--ink-2) shadow-(--edge) transition-[background-color,box-shadow,color,scale] duration-150 outline-none hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.96]",
                      active && "bg-(--glow)/10 text-(--ink) shadow-(--edge-glow)",
                    )}
                  >
                    <PlayingIcon active={active} />
                    {sound.label}
                  </button>
                  {sound.file && (
                    <a
                      href={sound.file.url}
                      download={sound.file.name}
                      aria-label={sound.file.label}
                      className="flex min-h-11 items-center gap-1.5 rounded-xl px-3.5 text-xs text-(--ink-3) shadow-(--edge) transition-[background-color,color,scale] duration-150 outline-none hover:bg-(--surface-raised) hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.96]"
                    >
                      <DownloadIcon aria-hidden className="size-3.5" />
                      WAV
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** A play triangle, or the bars of a sound playing: crossfaded, never swapped abruptly. */
export function PlayingIcon({ active }: { active: boolean }) {
  return (
    <span aria-hidden className="relative flex size-3.5 shrink-0 items-center justify-center">
      <PlayIcon
        className={cn(
          "ease-out-soft absolute ml-px size-3.5 fill-current transition-[opacity,filter,scale] duration-300",
          active ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-[0px]",
        )}
      />
      <span
        className={cn(
          "ease-out-soft absolute flex h-3.5 items-end gap-[2px] transition-[opacity,filter,scale] duration-300",
          active ? "scale-100 opacity-100 blur-[0px]" : "scale-25 opacity-0 blur-[4px]",
        )}
      >
        {[0, 1, 2].map((bar) => (
          <span
            key={bar}
            className="h-full w-[3px] origin-bottom rounded-full bg-(--glow)"
            style={{
              animation: active ? `equalizer 0.9s ease-in-out ${bar * 0.15}s infinite` : "none",
            }}
          />
        ))}
      </span>
    </span>
  );
}
