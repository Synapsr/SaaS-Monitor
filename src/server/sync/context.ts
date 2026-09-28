import "server-only";
import type { StripeGateway } from "@/server/stripe/gateway";
import type { UnixTime } from "@/server/stripe/types";
import type { StripeAccountRow } from "./lease";

/** What each step of a sync works with. */
export interface SyncContext {
  /** The account as it was when the lease was acquired. */
  account: StripeAccountRow;
  gateway: StripeGateway;
  /** Start of the sync, used as "now" throughout so that timestamps are consistent. */
  now: Date;
  /** Scans stop taking new pages after this time (milliseconds since the epoch). */
  deadline: number;
}

export const DAY_SECONDS = 24 * 60 * 60;

export function toUnixTime(date: Date): UnixTime {
  return Math.floor(date.getTime() / 1000);
}
