import { countryName } from "@/lib/display/format";
import { displayLocale } from "@/lib/display/i18n";
import { recurringMetric } from "@/lib/display/metric";
import { testPaymentAmount, type Moment } from "@/lib/display/moments";
import type { DisplayState, FeedItem } from "@/lib/display/types";
import { formatMoney, minorUnitDigits, toMinorUnits } from "@/lib/money";
import type { ScreenSettings } from "@/lib/screens/settings";
import { ANNOUNCEMENT_VARIABLES, type Announcement, type Phrase } from "./announcements";
import { chooseSpeech, defaultPhrases, type PhraseValues } from "./phrases";
import { speaksLanguage, type VoiceId, type VoiceLanguage } from "./voices";

/** What a voice says about a moment, and how a screen's settings choose it. */

/** What a moment announces; `null` for the summary of a burst, which the sound and card cover. */
export function momentAnnouncement(moment: Moment): Announcement | null {
  switch (moment.kind) {
    case "payment":
      if (moment.payment.connect) return "connectPayment";
      // A payment that started or upgraded a subscription is announced by what it started.
      return moment.movement ? movementAnnouncement(moment.movement) : "payment";
    case "movement":
      return movementAnnouncement(moment.movement);
    case "customer":
      return "customer";
    case "milestone":
      return "milestone";
    case "test":
      return "payment";
    case "summary":
      return null;
  }
}

function movementAnnouncement(item: FeedItem): Announcement {
  switch (item.kind) {
    case "new":
      return "subscription";
    case "expansion":
      return "upgrade";
    case "reactivation":
      return "reactivation";
    case "contraction":
      return "downgrade";
    case "churn":
      // A failed payment is no customer leaving: it has its own announcement.
      return item.churn?.reason === "unpaid" ? "unpaid" : "cancellation";
    default:
      return "payment";
  }
}

/**
 * What a screen announces about a moment, and in which phrase; `null` when its settings keep the
 * moment quiet or no voice speaks its language.
 */
export function momentSpeech(
  moment: Moment,
  settings: Pick<ScreenSettings, "voice" | "language">,
): { announcement: Announcement; phrase: Phrase; language: VoiceLanguage } | null {
  const { voice, language } = settings;
  if (!voice.enabled || !speaksLanguage(language)) return null;
  const announcement = momentAnnouncement(moment);
  if (announcement === null) return null;
  // The founder asked to hear it: only the main switch applies.
  if (moment.kind !== "test" && !voice.announce[announcement]) return null;
  return { announcement, phrase: momentPhrase(moment, announcement), language };
}

/** The phrase of an announcement that says the most about the moment. */
function momentPhrase(moment: Moment, announcement: Announcement): Phrase {
  if (moment.kind === "milestone" && moment.isGoal) return "goal";
  if (moment.kind === "movement" && announcement === "cancellation") {
    const reason = moment.movement.churn?.reason;
    if (reason === "scheduled") return "cancellationScheduled";
    if (reason === "paused") return "pause";
  }
  return announcement;
}

/** Where the recorded clip of a phrase is served from (`scripts/generate-voices.ts`). */
export function recordedClipUrl(voiceId: VoiceId, phrase: Phrase): string {
  return `/voices/${voiceId}/${phrase}.mp3`;
}

/** Amounts as a voice reads them: exact rather than compact, and cents only when there are some. */
export function spokenMoney(amount: number, currency: string, locale: string): string {
  const cents = amount % 10 ** minorUnitDigits(currency) !== 0;
  return formatMoney(Math.abs(amount), currency, { locale, cents });
}

/** Stand-ins for a test celebration, and for the phrases previewed in the settings. */
const SAMPLE_COUNTRIES: Record<VoiceLanguage, string> = {
  en: "US",
  fr: "FR",
  de: "DE",
  es: "ES",
  pt: "BR",
};

export function sampleValues(
  language: VoiceLanguage,
  sample: { amount: number; currency: string; product: string; showCustomerNames: boolean },
): PhraseValues {
  const { locale } = displayLocale(language);
  return {
    name: sample.showCustomerNames ? "Ada Lovelace" : null,
    amount: spokenMoney(sample.amount, sample.currency, locale),
    plan: "Pro",
    country: countryName(SAMPLE_COUNTRIES[language], language),
    product: sample.product,
    fee: spokenMoney(Math.round(sample.amount / 10), sample.currency, locale),
  };
}

/**
 * The details a phrase previewed in the settings says: a typical price, a round milestone, and a
 * name even when the screen hides them, to hear how the phrase sounds with one.
 */
export function previewValues(
  announcement: Announcement,
  language: VoiceLanguage,
  sample: { currency: string; product: string },
): PhraseValues {
  const amount = toMinorUnits(announcement === "milestone" ? 10_000 : 49, sample.currency);
  const values = sampleValues(language, { ...sample, amount, showCustomerNames: true });
  // Only what the announcement knows: `{plan}` means nothing for a new customer.
  return Object.fromEntries(
    ANNOUNCEMENT_VARIABLES[announcement].map((variable) => [variable, values[variable]]),
  );
}

/**
 * The details of a moment, as a voice says them. Amounts are those of its card: a payment's, or
 * a change of the screen's metric ("$1,788" of ARR), without their sign.
 */
export function momentValues(
  moment: Moment,
  state: DisplayState,
  language: VoiceLanguage,
): PhraseValues {
  const { currency } = state;
  const { locale } = displayLocale(language);
  const money = (amount: number) => spokenMoney(amount, currency, locale);
  const described = (item: FeedItem, amount: string | null): PhraseValues => ({
    name: item.customerName,
    amount,
    plan: item.planName,
    country: item.country ? countryName(item.country, language) : null,
    product: item.accountName,
    fee: item.connect?.applicationFee ? money(item.connect.applicationFee) : null,
  });

  switch (moment.kind) {
    case "payment":
      return described(moment.payment, money(moment.payment.amount));
    case "movement": {
      const { fromMrr } = recurringMetric(state.screen.settings.metric);
      return described(moment.movement, money(fromMrr(moment.movement.amount)));
    }
    case "customer":
      return described(moment.customer, null);
    case "milestone":
      return {
        amount: money(moment.amount),
        product: state.accounts.find((account) => account.id === moment.accountId)?.name ?? null,
      };
    case "test":
      return sampleValues(language, {
        amount: testPaymentAmount(state),
        currency,
        product: state.accounts[0]?.name ?? state.screen.name,
        showCustomerNames: state.screen.settings.showCustomerNames,
      });
    case "summary":
      return {};
  }
}

/**
 * What a voice says about a moment on this screen, from its own phrases or the default ones;
 * `null` when it says nothing. Every display of the screen says the same.
 */
export function momentText(moment: Moment, state: DisplayState): string | null {
  const { settings } = state.screen;
  const speech = momentSpeech(moment, settings);
  if (speech === null) return null;
  return chooseSpeech({
    own: settings.voice.phrases[speech.announcement] ?? [],
    defaults: defaultPhrases(speech.language, speech.phrase, {
      severalProducts: state.accounts.length > 1,
    }),
    values: momentValues(moment, state, speech.language),
    seed: moment.id,
  });
}
