import type { SoundPackRecipes } from "@/lib/sounds/packs";
import { noise, pitch, pulseWave, tone, type NoteName } from "@/lib/sounds/synth";

/** Pulse waves are harmonically rich: they sound loud at gains that would be quiet for a sine. */
const LEAD = 0.13;
const CUTOFF = 6000;
/** Console notes hold their level and stop quickly (a gate), instead of ringing like bells. */
const GATE = 0.03;

/** 8-bit console sounds, with an original little jingle for milestones. */
export const arcade: SoundPackRecipes = {
  payment(voice, at) {
    // A coin: two quick notes a fifth apart, the second one ringing out. Short notes need more
    // level than the others to sound as loud.
    const wave = pulseWave(voice.context, 0.25);
    const coin = { gain: 0.25, wave, cutoff: CUTOFF, space: 0.08 };
    tone(voice, { ...coin, at, frequency: pitch("C6"), duration: 0.08, release: GATE });
    tone(voice, { ...coin, at: at + 0.075, frequency: pitch("G6"), duration: 0.5, release: 0.35 });
  },

  customer(voice, at) {
    // A new player joins: three quick rising notes.
    const wave = pulseWave(voice.context, 0.5);
    (["E6", "G6", "E7"] as const).forEach((note, index) => {
      const last = index === 2;
      tone(voice, {
        at: at + index * 0.07,
        frequency: pitch(note),
        duration: last ? 0.3 : 0.07,
        release: last ? 0.2 : GATE,
        gain: LEAD * 0.8,
        wave,
        cutoff: CUTOFF,
        space: 0.08,
      });
    });
  },

  mrrUp(voice, at) {
    // A power-up: a fast climbing arpeggio, doubled an octave below.
    const lead = pulseWave(voice.context, 0.5);
    const notes: NoteName[] = ["C5", "E5", "G5", "C6", "E6", "G6", "C7"];
    notes.forEach((note, index) => {
      const last = index === notes.length - 1;
      const step = {
        at: at + index * 0.045,
        duration: last ? 0.4 : 0.07,
        release: last ? 0.3 : GATE,
      };
      tone(voice, {
        ...step,
        frequency: pitch(note),
        gain: LEAD * 0.7,
        wave: lead,
        cutoff: CUTOFF,
      });
      tone(voice, { ...step, frequency: pitch(note) / 2, gain: 0.16, wave: "triangle" });
    });
  },

  mrrDown(voice, at) {
    // A soft "womp", low and round.
    const womp = {
      at,
      frequency: pitch("G4"),
      glideTo: pitch("C4"),
      duration: 0.45,
      release: 0.25,
    };
    tone(voice, { ...womp, gain: 0.12, wave: "triangle" });
    tone(voice, { ...womp, gain: 0.014, wave: pulseWave(voice.context, 0.5), cutoff: 900 });
  },

  milestone(voice, at) {
    const lead = pulseWave(voice.context, 0.25);
    const melody: [number, number, NoteName][] = [
      [0, 0.1, "G5"],
      [0.1, 0.1, "C6"],
      [0.2, 0.1, "E6"],
      [0.3, 0.22, "G6"],
      [0.52, 0.1, "E6"],
      [0.62, 0.9, "G6"],
    ];
    for (const [offset, duration, note] of melody) {
      const held = duration > 0.5;
      tone(voice, {
        at: at + offset,
        frequency: pitch(note),
        duration: duration - 0.01,
        release: held ? 0.45 : GATE,
        gain: LEAD,
        wave: lead,
        cutoff: CUTOFF,
        vibrato: held ? 6 : undefined,
        space: 0.1,
      });
    }
    const bass: [number, number, NoteName][] = [
      [0, 0.28, "C4"],
      [0.3, 0.3, "G4"],
      [0.62, 0.9, "C5"],
    ];
    for (const [offset, duration, note] of bass) {
      tone(voice, {
        at: at + offset,
        frequency: pitch(note),
        duration,
        release: duration > 0.5 ? 0.45 : GATE,
        gain: 0.2,
        wave: "triangle",
      });
    }
    for (const offset of [0, 0.3, 0.62]) {
      noise(voice, {
        at: at + offset,
        duration: 0.035,
        gain: 0.06,
        filter: "highpass",
        frequency: 5000,
      });
    }
  },
};
