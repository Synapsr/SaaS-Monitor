import { siteConfig } from "@/lib/site";

/**
 * Who publishes and hosts saas-monitor.com, as its legal pages state it (French law asks for this
 * notice, the LCEN). A self-hosted instance is published by whoever runs it: these facts, and the
 * pages that print them, describe the hosted service only (`isHostedInstance` tells it apart).
 */

export const LEGAL_EMAIL = "hello@lumy.bzh";

/** The domain of the hosted service, the one these facts and its terms are about. */
export const HOSTED_DOMAIN = new URL(siteConfig.hostedUrl).host;

export interface PostalAddress {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export const publisher = {
  name: "Lumy.Media SAS",
  shareCapital: { en: "€2,000", fr: "2\u00a0000\u00a0€" },
  address: {
    street: "Immeuble Le Grand Large, 2e éperon, Quai de la Douane",
    postalCode: "29200",
    city: "Brest",
    country: "France",
  },
  siren: "889 608 790",
  /** The registered office's establishment: the SIREN followed by five digits. */
  siret: "889 608 790 00032",
  registryCity: "Brest",
  vatNumber: "FR04889608790",
  phone: { national: "02 57 52 09 77", international: "+33 2 57 52 09 77" },
  email: LEGAL_EMAIL,
  director: "Loan Talvat",
} as const;

export const host = {
  name: "OVH SAS",
  siren: "424 761 419",
  registryCity: "Lille Métropole",
  address: { street: "2 rue Kellermann", postalCode: "59100", city: "Roubaix", country: "France" },
  phone: { national: "09 72 10 10 07", international: "+33 9 72 10 10 07" },
  website: "https://www.ovhcloud.com",
} as const;

/** The CNIL, the French data protection authority, where anyone may lodge a complaint. */
export const supervisoryAuthority = {
  name: "CNIL",
  fullName: "Commission nationale de l’informatique et des libertés",
  address: "3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France",
  website: "https://www.cnil.fr",
} as const;

export function postalAddress({ street, postalCode, city, country }: PostalAddress): string {
  return `${street}, ${postalCode} ${city}, ${country}`;
}

/** The legal pages, in the order their switcher lists them. */
export const LEGAL_PAGES = [
  { id: "privacy", href: "/privacy", title: "Privacy policy" },
  { id: "terms", href: "/terms", title: "Terms of service" },
  { id: "legal", href: "/legal", title: "Legal notice" },
] as const;

export type LegalPageId = (typeof LEGAL_PAGES)[number]["id"];

/** "2026-09-30" → "September 30, 2026", whatever the server's time zone. */
export function formatLegalDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}
