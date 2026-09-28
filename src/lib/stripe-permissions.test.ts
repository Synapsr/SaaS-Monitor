import { describe, expect, it } from "vitest";
import {
  permissionLabel,
  restrictedKeyCreationUrl,
  STRIPE_KEY_PERMISSIONS,
} from "./stripe-permissions";

describe("Stripe key permissions", () => {
  it("names permissions like the Stripe Dashboard", () => {
    expect(permissionLabel("rak_charge_read")).toBe("Charges and Refunds (Read)");
    expect(permissionLabel("rak_webhook_write")).toBe("Webhook Endpoints (Write)");
    expect(permissionLabel("rak_unknown_read")).toBe("rak_unknown_read");
  });

  it("opens the restricted key form with every permission selected", () => {
    const url = new URL(restrictedKeyCreationUrl("SaaS Monitor"));
    expect(url.searchParams.get("name")).toBe("SaaS Monitor");
    expect(
      STRIPE_KEY_PERMISSIONS.map((_, index) => url.searchParams.get(`permissions[${index}]`)),
    ).toEqual(STRIPE_KEY_PERMISSIONS.map((permission) => permission.id));
  });
});
