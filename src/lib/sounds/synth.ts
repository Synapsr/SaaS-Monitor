/**
 * Small synthesis toolkit for the sound packs. Every sound is built from oscillators and filtered
 * noise shaped by short envelopes: a fast attack avoids clicks at the start, an exponential decay
 * to near silence avoids them at the end.
 */

/** Where a sound plays: its own output (dry) and a send to the shared reverb. */
export interface Voice {
  context: BaseAudioContext;
  output: AudioNode;
  reverb: AudioNode;
}

/** -80 dB: inaudible, but positive as exponential ramps require. */
const SILENCE = 0.0001;

const SEMITONES = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
} as const;

export type NoteName = `${keyof typeof SEMITONES}${2 | 3 | 4 | 5 | 6 | 7}`;

/** Frequency of a note in equal temperament, e.g. `pitch("A4")` is 440 Hz. */
export function pitch(name: NoteName): number {
  const octave = Number(name.slice(-1));
  const semitone = SEMITONES[name.slice(0, -1) as keyof typeof SEMITONES];
  return 440 * 2 ** ((12 * (octave + 1) + semitone - 69) / 12);
}

interface Placement {
  /** Stereo position, from -1 (left) to 1 (right). */
  pan?: number;
  /** Share of the signal sent to the reverb, from 0 to 1. */
  space?: number;
}

interface EnvelopeOptions {
  at: number;
  duration: number;
  gain: number;
  attack?: number;
  /**
   * Seconds of fade at the end. By default the whole note decays, like a struck bell; a short
   * release holds the note first, like the gated tones of old consoles.
   */
  release?: number;
}

/** Linear attack to `gain`, an optional hold, then an exponential fade to silence. */
function envelope(context: BaseAudioContext, options: EnvelopeOptions) {
  const { at, gain: peak, attack = 0.004 } = options;
  const end = at + Math.max(options.duration, attack + 0.01);
  const amplitude = context.createGain();
  amplitude.gain.setValueAtTime(0, at);
  amplitude.gain.linearRampToValueAtTime(peak, at + attack);
  if (options.release !== undefined && end - options.release > at + attack) {
    amplitude.gain.setValueAtTime(peak, end - options.release);
  }
  amplitude.gain.exponentialRampToValueAtTime(SILENCE, end);
  return amplitude;
}

function route(voice: Voice, node: AudioNode, { pan = 0, space = 0 }: Placement) {
  let output = node;
  if (pan !== 0 && "createStereoPanner" in voice.context) {
    const panner = voice.context.createStereoPanner();
    panner.pan.value = pan;
    output = node.connect(panner);
  }
  output.connect(voice.output);
  if (space > 0) {
    const send = voice.context.createGain();
    send.gain.value = space;
    output.connect(send).connect(voice.reverb);
  }
}

export interface ToneOptions extends Placement, EnvelopeOptions {
  frequency: number;
  wave?: OscillatorType | PeriodicWave;
  /** Frequency reached at the end of the tone, for sweeps. */
  glideTo?: number;
  /** Low-pass cutoff in Hz, to soften bright waveforms. */
  cutoff?: number;
  /** Pitch wobble for held notes: its depth in Hz, at 5.5 wobbles a second. */
  vibrato?: number;
}

// `PeriodicWave` is an empty interface to TypeScript: `typeof` alone cannot tell them apart.
function isBuiltInWave(wave: OscillatorType | PeriodicWave): wave is OscillatorType {
  return typeof wave === "string";
}

export function tone(voice: Voice, options: ToneOptions): void {
  const { context } = voice;
  const { at, frequency, duration, wave = "sine" } = options;
  const end = at + duration + 0.02;

  const oscillator = context.createOscillator();
  if (isBuiltInWave(wave)) oscillator.type = wave;
  else oscillator.setPeriodicWave(wave);
  oscillator.frequency.setValueAtTime(frequency, at);
  if (options.glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(options.glideTo, at + duration);
  }

  if (options.vibrato) {
    // Delayed vibrato, as on old consoles: the note settles before it starts to sing.
    const lfo = context.createOscillator();
    lfo.frequency.value = 5.5;
    const depth = context.createGain();
    depth.gain.value = options.vibrato;
    lfo.connect(depth).connect(oscillator.frequency);
    lfo.start(at + Math.min(0.15, duration / 3));
    lfo.stop(end);
  }

  let source: AudioNode = oscillator;
  if (options.cutoff) {
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = options.cutoff;
    source = oscillator.connect(filter);
  }
  route(voice, source.connect(envelope(context, options)), options);
  oscillator.start(at);
  oscillator.stop(end);
}

interface Overtone {
  ratio: number;
  gain: number;
  /** Share of the note's duration this partial rings for: high partials fade first. */
  decay: number;
}

/** A small bright bell: inharmonic partials give the metallic "ching". */
export const BELL: readonly Overtone[] = [
  { ratio: 1, gain: 1, decay: 1 },
  { ratio: 2.01, gain: 0.45, decay: 0.6 },
  { ratio: 2.76, gain: 0.32, decay: 0.45 },
  { ratio: 5.4, gain: 0.16, decay: 0.25 },
  { ratio: 8.93, gain: 0.07, decay: 0.15 },
];

/** A glassy, gentle bell: nearly harmonic, with a slow chorus from a detuned twin. */
export const SOFT_BELL: readonly Overtone[] = [
  { ratio: 1, gain: 1, decay: 1 },
  { ratio: 1.0017, gain: 0.45, decay: 0.9 },
  { ratio: 2, gain: 0.22, decay: 0.5 },
  { ratio: 3.01, gain: 0.07, decay: 0.3 },
];

/** A marimba bar: a warm fundamental and quickly fading overtones. */
export const MARIMBA: readonly Overtone[] = [
  { ratio: 1, gain: 1, decay: 1 },
  { ratio: 3.93, gain: 0.28, decay: 0.28 },
  { ratio: 9.8, gain: 0.07, decay: 0.12 },
];

/** Above this, partials add harshness on small speakers and nothing else. */
const MAX_PARTIAL_FREQUENCY = 12_000;

export function struck(
  voice: Voice,
  partials: readonly Overtone[],
  options: Omit<ToneOptions, "wave" | "glideTo" | "vibrato">,
): void {
  for (const partial of partials) {
    const frequency = options.frequency * partial.ratio;
    if (frequency > MAX_PARTIAL_FREQUENCY) continue;
    tone(voice, {
      ...options,
      frequency,
      gain: options.gain * partial.gain,
      duration: options.duration * partial.decay,
      attack: options.attack ?? 0.002,
    });
  }
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(context);
  if (!buffer) {
    buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
    noiseBuffers.set(context, buffer);
  }
  return buffer;
}

export interface NoiseOptions extends Placement, EnvelopeOptions {
  filter: BiquadFilterType;
  frequency: number;
  q?: number;
}

/** A burst of filtered noise: clicks, thuds, sizzles and hi-hats. */
export function noise(voice: Voice, options: NoiseOptions): void {
  const { context } = voice;
  const source = context.createBufferSource();
  source.buffer = noiseBuffer(context);
  const filter = context.createBiquadFilter();
  filter.type = options.filter;
  filter.frequency.value = options.frequency;
  filter.Q.value = options.q ?? 0.7;
  const shaped = envelope(context, { attack: 0.001, ...options });
  route(voice, source.connect(filter).connect(shaped), options);
  source.start(options.at);
  source.stop(options.at + options.duration + 0.02);
}

const pulseWaves = new WeakMap<BaseAudioContext, Map<number, PeriodicWave>>();

/**
 * A band-limited pulse wave, the voice of 8-bit consoles: `duty` 0.5 is a square, 0.25 and 0.125
 * the thinner, brighter tones of their melodies.
 */
export function pulseWave(context: BaseAudioContext, duty: number): PeriodicWave {
  let waves = pulseWaves.get(context);
  if (!waves) {
    waves = new Map();
    pulseWaves.set(context, waves);
  }
  let wave = waves.get(duty);
  if (!wave) {
    const harmonics = 40;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let harmonic = 1; harmonic < harmonics; harmonic += 1) {
      real[harmonic] = (2 / (harmonic * Math.PI)) * Math.sin(harmonic * Math.PI * duty);
    }
    wave = context.createPeriodicWave(real, imag);
    waves.set(duty, wave);
  }
  return wave;
}
