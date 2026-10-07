import type { AddResult } from "@/screens/actions";

/** Why a link didn't add a screen, in a sentence of the app. */
export function addErrorMessage(result: Exclude<AddResult, { kind: "added" | "locked" }>, host: string): string {
  switch (result.kind) {
    case "wrong-password":
      return "Wrong password. Try again.";
    case "too-many-attempts":
      return "Too many attempts. Wait a few minutes, then try again.";
    case "gone":
      return "This link no longer works: the screen was deleted, or its link regenerated. Open it again from your dashboard.";
    case "failed":
      return `${host} can’t be reached right now. Check your connection, or the address of your instance.`;
  }
}

export const NOT_A_SCREEN_LINK =
  "This isn’t a screen link. It looks like https://saas-monitor.com/d/…, from a screen’s “Open on your phone”.";

/** Why the demo screen didn't add: its instance is out of reach, or doesn't serve it (yet). */
export function demoErrorMessage(host: string): string {
  return `${host} can’t show its demo screen right now. Check your connection, then try again.`;
}
