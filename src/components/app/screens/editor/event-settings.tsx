"use client";

import {
  ListIcon,
  RectangleHorizontalIcon,
  SmartphoneIcon,
  SpeechIcon,
  Volume2Icon,
  type LucideIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_EVENTS, type Channel, type ScreenEvent } from "@/lib/display/events";
import { recurringMetric } from "@/lib/display/metric";
import type { Metric, ScreenSettings, SoundPack } from "@/lib/screens/settings";
import { playSound, unlockAudio, type SoundEvent } from "@/lib/sounds";
import { recordedClipUrl } from "@/lib/voice/moment-speech";
import { recordedClip, speak } from "@/lib/voice/player";
import type { Voice } from "@/lib/voice/voices";
import { cn } from "@/lib/utils";
import { EVENT_OPTIONS } from "./event-labels";

type Events = ScreenSettings["events"];

const COLUMNS: { channel: Channel; label: string; hint: string; icon: LucideIcon }[] = [
  {
    channel: "feed",
    label: "Feed",
    hint: "Listed in the activity feed, on the side of the screen",
    icon: ListIcon,
  },
  {
    channel: "moment",
    label: "Card",
    hint: "A card in the middle of the screen, or the whole screen for a milestone",
    icon: RectangleHorizontalIcon,
  },
  { channel: "sound", label: "Sound", hint: "Its sound, from the sound pack", icon: Volume2Icon },
  { channel: "voice", label: "Voice", hint: "Said out loud by the voice", icon: SpeechIcon },
  {
    channel: "push",
    label: "Phone",
    hint: "A notification on the phones that follow this screen with the SaaS Monitor app",
    icon: SmartphoneIcon,
  },
];

/** One column per channel, narrower on phones so that event names keep some room. */
const GRID =
  "grid grid-cols-[minmax(0,1fr)_repeat(5,2.75rem)] sm:grid-cols-[minmax(0,1fr)_repeat(5,4rem)]";

/** What checking a sound plays: most subscriptions start and grow with a payment. */
const PREVIEW_SOUNDS: Record<ScreenEvent, SoundEvent> = {
  payment: "payment",
  connectPayment: "payment",
  subscription: "payment",
  upgrade: "mrrUp",
  reactivation: "mrrUp",
  downgrade: "mrrDown",
  cancellation: "mrrDown",
  unpaid: "mrrDown",
  customer: "customer",
  milestone: "milestone",
};

/** What the screen can play when a box is checked, to hear what was just chosen. */
export interface EventPreviews {
  sound: { pack: SoundPack; volume: number } | null;
  voice: { voice: Voice; volume: number } | null;
}

/**
 * Each event of the screen and where it goes: listed in the feed, shown as a card, heard, said,
 * and sent to the phones following the screen. Every box is its own choice: a payment may ring
 * without a card, a Connect payment stay off the feed. Sound and voice only play once turned on in
 * their own sections.
 */
export function EventSettings({
  events,
  metric,
  soundOn,
  voiceOn,
  previews,
  onChange,
}: {
  events: Events;
  metric: Metric;
  soundOn: boolean;
  /** The voice is on, and speaks the screen's language. */
  voiceOn: boolean;
  previews: EventPreviews;
  onChange: (events: Events) => void;
}) {
  const metricLabel = recurringMetric(metric).label;

  function toggle(event: ScreenEvent, channel: Channel, checked: boolean) {
    onChange({ ...events, [event]: { ...events[event], [channel]: checked } });
    if (!checked) return;
    // Checking a sound or a voice lets you hear it at once, from the click.
    if (channel === "sound" && previews.sound) {
      const { pack, volume } = previews.sound;
      void unlockAudio().then(() => playSound(PREVIEW_SOUNDS[event], { pack, volume }));
    }
    if (channel === "voice" && previews.voice) {
      const { voice, volume } = previews.voice;
      void unlockAudio().then(() =>
        speak(recordedClip(recordedClipUrl(voice.id, event)), { volume, delayMs: 0 }),
      );
    }
  }

  const off = [!soundOn && "sound", !voiceOn && "the voice"].filter(Boolean).join(" and ");
  return (
    <div className="flex flex-col gap-3">
      <div role="table" aria-label="Events" className="flex flex-col rounded-lg ring-1 ring-border">
        <div role="row" className={cn(GRID, "items-end border-b px-3 py-2")}>
          {/* Takes the label column's place: only screen readers read it. */}
          <span role="columnheader">
            <span className="sr-only">Event</span>
          </span>
          {COLUMNS.map(({ channel, label, hint, icon: Icon }) => {
            const muted = (channel === "sound" && !soundOn) || (channel === "voice" && !voiceOn);
            return (
              <Tooltip key={channel}>
                <TooltipTrigger asChild>
                  <span
                    role="columnheader"
                    tabIndex={0}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-sm text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      muted ? "text-muted-foreground/60" : "text-muted-foreground",
                    )}
                  >
                    <Icon aria-hidden className="size-4" />
                    {label}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{muted ? `${hint}. Off for now.` : hint}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {SCREEN_EVENTS.map((event) => {
          const { label: labelFor, description, icon: Icon } = EVENT_OPTIONS[event];
          const label = labelFor(metricLabel);
          return (
            <div
              key={event}
              role="row"
              className={cn(GRID, "items-center px-3 py-2.5 not-last:border-b")}
            >
              <div role="rowheader" className="flex min-w-0 items-start gap-2.5">
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="hidden text-xs text-pretty text-muted-foreground sm:block">
                    {description}
                  </span>
                </div>
              </div>
              {COLUMNS.map(({ channel, label: column }) => (
                <div role="cell" key={channel} className="grid place-items-center">
                  {event === "milestone" && channel === "feed" ? (
                    // A milestone is a moment of its own: the feed lists what customers do.
                    <span
                      aria-label="Milestones are not listed in the feed"
                      className="text-muted-foreground"
                    >
                      –
                    </span>
                  ) : (
                    <Checkbox
                      checked={events[event][channel]}
                      onCheckedChange={(checked) => toggle(event, channel, checked === true)}
                      aria-label={`${column}: ${label}`}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {off && (
        <p className="text-sm text-pretty text-muted-foreground">
          {`Turn on ${off} below to hear the events checked here.`}
        </p>
      )}
    </div>
  );
}
