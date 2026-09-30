import { describe, expect, it } from "vitest";
import {
  formatLegalDate,
  host,
  isHostedService,
  LEGAL_PAGES,
  postalAddress,
  publisher,
} from "./legal";

/** SIREN and SIRET numbers end with a Luhn check digit: a typo in them breaks it. */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  [...digits].reverse().forEach((character, index) => {
    const digit = Number(character) * (index % 2 === 1 ? 2 : 1);
    sum += digit > 9 ? digit - 9 : digit;
  });
  return sum % 10 === 0;
}

const digitsOf = (value: string) => value.replace(/\s/g, "");

describe("legal facts", () => {
  it("prints registration numbers that pass their check digit", () => {
    for (const number of [publisher.siren, publisher.siret, host.siren]) {
      expect(digitsOf(number)).toMatch(/^\d+$/);
      expect(passesLuhn(digitsOf(number)), number).toBe(true);
    }
    expect(digitsOf(publisher.siren)).toHaveLength(9);
    expect(digitsOf(publisher.siret)).toHaveLength(14);
    expect(digitsOf(publisher.siret).startsWith(digitsOf(publisher.siren))).toBe(true);
  });

  it("derives the VAT number from the SIREN, as France does", () => {
    const siren = Number(digitsOf(publisher.siren));
    const key = String((12 + 3 * (siren % 97)) % 97).padStart(2, "0");
    expect(publisher.vatNumber).toBe(`FR${key}${digitsOf(publisher.siren)}`);
  });

  it("writes postal addresses on one line", () => {
    expect(postalAddress(host.address)).toBe("2 rue Kellermann, 59100 Roubaix, France");
  });

  it("links every legal page once", () => {
    const hrefs = LEGAL_PAGES.map(({ href }) => href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("isHostedService", () => {
  it("recognizes the hosted service by its domain", () => {
    expect(isHostedService("https://saas-monitor.com")).toBe(true);
    expect(isHostedService("https://www.saas-monitor.com")).toBe(true);
  });

  it("leaves self-hosted instances and look-alike domains out", () => {
    expect(isHostedService("http://localhost:3000")).toBe(false);
    expect(isHostedService("https://monitor.example.com")).toBe(false);
    expect(isHostedService("https://saas-monitor.com.example.com")).toBe(false);
    expect(isHostedService("https://my-saas-monitor.com")).toBe(false);
    expect(isHostedService("not a url")).toBe(false);
  });
});

describe("formatLegalDate", () => {
  it("spells the date out, in UTC whatever the server's time zone", () => {
    expect(formatLegalDate("2026-09-30")).toBe("September 30, 2026");
    expect(formatLegalDate("2027-01-01")).toBe("January 1, 2027");
  });
});
