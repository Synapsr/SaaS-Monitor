"use client";

import { ChevronRightIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { SCREEN_EVENTS, type ScreenEvent } from "@/lib/display/events";
import { LANGUAGE_NAMES } from "@/lib/display/i18n";
import { recurringMetric } from "@/lib/display/metric";
import type { Language, Metric, ScreenSettings } from "@/lib/screens/settings";
import { unlockAudio } from "@/lib/sounds";
import type { Phrase } from "@/lib/voice/announcements";
import { recordedClipUrl } from "@/lib/voice/moment-speech";
import { defaultPhrases, RECORDED_PHRASES } from "@/lib/voice/phrases";
import { recordedClip, speak } from "@/lib/voice/player";
import { screenVoice, voicesOf, type Voice } from "@/lib/voice/voices";
import { ChoiceCard } from "./choice-card";
import { EVENT_OPTIONS } from "./event-labels";
import { PhraseEditor } from "./phrase-editor";
import { PreviewButton } from "./preview-button";
import { SettingRow } from "./settings-section";
import { VolumeSlider } from "./volume-slider";

type VoiceSettingsValue = ScreenSettings["voice"];

/** What the recorded phrases of an event say, quoted: “Payment received!”. */
function recordedQuote(voice: Voice, event: ScreenEvent): string {
  const phrases = RECORDED_PHRASES[voice.language];
  const quote = (phrase: Phrase) => `“${phrases[phrase]}”`;
  switch (event) {
    case "milestone":
      return `${quote("milestone")} or ${quote("goal")}`;
    case "cancellation":
      return `${quote("cancellation")} or ${quote("cancellationScheduled")}`;
    default:
      return quote(event);
  }
}

/** The screen's phrases, with those of an event replaced, or gone back to the defaults. */
function withPhrases(
  all: VoiceSettingsValue["phrases"],
  event: ScreenEvent,
  phrases: string[] | undefined,
): VoiceSettingsValue["phrases"] {
  const next = { ...all };
  if (phrases) next[event] = phrases;
  else delete next[event];
  return next;
}

/** Says a recorded phrase from a click: browsers only allow audio after a user gesture. */
function playRecorded(voice: Voice, phrase: Phrase, volume: number) {
  void unlockAudio().then(() =>
    speak(recordedClip(recordedClipUrl(voice.id, phrase)), { volume, delayMs: 0 }),
  );
}

/** How the screen speaks, and what it says: which events it says is chosen in Events. */
export function VoiceSettings({
  voice,
  events,
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
  events: ScreenSettings["events"];
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
  const said = SCREEN_EVENTS.filter((event) => events[event].voice);

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
            <p className="text-sm font-medium">What it says</p>
            {said.length === 0 && (
              <p className="text-sm text-pretty text-muted-foreground">
                Nothing yet: check the events to say out loud in Events.
              </p>
            )}
            {said.map((event) => {
              const label = EVENT_OPTIONS[event].label(metricLabel);
              if (!personalized) {
                return (
                  <SettingRow key={event} label={label} description={recordedQuote(speaker, event)}>
                    <PreviewButton
                      label={label}
                      disabled={!voice.enabled}
                      onClick={() => playRecorded(speaker, event, voice.volume)}
                    />
                  </SettingRow>
                );
              }
              const own = voice.phrases[event];
              return (
                <Collapsible key={event} className="flex flex-col gap-3">
                  <CollapsibleTrigger className="group/trigger flex items-center justify-between gap-4 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm text-muted-foreground">
                        {own ? "Your phrases" : "Default phrases"}
                      </span>
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <PhraseEditor
                      event={event}
                      label={label}
                      phrases={own}
                      defaults={defaultPhrases(speaker.language, event, { severalProducts })}
                      voice={speaker}
                      volume={voice.volume}
                      currency={currency}
                      product={product}
                      showCustomerNames={showCustomerNames}
                      onChange={(phrases) =>
                        onChange({ phrases: withPhrases(voice.phrases, event, phrases) })
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
