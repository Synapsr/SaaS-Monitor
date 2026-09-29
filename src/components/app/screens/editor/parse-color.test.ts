import { describe, expect, it } from "vitest";
import { parseColor } from "./parse-color";

describe("parseColor", () => {
  it.each([
    ["#ff6b35", "#ff6b35"],
    ["#FF6B35", "#ff6b35"],
    ["ff6b35", "#ff6b35"],
    [" #ff6b35 ", "#ff6b35"],
    ["#f63", "#ff6633"],
    ["F63", "#ff6633"],
  ])("reads %j as %s", (input, color) => {
    expect(parseColor(input)).toBe(color);
  });

  it.each(["", "#", "#ff6b3", "#ff6b355", "orange", "#ggg", "rgb(255 107 53)"])(
    "refuses %j",
    (input) => {
      expect(parseColor(input)).toBeNull();
    },
  );
});
