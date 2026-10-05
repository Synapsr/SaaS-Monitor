import { moveScreen } from "@/screens/store";

const screens = [{ key: "a" }, { key: "b" }, { key: "c" }];
const keys = (list: { key: string }[]) => list.map(({ key }) => key).join("");

describe("moveScreen", () => {
  it("moves a screen up or down", () => {
    expect(keys(moveScreen(screens, "b", -1))).toBe("bac");
    expect(keys(moveScreen(screens, "b", 1))).toBe("acb");
  });

  it("stays within the list", () => {
    expect(keys(moveScreen(screens, "a", -1))).toBe("abc");
    expect(keys(moveScreen(screens, "c", 5))).toBe("abc");
  });

  it("leaves the list alone for an unknown screen", () => {
    expect(keys(moveScreen(screens, "z", 1))).toBe("abc");
  });
});
