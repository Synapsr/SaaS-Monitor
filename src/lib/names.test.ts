import { describe, expect, it } from "vitest";
import { NAME_MAX_LENGTH, nameSchema, personNameSchema } from "./names";

describe("names", () => {
  const screenName = nameSchema("Give the screen a name.");

  it("trims names and accepts them up to the maximum length", () => {
    expect(screenName.parse("  Lobby ")).toBe("Lobby");
    expect(screenName.safeParse("x".repeat(NAME_MAX_LENGTH)).success).toBe(true);
  });

  it("explains what is wrong", () => {
    expect(screenName.safeParse("   ").error?.issues[0].message).toBe("Give the screen a name.");
    expect(screenName.safeParse("x".repeat(NAME_MAX_LENGTH + 1)).error?.issues[0].message).toBe(
      "Use at most 60 characters.",
    );
    expect(personNameSchema.safeParse("").error?.issues[0].message).toBe("Enter your name.");
  });
});
