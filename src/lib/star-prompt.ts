/**
 * Self-hosted instances ask their team, once in a while, to star the project on GitHub. Each
 * browser keeps its answer: starred or "don't ask again" for good, "maybe later" for a day.
 */

export const STAR_PROMPT_KEY = "saas-monitor:star-prompt";

/** How long "maybe later" waits before asking again. */
export const LATER_MS = 24 * 60 * 60 * 1000;

export type StarAnswer =
  | { answer: "starred" | "never" }
  /** Asked again from `until`, a timestamp in milliseconds. */
  | { answer: "later"; until: number };

/** Reads a stored answer; anything else, from another version or hand-edited, is no answer. */
export function parseStarAnswer(stored: string | null): StarAnswer | null {
  try {
    const value: unknown = JSON.parse(stored ?? "null");
    if (typeof value !== "object" || value === null || !("answer" in value)) return null;
    const { answer } = value as { answer: unknown };
    if (answer === "starred" || answer === "never") return { answer };
    if (answer === "later" && "until" in value && typeof value.until === "number") {
      return { answer, until: value.until };
    }
    return null;
  } catch {
    return null;
  }
}

/** Whether to ask now, given the browser's last answer. */
export function starPromptDue(answer: StarAnswer | null, now: number): boolean {
  if (answer === null) return true;
  return answer.answer === "later" && answer.until <= now;
}
