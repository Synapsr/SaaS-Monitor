import type { SoundPackRecipes } from "@/lib/sounds/packs";
import { MARIMBA, pitch, SOFT_BELL, struck, tone, type NoteName } from "@/lib/sounds/synth";

/** Soft bells and marimba: pleasant enough to hear all day in an open space. */
export const chime: SoundPackRecipes = {
  payment(voice, at) {
    // A bright rising fifth: "ding-ding".
    struck(voice, SOFT_BELL, {
      at,
      frequency: pitch("E6"),
      duration: 1.4,
      gain: 0.28,
      pan: -0.1,
      space: 0.35,
    });
    struck(voice, SOFT_BELL, {
      at: at + 0.12,
      frequency: pitch("B6"),
      duration: 1.7,
      gain: 0.23,
      pan: 0.1,
      space: 0.35,
    });
  },

  customer(voice, at) {
    // A friendly "hello": a rising third on the marimba.
    struck(voice, MARIMBA, { at, frequency: pitch("C6"), duration: 0.8, gain: 0.2, space: 0.3 });
    struck(voice, MARIMBA, {
      at: at + 0.14,
      frequency: pitch("E6"),
      duration: 1.1,
      gain: 0.2,
      pan: 0.1,
      space: 0.3,
    });
  },

  mrrUp(voice, at) {
    (["G5", "B5", "D6", "G6"] as const).forEach((note, index) => {
      struck(voice, MARIMBA, {
        at: at + index * 0.085,
        frequency: pitch(note),
        duration: 0.9 + index * 0.15,
        gain: 0.22,
        pan: -0.25 + index * 0.17,
        space: 0.3,
      });
    });
  },

  mrrDown(voice, at) {
    // A gentle falling fourth, quieter than good news.
    struck(voice, SOFT_BELL, { at, frequency: pitch("D6"), duration: 1, gain: 0.1, space: 0.35 });
    struck(voice, SOFT_BELL, {
      at: at + 0.18,
      frequency: pitch("A5"),
      duration: 1.3,
      gain: 0.09,
      space: 0.35,
    });
  },

  milestone(voice, at) {
    const arpeggio: NoteName[] = ["C5", "E5", "G5", "C6", "E6", "G6"];
    arpeggio.forEach((note, index) => {
      struck(voice, MARIMBA, {
        at: at + index * 0.075,
        frequency: pitch(note),
        duration: 1.4,
        gain: 0.2,
        pan: -0.4 + index * 0.16,
        space: 0.4,
      });
    });
    // Then a warm chord (C major add 9) swells under a last sparkle.
    for (const note of ["C4", "C5", "E5", "G5", "D6"] as const) {
      tone(voice, {
        at: at + 0.45,
        frequency: pitch(note),
        duration: 2.8,
        gain: note === "C4" ? 0.12 : 0.065,
        attack: 0.06,
        space: 0.45,
      });
    }
    struck(voice, SOFT_BELL, {
      at: at + 0.55,
      frequency: pitch("C7"),
      duration: 1.8,
      gain: 0.08,
      space: 0.5,
    });
  },
};
