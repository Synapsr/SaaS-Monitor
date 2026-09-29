"use client";

import { ChevronRightIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { LANGUAGE_NAMES } from "@/lib/display/i18n";
import { recurringMetric, type RecurringMetric } from "@/lib/display/metric";
import type { Language, Metric, ScreenSettings } from "@/lib/screens/settings";
import { unlockAudio } from "@/lib/sounds";
import { ANNOUNCEMENTS, type Announcement, type Phrase } from "@/lib/voice/announcements";
import { recordedClipUrl } from "@/lib/voice/moment-speech";
import { defaultPhrases, RECORDED_PHRASES } from "@/lib/voice/phrases";
import { recordedClip, speak } from "@/lib/voice/player";
import { screenVoice, voicesOf, type Voice } from "@/lib/voice/voices";
import { ChoiceCard } from "./choice-card";
import { PhraseEditor } from "./phrase-editor";
import { PreviewButton } from "./preview-button";
import { SettingRow } from "./settings-section";
import { VolumeSlider } from "./volume-slider";

type VoiceSettingsValue = ScreenSettings["voice"];

/** Recurring revenue announcements are named after the screen's metric: "ARR milestone". */
const ANNOUNCEMENT_LABELS: Record<Announcement, (metric: RecurringMetric["label"]) => string> = {
  payment: () => "Payment received",
  connectPayment: () => "Payment for a connected account",
  subscription: () => "New subscriber",
  upgrade: () => "Upgrade",
  reactivation: () => "Reactivation",
  downgrade: () => "Downgrade",
  cancellation: () => "Cancellation",
  customer: () => "New customer",
  milestone: (metric) => `${metric} milestone or goal`,
};

/** What each announcement is about, for founders writing their own phrases. */
const ANNOUNCEMENT_DESCRIPTIONS: Record<Announcement, string> = {
  payment: "Every successful charge.",
  connectPayment: "Collected for a Stripe Connect account: the money is theirs.",
  subscription: "A subscription starts paying.",
  upgrade: "A subscription moves to a bigger plan.",
  reactivation: "A former subscriber pays again.",
  downgrade: "A subscription moves to a smaller plan.",
  cancellation: "A subscription stops.",
  customer: "Created in Stripe, often at sign-up, before they pay.",
  milestone: "A milestone is crossed, or the goal reached.",
};

/** What the recorded phrases of an announcement say, quoted: “Payment received!”. */
function recordedQuote(voice: Voice, announcement: Announcement): string {
  const phrases = RECORDED_PHRASES[voice.language];
  const quote = (phrase: Phrase) => `“${phrases[phrase]}”`;
  return announcement === "milestone"
    ? `${quote("milestone")} or ${quote("goal")}`
    : quote(announcement);
}

/** The screen's phrases, with those of an announcement replaced, or gone back to the defaults. */
function withPhrases(
  all: VoiceSettingsValue["phrases"],
  announcement: Announcement,
  phrases: string[] | undefined,
): VoiceSettingsValue["phrases"] {
  const next = { ...all };
  if (phrases) next[announcement] = phrases;
  else delete next[announcement];
  return next;
}

/** Says a recorded phrase from a click: browsers only allow audio after a user gesture. */
function playRecorded(voice: Voice, phrase: Phrase, volume: number) {
  void unlockAudio().then(() =>
    speak(recordedClip(recordedClipUrl(voice.id, phrase)), { volume, delayMs: 0 }),
  );
}

export function VoiceSettings({
  voice,
  language,
  metric,
  showCustomerNames,
  currency,
  product,
  severalProducts,
  canPersonalize,
  onChange,
}: {
  voice: VoiceSettingsValue;
  language: Language;
  metric: Metric;
  showCustomerNames: boolean;
  currency: string;
  /** Stands for `{product}` in the samples: the screen's first Stripe account. */
  product: string;
  /** The screen shows several Stripe accounts: default phrases name the one they are about. */
  severalProducts: boolean;
  /** The server has a Gradium API key to say the screen's own phrases. */
  canPersonalize: boolean;
  onChange: (patch: Partial<VoiceSettingsValue>) => void;
}) {
  const id = useId();
  const speaker = screenVoice(language, voice.voiceId);
  const personalized = voice.personalized && canPersonalize;
  const metricLabel = recurringMetric(metric).label;

  return (
    <div className="flex flex-col gap-6">
      <SettingRow
        htmlFor={`${id}-enabled`}
        label="Announce out loud"
        description="A voice says what just happened, after the sound. It has a switch of its own: a screen can speak without sounds."
      >
        <Switch
          id={`${id}-enabled`}
          checked={voice.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
        />
      </SettingRow>

      {speaker === null ? (
        <p className="text-sm text-pretty text-muted-foreground">
          No voice speaks {LANGUAGE_NAMES[language]} yet. Voices speak English, French, German,
          Spanish and Portuguese: choose one of them as the screen’s language to hear it.
        </p>
      ) : (
        // A disabled fieldset turns every control inside off at once.
        <fieldset
          disabled={!voice.enabled}
          aria-label="Voice options"
          className="flex flex-col gap-6 transition-opacity disabled:opacity-50"
        >
          <div className="flex flex-col gap-2">
            <p id={`${id}-voice`} className="text-sm font-medium">
              Voice
            </p>
            <RadioGroupPrimitive.Root
              value={speaker.id}
              onValueChange={(voiceId) => onChange({ voiceId: voiceId as Voice["id"] })}
              disabled={!voice.enabled}
              aria-labelledby={`${id}-voice`}
              className="grid gap-2 sm:grid-cols-2"
            >
              {voicesOf(language).map((option) => (
                <div key={option.id} className="relative">
                  <ChoiceCard
                    value={option.id}
                    title={option.name}
                    hint={option.description}
                    className="pr-10"
                  />
                  <div className="absolute top-2 right-2">
                    <PreviewButton
                      label={option.name}
                      disabled={!voice.enabled}
                      onClick={() => playRecorded(option, "subscription", voice.volume)}
                    />
                  </div>
                </div>
              ))}
            </RadioGroupPrimitive.Root>
          </div>

          <VolumeSlider
            volume={voice.volume}
            disabled={!voice.enabled}
            onChange={(volume) => onChange({ volume })}
            onCommit={(volume) => playRecorded(speaker, "payment", volume)}
          />

          <SettingRow
            htmlFor={`${id}-personalized`}
            label="Your own phrases"
            description={
              canPersonalize
                ? "Say the customer’s name, the amount or the plan, in words you choose. Each announcement is synthesized by Gradium as it happens."
                : "Say the customer’s name, the amount or the plan, in words you choose. Needs a Gradium API key on the server (GRADIUM_API_KEY)."
            }
          >
            <Switch
              id={`${id}-personalized`}
              checked={personalized}
              disabled={!voice.enabled || !canPersonalize}
              onCheckedChange={(checked) => onChange({ personalized: checked })}
            />
          </SettingRow>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">Announce</p>
            {ANNOUNCEMENTS.map((announcement) => {
              const label = ANNOUNCEMENT_LABELS[announcement](metricLabel);
              const enabled = voice.announce[announcement];
              const toggle = (
                <Switch
                  id={`${id}-${announcement}`}
                  checked={enabled}
                  disabled={!voice.enabled}
                  onCheckedChange={(checked) =>
                    onChange({ announce: { ...voice.announce, [announcement]: checked } })
                  }
                />
              );

              if (!personalized) {
                return (
                  <SettingRow
                    key={announcement}
                    htmlFor={`${id}-${announcement}`}
                    label={label}
                    description={recordedQuote(speaker, announcement)}
                  >
                    <PreviewButton
                      label={label}
                      disabled={!voice.enabled}
                      onClick={() => playRecorded(speaker, announcement, voice.volume)}
                    />
                    {toggle}
                  </SettingRow>
                );
              }

              const own = voice.phrases[announcement];
              return (
                <Collapsible key={announcement} className="flex flex-col gap-3">
                  <SettingRow
                    htmlFor={`${id}-${announcement}`}
                    label={label}
                    description={
                      <>
                        {ANNOUNCEMENT_DESCRIPTIONS[announcement]}{" "}
                        <CollapsibleTrigger className="group/trigger inline-flex items-center gap-0.5 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                          {own ? "Your phrases" : "Phrases"}
                          <ChevronRightIcon className="size-3.5 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
                        </CollapsibleTrigger>
                      </>
                    }
                  >
                    {toggle}
                  </SettingRow>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <PhraseEditor
                      announcement={announcement}
                      label={label}
                      phrases={own}
                      defaults={defaultPhrases(speaker.language, announcement, {
                        severalProducts,
                      })}
                      voice={speaker}
                      volume={voice.volume}
                      currency={currency}
                      product={product}
                      showCustomerNames={showCustomerNames}
                      onChange={(phrases) =>
                        onChange({ phrases: withPhrases(voice.phrases, announcement, phrases) })
                      }
                    />
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
