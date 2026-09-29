import { describe, expect, it } from "vitest";
import { clientAddress, createRateLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("allows a number of attempts per key and window", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1_000 });
    expect(limiter.consume("a", 0)).toBe(true);
    expect(limiter.consume("a", 10)).toBe(true);
    expect(limiter.consume("a", 20)).toBe(false);
    expect(limiter.consume("b", 20)).toBe(true);
    expect(limiter.consume("a", 1_000)).toBe(true);
  });
});

describe("client address", () => {
  it("is the first address the proxy forwards, or the real IP header", () => {
    expect(clientAddress(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
    expect(clientAddress(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientAddress(new Headers())).toBe("unknown");
  });
});
