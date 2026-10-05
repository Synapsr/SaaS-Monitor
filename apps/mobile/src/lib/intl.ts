/* eslint-disable @typescript-eslint/no-require-imports -- polyfills load only where missing */
/**
 * Screens write amounts like the web: compact on axes and goals ("$15K", "15 k $US"), signed on
 * changes ("+$2,474"). Hermes on iOS formats numbers without `notation: "compact"` nor
 * `signDisplay`: there, `Intl.NumberFormat` (and what it needs) is replaced by FormatJS's, with
 * the data of the languages screens speak. Imported first, before anything formats a number.
 */

function formatsLikeTheWeb(): boolean {
  try {
    const compact = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(15_400);
    const signed = new Intl.NumberFormat("en-US", { signDisplay: "exceptZero" }).format(5);
    return compact === "$15.4K" && signed === "+5";
  } catch {
    return false;
  }
}

if (!formatsLikeTheWeb()) {
  const { shouldPolyfill: needsCanonicalLocales } = require("@formatjs/intl-getcanonicallocales/should-polyfill.js");
  if (needsCanonicalLocales()) require("@formatjs/intl-getcanonicallocales/polyfill-force.js");
  const { shouldPolyfill: needsLocale } = require("@formatjs/intl-locale/should-polyfill.js");
  if (needsLocale()) require("@formatjs/intl-locale/polyfill-force.js");

  require("@formatjs/intl-pluralrules/polyfill-force.js");
  require("@formatjs/intl-pluralrules/locale-data/en.js");
  require("@formatjs/intl-pluralrules/locale-data/fr.js");
  require("@formatjs/intl-pluralrules/locale-data/de.js");
  require("@formatjs/intl-pluralrules/locale-data/es.js");
  require("@formatjs/intl-pluralrules/locale-data/it.js");
  require("@formatjs/intl-pluralrules/locale-data/pt.js");
  require("@formatjs/intl-pluralrules/locale-data/nl.js");

  require("@formatjs/intl-numberformat/polyfill-force.js");
  require("@formatjs/intl-numberformat/locale-data/en.js");
  require("@formatjs/intl-numberformat/locale-data/fr.js");
  require("@formatjs/intl-numberformat/locale-data/de.js");
  require("@formatjs/intl-numberformat/locale-data/es.js");
  require("@formatjs/intl-numberformat/locale-data/it.js");
  require("@formatjs/intl-numberformat/locale-data/pt.js");
  require("@formatjs/intl-numberformat/locale-data/nl.js");
}

export {};
