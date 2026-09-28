/**
 * Outcome of a mutation, shared by services, server actions and the forms that render it.
 * Expected failures (invalid input, missing permission, record not found) are returned with a
 * message that can be shown as is; only unexpected failures throw.
 */
export type ActionResult<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: string };
