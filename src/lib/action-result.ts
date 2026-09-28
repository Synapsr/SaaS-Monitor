import type { z } from "zod";

/**
 * Outcome of a mutation, shared by services, server actions and the forms that render it.
 * Expected failures (invalid input, missing permission, record not found) are returned with a
 * message that can be shown as is, and details (`F`) when a form needs more; only unexpected
 * failures throw.
 */
export type ActionResult<T extends object = object, F extends object = object> =
  ({ ok: true } & T) | (ActionFailure & F);

export interface ActionFailure {
  ok: false;
  error: string;
}

/** The first problem of invalid input, as a failure a form can show. */
export function invalidInput(error: z.ZodError): ActionFailure {
  return { ok: false, error: error.issues[0]?.message ?? "Some values are invalid." };
}
