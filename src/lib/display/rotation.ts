import type { DisplayAccount, DisplayMetrics, DisplayState, FeedItem } from "@/lib/display/types";

/*
 * A screen showing several Stripe accounts may rotate between them (`settings.rotation`): each
 * account takes its turn on screen with its own numbers, and so may their total. Each turn is a
 * slide, named after its account's id, or `TOTAL`.
 */

/** The slide of the combined numbers. Account ids are UUIDs: never this. */
export const TOTAL = "total";

/**
 * The slides of a screen, in order. A screen that does not rotate, or has a single ready account,
 * only has the total.
 */
export function rotationSlides(state: DisplayState): string[] {
  const { rotation } = state.screen.settings;
  if (!rotation.enabled || state.status !== "ready" || state.views.length === 0) return [TOTAL];
  const accounts = state.views.map((view) => view.accountId);
  return rotation.includeTotal ? [TOTAL, ...accounts] : accounts;
}

/** The slide after `current`, back to the first after the last. */
export function nextSlide(slides: readonly string[], current: string): string {
  const index = slides.indexOf(current);
  return slides[(index + 1) % slides.length];
}

/** What a slide shows. */
export interface ScreenView {
  /** The account on screen; `null` for the total. */
  account: DisplayAccount | null;
  metrics: DisplayMetrics;
  series: DisplayState["series"];
  /** The account's activity only, or everyone's for the total. */
  feed: FeedItem[];
  /** In major units. The screen's goal is the total's: accounts chase their milestones. */
  goal: number | null;
}

/** The numbers and activity of a slide, falling back to the total for a slide that is gone. */
export function screenView(state: DisplayState, slide: string): ScreenView {
  const view = state.views.find(({ accountId }) => accountId === slide);
  const account = view && state.accounts.find(({ id }) => id === view.accountId);
  if (!view || !account) {
    return {
      account: null,
      metrics: state.metrics,
      series: state.series,
      feed: state.feed,
      goal: state.screen.settings.goal,
    };
  }
  return {
    account,
    metrics: view.metrics,
    series: view.series,
    feed: state.feed.filter((item) => item.accountId === account.id),
    goal: null,
  };
}
