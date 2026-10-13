import { displayLayout, displayScale } from "@/display/scale";

describe("displayScale", () => {
  it("draws a phone at its own size", () => {
    expect(displayScale("phone", 390, 844)).toBe(1);
    expect(displayScale("phone", 320, 568)).toBe(1);
  });

  it("draws a tablet larger, within bounds", () => {
    expect(displayScale("phone", 1032, 1376)).toBe(1.5);
    expect(displayScale("wall", 1376, 1032)).toBeCloseTo(1.6);
  });

  it("fits the wall layout of a phone in landscape", () => {
    expect(displayScale("wall", 874, 402)).toBeCloseTo(1.005, 2);
  });
});

describe("displayLayout", () => {
  it("turns landscape into the wall layout", () => {
    expect(displayLayout(874, 402)).toBe("wall");
    expect(displayLayout(402, 874)).toBe("phone");
  });
});
