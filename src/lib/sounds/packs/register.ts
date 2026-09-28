import type { SoundPackRecipes } from "@/lib/sounds/packs";
import { BELL, noise, pitch, struck, tone, type NoteName, type Voice } from "@/lib/sounds/synth";

/** The mechanical "ka": a key strike, the drawer bumping open and a short rattle. */
function drawer(voice: Voice, at: number, level = 1) {
  noise(voice, {
    at,
    duration: 0.05,
    gain: 0.5 * level,
    filter: "bandpass",
    frequency: 3200,
    q: 0.9,
  });
  noise(voice, {
    at: at + 0.012,
    duration: 0.1,
    gain: 0.4 * level,
    filter: "lowpass",
    frequency: 900,
  });
  tone(voice, {
    at,
    frequency: 180,
    glideTo: 70,
    duration: 0.14,
    gain: 0.5 * level,
    attack: 0.002,
  });
  noise(voice, {
    at: at + 0.035,
    duration: 0.035,
    gain: 0.16 * level,
    filter: "bandpass",
    frequency: 5200,
    q: 2,
  });
}

/** The "ching": two small bells struck together, slightly detuned, like a till's bell. */
function tillBell(voice: Voice, at: number, level = 1) {
  struck(voice, BELL, {
    at,
    frequency: pitch("C7"),
    duration: 1.3,
    gain: 0.3 * level,
    pan: -0.15,
    space: 0.25,
  });
  struck(voice, BELL, {
    at: at + 0.012,
    frequency: pitch("E7") * 1.003,
    duration: 1,
    gain: 0.17 * level,
    pan: 0.15,
    space: 0.25,
  });
  noise(voice, { at, duration: 0.22, gain: 0.05 * level, filter: "highpass", frequency: 7000 });
}

/** A coin landing on a pile: a tiny click and a short metallic ring. */
function coin(voice: Voice, at: number, note: NoteName, ring: number, level: number, pan = 0) {
  noise(voice, {
    at,
    duration: 0.02,
    gain: 0.1 * level,
    filter: "bandpass",
    frequency: 6000,
    q: 3,
  });
  struck(voice, BELL, {
    at,
    frequency: pitch(note),
    duration: ring,
    gain: 0.2 * level,
    pan,
    space: 0.2,
  });
}

/** Cash register: the unmistakable sound of money coming in. */
export const register: SoundPackRecipes = {
  payment(voice, at) {
    drawer(voice, at);
    tillBell(voice, at + 0.085);
  },

  mrrUp(voice, at) {
    coin(voice, at, "A6", 0.35, 1.3, -0.25);
    coin(voice, at + 0.075, "C#7", 0.35, 1.3);
    coin(voice, at + 0.15, "E7", 0.9, 1.45, 0.25);
  },

  mrrDown(voice, at) {
    // The drawer closing, then two muted, falling notes: honest, never alarming.
    noise(voice, { at, duration: 0.12, gain: 0.38, filter: "lowpass", frequency: 500 });
    tone(voice, { at, frequency: 140, glideTo: 60, duration: 0.16, gain: 0.44, attack: 0.003 });
    struck(voice, BELL.slice(0, 2), {
      at: at + 0.07,
      frequency: pitch("E6"),
      duration: 0.5,
      gain: 0.15,
      space: 0.3,
    });
    struck(voice, BELL.slice(0, 2), {
      at: at + 0.24,
      frequency: pitch("C6"),
      duration: 0.8,
      gain: 0.13,
      space: 0.3,
    });
  },

  milestone(voice, at) {
    drawer(voice, at);
    tillBell(voice, at + 0.085);
    (["C6", "E6", "G6", "C7"] as const).forEach((note, index) => {
      struck(voice, BELL, {
        at: at + 0.35 + index * 0.09,
        frequency: pitch(note),
        duration: 1.6,
        gain: 0.15,
        pan: -0.3 + index * 0.2,
        space: 0.3,
      });
    });
    for (const note of ["C6", "E6", "G6"] as const) {
      tone(voice, {
        at: at + 0.75,
        frequency: pitch(note),
        duration: 2.4,
        gain: 0.06,
        attack: 0.04,
        space: 0.4,
      });
    }
    // A shower of coins, on a fixed pattern so the milestone always sounds the same.
    const shower: [number, NoteName][] = [
      [0.48, "G6"],
      [0.62, "E7"],
      [0.74, "C7"],
      [0.9, "A6"],
      [1.02, "E7"],
      [1.2, "G6"],
      [1.38, "C7"],
    ];
    shower.forEach(([offset, note], index) => {
      coin(voice, at + offset, note, 0.4, 0.45, index % 2 === 0 ? -0.4 : 0.4);
    });
  },
};
