import { z } from "zod";

/** Longest name of a workspace, a screen or a Stripe account: it must fit menus and TVs. */
export const NAME_MAX_LENGTH = 60;

/** A name typed by hand, trimmed. `missing` says what to enter when it is empty. */
export function nameSchema(missing: string) {
  return z
    .string()
    .trim()
    .min(1, missing)
    .max(NAME_MAX_LENGTH, `Use at most ${NAME_MAX_LENGTH} characters.`);
}

/** Longest name of a person, on their profile. */
export const PERSON_NAME_MAX_LENGTH = 100;

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(PERSON_NAME_MAX_LENGTH, `Use at most ${PERSON_NAME_MAX_LENGTH} characters.`);
