import type { z } from "zod";

/**
 * Outcome of a mutation, shared by services, server actions and the forms that render it.
 * Expected failures (invalid input, missing permission, record not found) are returned with a
 * message that can be shown as is; only unexpected failures throw.
 */
export type ActionResult<T extends object = object> = ({ ok: true } & T) | ActionFailure;

export interface ActionFailure {
  ok: false;
  error: string;
}

/** The first problem of invalid input, as a failure a form can show. */
export function invalidInput(error: z.ZodError): ActionFailure {
  return { ok: false, error: error.issues[0]?.message ?? "Some values are invalid." };
}
