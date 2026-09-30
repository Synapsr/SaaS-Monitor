"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { previewPhraseAction } from "@/app/app/screens/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_PHRASES, PHRASE_MAX_LENGTH } from "@/lib/screens/settings";
import { unlockAudio } from "@/lib/sounds";
import type { ScreenEvent } from "@/lib/display/events";
import { EVENT_VARIABLES, type Variable } from "@/lib/voice/announcements";
import { previewValues } from "@/lib/voice/moment-speech";
import { fillPhrase, phraseProblem, phraseVariables } from "@/lib/voice/phrases";
import { decodeSpeech, decodesOpus, speak } from "@/lib/voice/player";
import type { Voice } from "@/lib/voice/voices";
import { PreviewButton } from "./preview-button";

const VARIABLE_HINTS: Record<Variable, string> = {
  name: "The customer’s name, when the screen shows names",
  amount: "The amount on the card",
  plan: "The plan’s name",
  country: "The customer’s country",
  product: "The Stripe account’s name",
  fee: "Your fee on a payment for a connected account",
};

function toArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)).buffer;
}

/**
 * The phrases of an event, each with the details it says (`{name}`), and how it sounds with
 * sample ones. Until the founder changes them, they are the defaults of the screen's
 * language (`phrases` is `undefined`).
 */
export function PhraseEditor({
  event,
  label,
  phrases,
  defaults,
  voice,
  volume,
  currency,
  product,
  showCustomerNames,
  onChange,
}: {
  event: ScreenEvent;
  /** Names the inputs: "New subscriber, phrase 1". */
  label: string;
  phrases: readonly string[] | undefined;
  defaults: readonly string[];
  voice: Voice;
  volume: number;
  currency: string;
  /** Stands for `{product}` in samples. */
  product: string;
  showCustomerNames: boolean;
  onChange: (phrases: string[] | undefined) => void;
}) {
  const shown = phrases ?? defaults;
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focused = useRef(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const [, startPreview] = useTransition();
  const sample = previewValues(event, voice.language, { currency, product });
  const variables = EVENT_VARIABLES[event];
  const namesHidden =
    !showCustomerNames &&
    shown.some((phrase) => phraseVariables(phrase).variables.includes("name"));

  const update = (index: number, phrase: string) =>
    onChange(shown.map((current, position) => (position === index ? phrase : current)));

  function insert(variable: Variable) {
    const index = Math.min(focused.current, shown.length - 1);
    const input = inputs.current[index];
    const phrase = shown[index];
    const start = input?.selectionStart ?? phrase.length;
    const end = input?.selectionEnd ?? start;
    const token = `{${variable}}`;
    update(
      index,
      `${phrase.slice(0, start)}${token}${phrase.slice(end)}`.slice(0, PHRASE_MAX_LENGTH),
    );
    // After React writes the new value: the caret goes right after what was inserted.
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function play(index: number) {
    // Inside the click: browsers only allow audio after a user gesture.
    void unlockAudio();
    setPlaying(index);
    startPreview(async () => {
      const result = await previewPhraseAction({
        voiceId: voice.id,
        event,
        phrase: shown[index],
        currency,
        product,
        format: decodesOpus() ? "opus" : "wav",
      });
      setPlaying(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      speak(decodeSpeech(Promise.resolve(toArrayBuffer(result.audio))), { volume, delayMs: 0 });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
      <ul className="flex flex-col gap-3">
        {shown.map((phrase, index) => {
          const problem = phrase.trim() === "" ? null : phraseProblem(phrase, event);
          const said = problem ? null : fillPhrase(phrase, sample);
          const name = `${label}, phrase ${index + 1}`;
          return (
            <li key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Input
                  ref={(node) => {
                    inputs.current[index] = node;
                  }}
                  value={phrase}
                  onChange={(event) => update(index, event.target.value)}
                  onFocus={() => {
                    focused.current = index;
                  }}
                  maxLength={PHRASE_MAX_LENGTH}
                  aria-label={name}
                  aria-invalid={problem !== null}
                  autoComplete="off"
                  spellCheck
                  className="h-8 bg-background font-mono text-[0.8rem] md:text-[0.8rem]"
                />
                <PreviewButton
                  label={name}
                  disabled={said === null}
                  pending={playing === index}
                  onClick={() => play(index)}
                />
                {shown.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${name}`}
                    onClick={() => onChange(shown.filter((_, position) => position !== index))}
                    className="text-muted-foreground"
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
              {problem ? (
                <p className="text-xs text-destructive">{problem}</p>
              ) : (
                said && <p className="truncate text-xs text-muted-foreground">“{said}”</p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-xs text-muted-foreground">Insert</span>
        {variables.map((variable) => (
          <Tooltip key={variable}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="xs"
                // Keeps the caret in the phrase being written.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insert(variable)}
                className="bg-background font-mono"
              >
                {`{${variable}}`}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{VARIABLE_HINTS[variable]}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <p className="text-xs text-pretty text-muted-foreground">
        {shown.length > 1
          ? "One of them is said at random, among those whose details are known."
          : "Said with the details Stripe knows; a phrase missing one gives way to a default one."}
        {namesHidden &&
          " Customer names are hidden on this screen (see Look): phrases with {name} are skipped."}
      </p>

      <div className="flex flex-wrap gap-2">
        {shown.length < MAX_PHRASES && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...shown, ""])}
            className="bg-background"
          >
            <PlusIcon data-icon="inline-start" />
            Add a variation
          </Button>
        )}
        {phrases !== undefined && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            Reset to default
          </Button>
        )}
      </div>
    </div>
  );
}
