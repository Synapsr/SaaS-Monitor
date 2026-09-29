import type { Language } from "@/lib/screens/settings";

/**
 * The voices that announce moments: two per language Gradium speaks, chosen for an upbeat,
 * clear delivery that carries across a room. Their recorded phrases ship in `public/voices`
 * (`scripts/generate-voices.ts`); a server with a Gradium API key also has them say a screen's
 * own phrases.
 */

/** The screen languages a voice speaks: those of Gradium. */
export const VOICE_LANGUAGES = [
  "en",
  "fr",
  "de",
  "es",
  "pt",
] as const satisfies readonly Language[];

export type VoiceLanguage = (typeof VOICE_LANGUAGES)[number];

export const VOICES = [
  {
    id: "harper",
    name: "Harper",
    language: "en",
    description: "Confident and friendly, American",
    gradiumId: "4SZHfMpw-p46Ywgs",
  },
  {
    id: "sterling",
    name: "Sterling",
    language: "en",
    description: "Warm and energetic, American",
    gradiumId: "6MFfc37kq0sBjBjy",
  },
  {
    id: "maelys",
    name: "Maëlys",
    language: "fr",
    description: "Lively and welcoming",
    gradiumId: "s048cR1l2Jmu4k3B",
  },
  {
    id: "marius",
    name: "Marius",
    language: "fr",
    description: "Confident and energetic",
    gradiumId: "biuhvu17TxVKOcyy",
  },
  {
    id: "femke",
    name: "Femke",
    language: "de",
    description: "Joyful and warm",
    gradiumId: "W4IqRNmU0pbxrKyn",
  },
  {
    id: "erik",
    name: "Erik",
    language: "de",
    description: "Confident and upbeat",
    gradiumId: "lbpBQTVCOcOHJ5zS",
  },
  {
    id: "noa",
    name: "Noa",
    language: "es",
    description: "Bright and confident, Castilian",
    gradiumId: "b6FvJAiokjdqIti4",
  },
  {
    id: "marcos",
    name: "Marcos",
    language: "es",
    description: "Confident and upbeat, Castilian",
    gradiumId: "jvPx8j8zLGQ3utZz",
  },
  {
    id: "bianca",
    name: "Bianca",
    language: "pt",
    description: "Bright and welcoming, Brazilian",
    gradiumId: "uCqxlQCKi8sPHwG2",
  },
  {
    id: "davi",
    name: "Davi",
    language: "pt",
    description: "Confident and upbeat, Brazilian",
    gradiumId: "NuUr_x5V90hSHzCJ",
  },
] as const satisfies readonly {
  id: string;
  name: string;
  language: VoiceLanguage;
  description: string;
  gradiumId: string;
}[];

export type Voice = (typeof VOICES)[number];
export type VoiceId = Voice["id"];

export const VOICE_IDS = VOICES.map((voice) => voice.id) as [VoiceId, ...VoiceId[]];

export function speaksLanguage(language: Language): language is VoiceLanguage {
  return VOICE_LANGUAGES.some((candidate) => candidate === language);
}

export function voicesOf(language: Language): Voice[] {
  return VOICES.filter((voice) => voice.language === language);
}

/**
 * The voice of a screen: its chosen one when it speaks the screen's language, else the first of
 * that language (a screen switching to French leaves its English voice behind). `null` when no
 * voice speaks the language.
 */
export function screenVoice(language: Language, voiceId: VoiceId | null): Voice | null {
  const voices = voicesOf(language);
  return voices.find((voice) => voice.id === voiceId) ?? voices[0] ?? null;
}
