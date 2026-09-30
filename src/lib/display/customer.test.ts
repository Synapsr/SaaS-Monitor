import { describe, expect, it } from "vitest";
import { feedItem } from "@/test/display";
import { customerLabel, maskEmail, shownEmail } from "./customer";

describe("customer emails", () => {
  it("are masked to their first letter and domain", () => {
    expect(maskEmail("justine.cochet@gmail.com")).toBe("j•••@gmail.com");
    expect(maskEmail("é@exemple.fr")).toBe("é•••@exemple.fr");
    expect(maskEmail("not-an-email")).toBeNull();
    expect(maskEmail("@example.com")).toBeNull();
  });

  it("show as a screen's settings say", () => {
    expect(shownEmail("ada@example.com", "hidden")).toBeNull();
    expect(shownEmail("ada@example.com", "masked")).toBe("a•••@example.com");
    expect(shownEmail("ada@example.com", "full")).toBe("ada@example.com");
    // Masking what the server masked already changes nothing.
    expect(shownEmail("a•••@example.com", "masked")).toBe("a•••@example.com");
    expect(shownEmail(null, "full")).toBeNull();
  });

  it("name a customer only when their name is unknown", () => {
    expect(customerLabel(feedItem({ customerName: "Ada", customerEmail: null }))).toBe("Ada");
    expect(customerLabel(feedItem({ customerName: null, customerEmail: "a•••@example.com" }))).toBe(
      "a•••@example.com",
    );
    expect(customerLabel(feedItem())).toBeNull();
  });
});
