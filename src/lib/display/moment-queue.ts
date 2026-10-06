import type { Moment } from "@/lib/display/moments";

/** A breath between two moments, so they never overlap or blur into one. */
const GAP_MS = 700;
/** More would lag minutes behind reality: the summary of a burst already covers big batches. */
const MAX_PENDING = 6;

/**
 * Plays moments one at a time, each for its own duration. A plain store (`subscribe` and
 * snapshots) read with `useSyncExternalStore`, so timers never depend on React renders. Timers
 * only run while someone is subscribed: an unmounted display leaves nothing behind.
 */
export class MomentQueue {
  private pending: Moment[] = [];
  private current: Moment | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<() => void>();

  /** `durationOf` says how long a moment lasts, knowing how many others wait behind it. */
  constructor(private durationOf: (moment: Moment, waiting: number) => number) {}

  /** The screen's settings changed: they apply from the next moment. */
  setDurationOf(durationOf: (moment: Moment, waiting: number) => number): void {
    this.durationOf = durationOf;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.resume();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.pause();
    };
  };

  /** The moment on screen, if any. */
  getCurrent = (): Moment | null => this.current;

  /** Nothing on screen and nothing waiting: a good time to reload, for instance. */
  isIdle = (): boolean => this.current === null && this.pending.length === 0;

  enqueue(moments: readonly Moment[]): void {
    if (moments.length === 0) return;
    this.pending.push(...moments);
    // Keep milestones, drop the oldest of the rest.
    while (this.pending.length > MAX_PENDING) {
      const index = this.pending.findIndex((moment) => moment.kind !== "milestone");
      this.pending.splice(index === -1 ? 0 : index, 1);
    }
    if (this.current === null && this.timer === undefined && this.listeners.size > 0) {
      this.advance();
    } else {
      this.notify();
    }
  }

  /**
   * Ends the moment on screen now, e.g. when it is tapped: the next one follows after the usual
   * breath, so several waiting moments can be gone through quickly.
   */
  skip(): void {
    if (this.current === null) return;
    clearTimeout(this.timer);
    this.finish();
  }

  private advance = () => {
    this.timer = undefined;
    this.current = this.pending.shift() ?? null;
    if (this.current !== null) {
      this.timer = setTimeout(this.finish, this.durationOf(this.current, this.pending.length));
    }
    this.notify();
  };

  private finish = () => {
    this.current = null;
    this.timer = this.pending.length > 0 ? setTimeout(this.advance, GAP_MS) : undefined;
    this.notify();
  };

  private pause() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private resume() {
    if (this.current !== null) {
      this.timer = setTimeout(this.finish, this.durationOf(this.current, this.pending.length));
    } else if (this.pending.length > 0) {
      this.advance();
    }
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }
}
