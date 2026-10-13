import { announcementSource, recordedSpeechSource, soundSource, type ClipSource } from "@/audio/clips";
import { MAX_SOUND_DELAY_MS, MAX_SPEECH_LATENESS_MS, speechSlot } from "@/contract/display/audio-timing";
import type { MomentAudio } from "@/contract/display/moment-audio";
import type { ScreenAccess } from "@/screens/api";

/** A clip ready to play: downloaded, decoded enough to know its length. */
export interface Clip {
  /** In seconds. */
  duration: number;
  /** `volume` from 0 to 1. */
  play(volume: number): void;
  /** Stops it if it plays, and frees it. */
  release(): void;
}

export interface ClipLoader {
  load(source: ClipSource): Promise<Clip>;
}

/** A clip is freed this long after it should have ended. */
const RELEASE_MARGIN_MS = 500;

/**
 * Plays the moments of a screen as its wall display does (`announceMoment` and `playSound` on the
 * web): the sound at once, or not at all if it can't start in time; then the voice, once the sound
 * has rung, after the phrase being said. The screen's own words come from its server, its recorded
 * phrase when they can't. `stop` silences everything, and drops what was still loading.
 */
export class MomentAudioPlayer {
  /** Bumped by `stop`: clips loaded for an earlier generation are dropped. */
  private generation = 0;
  /** When, in seconds of `now`, the phrase being said ends. */
  private busyUntil = 0;
  private readonly clips = new Set<Clip>();
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private readonly access: ScreenAccess,
    private readonly loader: ClipLoader,
    private readonly now: () => number = Date.now,
  ) {}

  play(audio: MomentAudio): void {
    const generation = this.generation;
    const requestedAt = this.now();
    const current = () => generation === this.generation;

    const { sound, voice } = audio;
    if (sound) {
      this.loader.load(soundSource(this.access, sound)).then((clip) => {
        // A late "ka-ching" would lie.
        if (!current() || this.now() - requestedAt > MAX_SOUND_DELAY_MS) return clip.release();
        this.start(clip, sound.volume, 0);
      }, ignore);
    }

    if (voice) {
      const recorded = () => this.loader.load(recordedSpeechSource(this.access, voice));
      const own = announcementSource(this.access, voice);
      const speech = own ? this.loader.load(own).catch(recorded) : recorded();
      speech.then((clip) => {
        const elapsedMs = this.now() - requestedAt;
        if (!current() || elapsedMs > MAX_SPEECH_LATENESS_MS) return clip.release();
        const now = this.now() / 1000;
        const slot = speechSlot({
          now,
          elapsedMs,
          delayMs: voice.delayMs,
          busyUntil: this.busyUntil,
          duration: clip.duration,
        });
        if (!slot) return clip.release();
        this.busyUntil = slot.busyUntil;
        this.start(clip, voice.volume, (slot.start - now) * 1000);
      }, ignore);
    }
  }

  /** Silences what plays, and what was about to. */
  stop(): void {
    this.generation += 1;
    this.busyUntil = 0;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const clip of this.clips) clip.release();
    this.clips.clear();
  }

  private start(clip: Clip, volume: number, delayMs: number): void {
    this.clips.add(clip);
    this.after(delayMs, () => {
      // Squared, like on the wall: the slider then feels even to the ear.
      clip.play(volume ** 2);
      this.after(clip.duration * 1000 + RELEASE_MARGIN_MS, () => {
        this.clips.delete(clip);
        clip.release();
      });
    });
  }

  private after(delayMs: number, task: () => void): void {
    if (delayMs <= 0) return task();
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      task();
    }, delayMs);
    this.timers.add(timer);
  }
}

function ignore(): void {
  // Audio is a bonus: a clip that can't load leaves the moment its card and haptic.
}
