import { moneyParts } from "@/display/money-parts";

describe("moneyParts", () => {
  it("cuts the symbol before an amount", () => {
    expect(moneyParts(1_248_000, "usd", "en-US")).toEqual({ before: "$", number: "12,480", after: "" });
  });

  it("cuts the symbol after an amount", () => {
    const parts = moneyParts(1_248_000, "eur", "fr-FR");
    expect(parts.before).toBe("");
    expect(parts.number.replace(/\s/g, " ")).toBe("12 480");
    expect(parts.after).toBe("€");
  });

  it("keeps the minus sign with the digits", () => {
    expect(moneyParts(-5_000, "usd", "en-US")).toEqual({ before: "-$", number: "50", after: "" });
  });
});
