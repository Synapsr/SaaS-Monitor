import { describe, expect, it } from "vitest";
import { revenueCatPermissionLabel } from "@/lib/revenuecat-permissions";
import {
  describeRevenueCatAccessError,
  redactRevenueCatSecrets,
  RevenueCatAccessError,
} from "./errors";

describe("redactRevenueCatSecrets", () => {
  it("masks RevenueCat secret keys in error text", () => {
    expect(redactRevenueCatSecrets("Invalid key sk_AbCdEfGh1234567890 received")).toBe(
      "Invalid key sk_… received",
    );
  });
});

describe("RevenueCatAccessError", () => {
  it("marks rate_limited and unavailable errors as transient", () => {
    expect(new RevenueCatAccessError("rate_limited", "Too many requests").isTransient).toBe(true);
    expect(new RevenueCatAccessError("unavailable", "Timeout").isTransient).toBe(true);
    expect(new RevenueCatAccessError("authentication", "Unauthorized").isTransient).toBe(false);
    expect(new RevenueCatAccessError("permission", "Forbidden").isTransient).toBe(false);
  });

  it("describes missing permissions using dashboard labels", () => {
    const error = new RevenueCatAccessError("permission", "Forbidden", {
      permission: "charts_metrics:charts:read",
    });
    expect(describeRevenueCatAccessError(error)).toContain(
      revenueCatPermissionLabel("charts_metrics:charts:read"),
    );
  });
});
