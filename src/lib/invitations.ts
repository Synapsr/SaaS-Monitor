/*
 * Invitations are shared as links (no email is sent): `/invite/<id>` opens one, and signing up or
 * in from it comes back to it with `?next=/invite/<id>`.
 */

export function invitationPath(invitationId: string): string {
  return `/invite/${encodeURIComponent(invitationId)}`;
}

/** The invitation a local path opens, or `null` for any other path, including a malformed one. */
export function invitationIdFromPath(path: string): string | null {
  const encoded = /^\/invite\/([^/?#]+)$/.exec(path)?.[1];
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    // A broken escape such as `%E0%A4%A`: no link of the app looks like this.
    return null;
  }
}
