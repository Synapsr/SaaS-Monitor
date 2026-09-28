"use client";

import { PlayIcon } from "lucide-react";
import { useState } from "react";
import { SOUND_PACKS, type SoundPack } from "@/lib/screens/settings";
import { playSound, SOUND_PACK_NAMES, type SoundEvent } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const PACK_DESCRIPTIONS: Record<SoundPack, string> = {
  register: "The classic ka-ching.",
  chime: "Soft bells for a calm office.",
  arcade: "8-bit coins and power-ups.",
};

const EVENTS: { id: SoundEvent; label: string }[] = [
  { id: "payment", label: "Payment" },
  { id: "mrrUp", label: "MRR up" },
  { id: "mrrDown", label: "MRR down" },
  { id: "milestone", label: "Milestone" },
];

/** Every sound of every pack, one click away. Sounds are synthesized in the browser. */
export function SoundBoard() {
  const [playing, setPlaying] = useState<string | null>(null);

  function play(pack: SoundPack, event: SoundEvent) {
    playSound(event, { pack, volume: 0.8 });
    const key = `${pack}:${event}`;
    setPlaying(key);
    setTimeout(() => setPlaying((current) => (current === key ? null : current)), 1200);
  }

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {SOUND_PACKS.map((pack) => (
        <li
          key={pack}
          className="flex flex-col gap-5 rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08]"
        >
          <div>
            <h3 className="font-medium text-(--ink)">{SOUND_PACK_NAMES[pack]}</h3>
            <p className="mt-1 text-sm text-(--ink-3)">{PACK_DESCRIPTIONS[pack]}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {EVENTS.map((event) => {
              const active = playing === `${pack}:${event.id}`;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => play(pack, event.id)}
                  aria-label={`Play the ${event.label} sound of the ${SOUND_PACK_NAMES[pack]} pack`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-(--ink-2) ring-1 ring-white/10 transition-colors outline-none hover:bg-white/[0.06] hover:text-(--ink) focus-visible:ring-2 focus-visible:ring-(--glow)",
                    active && "bg-(--glow)/10 text-(--ink) ring-(--glow)/50",
                  )}
                >
                  <PlayIcon
                    aria-hidden
                    className={cn("size-3.5 fill-current", active && "text-(--glow)")}
                  />
                  {event.label}
                </button>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
