import "server-only";

/**
 * Counts attempts per key in fixed windows, in the memory of this server: enough to stop someone
 * guessing a screen password, which hashing already slows down. Sign-in has Better Auth's own.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { count: number; endsAt: number }>();

  return {
    /** Records an attempt; `false` when the key has used up its attempts for now. */
    consume(key: string, now = Date.now()): boolean {
      for (const [stale, window] of windows) {
        if (window.endsAt <= now) windows.delete(stale);
      }
      const window = windows.get(key) ?? { count: 0, endsAt: now + windowMs };
      window.count += 1;
      windows.set(key, window);
      return window.count <= limit;
    },
  };
}

/**
 * The client's address, as the reverse proxy reports it (see the self-hosting guide: only the
 * proxy should reach the app). Requests without one share a key.
 */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
