import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  describeAccessError,
  redactSecrets,
  StripeAccessError,
  toStripeAccessError,
} from "./errors";

const { errors } = Stripe;

describe("Stripe errors", () => {
  it("classifies SDK errors by what the user can do about them", () => {
    const cases: [Error, string][] = [
      [
        new errors.StripeAuthenticationError({ message: "Invalid API Key", statusCode: 401 }),
        "authentication",
      ],
      [
        new errors.StripeInvalidRequestError({ message: "No such coupon", statusCode: 404 }),
        "not_found",
      ],
      [
        new errors.StripeRateLimitError({ message: "Too many requests", statusCode: 429 }),
        "rate_limited",
      ],
      [new errors.StripeConnectionError({ message: "ECONNRESET" }), "unavailable"],
      [new errors.StripeAPIError({ message: "Internal error", statusCode: 500 }), "unavailable"],
      [
        new errors.StripeInvalidRequestError({ message: "Invalid expand", statusCode: 400 }),
        "invalid_request",
      ],
    ];
    for (const [error, kind] of cases) {
      expect(toStripeAccessError(error)).toMatchObject({ kind });
    }
  });

  it("reads the missing permission and the account from a permission error", () => {
    const error = toStripeAccessError(
      new errors.StripePermissionError({
        statusCode: 403,
        message:
          "The provided key 'rk_live_*********4f2a' does not have the required permissions for this endpoint on account 'acct_1AbC23dEf'. Having the 'rak_coupon_read' permission would allow this request to continue.",
      }),
    );

    expect(error).toMatchObject({
      kind: "permission",
      permission: "rak_coupon_read",
      stripeAccountId: "acct_1AbC23dEf",
    });
    expect(describeAccessError(error as StripeAccessError)).toBe(
      "This Stripe key is missing the “Coupons (Read)” permission. Edit the key in the Stripe Dashboard to add it.",
    );
  });

  it("leaves other errors alone", () => {
    const bug = new TypeError("undefined is not a function");
    expect(toStripeAccessError(bug)).toBe(bug);
  });

  it("keeps secrets out of messages", () => {
    expect(redactSecrets("Invalid API Key provided: rk_live_51AbCdEf and whsec_abc123")).toBe(
      "Invalid API Key provided: rk_live_… and whsec_…",
    );
  });

  it("only retries what may succeed later", () => {
    expect(new StripeAccessError("rate_limited", "").isTransient).toBe(true);
    expect(new StripeAccessError("unavailable", "").isTransient).toBe(true);
    expect(new StripeAccessError("authentication", "").isTransient).toBe(false);
  });
});
