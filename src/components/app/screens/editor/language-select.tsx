"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_NAMES } from "@/lib/display/i18n";
import { LANGUAGES, type Language } from "@/lib/screens/settings";

/** The language of the screen: its words, and how it writes numbers and dates. */
export function LanguageSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <Select
      name="language"
      value={value}
      onValueChange={(language) => onChange(language as Language)}
    >
      <SelectTrigger id={id} className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((language) => (
          <SelectItem key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
