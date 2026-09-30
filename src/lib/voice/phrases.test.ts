import { describe, expect, it } from "vitest";
import { phraseAnnouncement, type Phrase } from "./announcements";
import {
  chooseSpeech,
  DEFAULT_PHRASES,
  defaultPhrases,
  fillPhrase,
  phraseProblem,
  phraseVariables,
  RECORDED_PHRASES,
} from "./phrases";
import { VOICE_LANGUAGES } from "./voices";

describe("fillPhrase", () => {
  it("writes the details in", () => {
    expect(fillPhrase("{name} just paid {amount}!", { name: "Ada", amount: "$49" })).toBe(
      "Ada just paid $49!",
    );
  });

  it("gives up on a phrase whose details are unknown or misspelled", () => {
    expect(fillPhrase("Welcome, {name}!", { name: null })).toBeNull();
    expect(fillPhrase("Welcome, {name}!", {})).toBeNull();
    expect(fillPhrase("Welcome, {nom}!", { name: "Ada" })).toBeNull();
  });

  it("reads formatting spaces as plain ones, and trims stray ones", () => {
    expect(fillPhrase("  Paiement reçu :  {amount} ! ", { amount: "1 234,56 €" })).toBe(
      "Paiement reçu : 1 234,56 € !",
    );
  });

  it("says nothing for an empty phrase", () => {
    expect(fillPhrase("   ", {})).toBeNull();
  });
});

describe("phraseVariables and phraseProblem", () => {
  it("lists the details of a phrase, and what it misspells", () => {
    expect(phraseVariables("{name} {amount} {name} {Name} {}")).toEqual({
      variables: ["name", "amount"],
      unknown: ["Name", ""],
    });
  });

  it("explains what can't be said for an announcement", () => {
    expect(phraseProblem("{name} paid {amount}", "payment")).toBeNull();
    expect(phraseProblem("Hi {nom}", "payment")).toMatch(/^\{nom\} is not a detail/);
    expect(phraseProblem("{name} is on {plan}", "customer")).toMatch(/^\{plan\} is not known/);
    expect(phraseProblem("Your fee: {fee}", "connectPayment")).toBeNull();
  });
});

describe("chooseSpeech", () => {
  const values = { name: "Ada", amount: "$49", plan: null };

  it("picks one of the screen's phrases whose details are known, the same for the same seed", () => {
    const own = ["{name} paid {amount}!", "Ka-ching, {amount}!", "{plan} again!"];
    const said = new Set(
      Array.from({ length: 40 }, (_, index) =>
        chooseSpeech({ own, defaults: [], values, seed: `payment:${index}` }),
      ),
    );
    expect(said).toEqual(new Set(["Ada paid $49!", "Ka-ching, $49!"]));
    const pick = chooseSpeech({ own, defaults: [], values, seed: "payment:7" });
    expect(chooseSpeech({ own, defaults: [], values, seed: "payment:7" })).toBe(pick);
  });

  it("falls back to the first default phrase that can be said", () => {
    expect(
      chooseSpeech({
        own: ["{plan} again!", ""],
        defaults: ["{name} joined {plan}.", "{name} paid {amount}.", "Payment received."],
        values,
        seed: "payment:1",
      }),
    ).toBe("Ada paid $49.");
  });
});

describe("the phrases voices ship with", () => {
  const phrases = Object.keys(RECORDED_PHRASES.en) as Phrase[];

  it("are recorded without details, in every language", () => {
    for (const language of VOICE_LANGUAGES) {
      expect(Object.keys(RECORDED_PHRASES[language]).sort()).toEqual([...phrases].sort());
      for (const text of Object.values(RECORDED_PHRASES[language])) {
        expect(phraseVariables(text).variables, text).toEqual([]);
      }
    }
  });

  it("only say details their announcement knows, and always have one to fall back on", () => {
    for (const language of VOICE_LANGUAGES) {
      for (const phrase of phrases) {
        const defaults = DEFAULT_PHRASES[language][phrase];
        const announcement = phraseAnnouncement(phrase);
        for (const text of defaults) expect(phraseProblem(text, announcement), text).toBeNull();
        // The amount of a moment is always known; nothing else is.
        const last = phraseVariables(defaults[defaults.length - 1]).variables;
        expect(
          last.filter((variable) => variable !== "amount"),
          `${language} ${phrase}`,
        ).toEqual([]);
      }
    }
  });

  it("name the product first on a screen showing several", () => {
    expect(defaultPhrases("fr", "customer", { severalProducts: true })).toEqual([
      "{product} : Nouveau client : bienvenue, {name} !",
      "{product} : Nouveau client !",
    ]);
    expect(defaultPhrases("en", "customer", { severalProducts: false })).toEqual(
      DEFAULT_PHRASES.en.customer,
    );
  });
});
