import { displayPalette, withAlpha } from "@/display/palette";

describe("displayPalette", () => {
  it("draws a preset accent with its tuned colors", () => {
    const palette = displayPalette("dark", "emerald");
    expect(palette).toMatchObject({ screen: "#08090b", glow: "#34d399", glowInk: "#6ee7b7" });
    expect(palette.glowWash).toBe("rgba(52, 211, 153, 0.14)");
  });

  it("keeps a custom accent readable on the light screen", () => {
    const palette = displayPalette("light", "#ffee00");
    expect(palette.screen).toBe("#f4f5f7");
    // Darkened from the yellow picked, as the web does.
    expect(palette.glow).not.toBe("#ffee00");
  });

  it("returns the same palette for the same screen", () => {
    expect(displayPalette("dark", "violet")).toBe(displayPalette("dark", "violet"));
  });
});

describe("withAlpha", () => {
  it("writes a hex color with an opacity", () => {
    expect(withAlpha("#08090b", 0.5)).toBe("rgba(8, 9, 11, 0.5)");
  });
});
