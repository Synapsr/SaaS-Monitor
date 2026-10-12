import "server-only";
import type { SoundBoardPack } from "@/components/site/sound-board";
import type { VoiceBoardLanguage } from "@/components/site/voice-board";
import { SOUND_EVENTS, soundFile } from "@/lib/marketing/sound-files";
import { SOUND_PACKS } from "@/lib/screens/options";
import { languageName } from "@/lib/site/format";
import type { SiteText } from "@/lib/site/i18n";
import { LANGUAGE_TAGS } from "@/lib/site/languages";
import type { Phrase } from "@/lib/voice/announcements";
import { RECORDED_PHRASES } from "@/lib/voice/phrases";
import { VOICE_LANGUAGES, voicesOf } from "@/lib/voice/voices";

/**
 * The words of the sound and voice boards, written on the server: client components get strings,
 * never the functions that write them, nor the other languages.
 */

export function soundBoardPacks(
  text: SiteText["sounds"],
  { files = false }: { files?: boolean } = {},
): SoundBoardPack[] {
  return SOUND_PACKS.map((pack) => {
    const name = text.packs[pack].name;
    return {
      id: pack,
      name,
      description: text.packs[pack].description,
      sounds: SOUND_EVENTS.map((event) => {
        const label = text.events[event];
        const file = soundFile(pack, event);
        return {
          event,
          label,
          play: text.play(label, name),
          file: files
            ? { url: file.url, name: file.fileName, label: text.download(label, name) }
            : undefined,
        };
      }),
    };
  });
}

const BOARD_PHRASES = ["payment", "subscription", "customer", "upgrade", "goal"] as const;

export function voiceBoardProps(text: SiteText["sounds"], locale: string) {
  const phrases = BOARD_PHRASES.map((id) => ({ id, label: text.voices.phrases[id] }));
  const languages: VoiceBoardLanguage[] = VOICE_LANGUAGES.map((language) => {
    const inSentence = languageName(language, locale);
    const words: Partial<Record<Phrase, string>> = {};
    for (const phrase of BOARD_PHRASES) words[phrase] = RECORDED_PHRASES[language][phrase];
    return {
      tag: LANGUAGE_TAGS[language],
      name: languageName(language, locale, { capitalized: true }),
      words,
      voices: voicesOf(language).map((voice) => {
        const play: Partial<Record<Phrase, string>> = {};
        for (const phrase of BOARD_PHRASES) {
          play[phrase] = text.voices.play(voice.name, inSentence, words[phrase] ?? "");
        }
        return { id: voice.id, name: voice.name, play };
      }),
    };
  });
  return { choose: text.voices.choose, phrases, languages };
}
