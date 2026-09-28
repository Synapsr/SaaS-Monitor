"use client";

import { ChevronsUpDownIcon, GlobeIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimeZoneOption {
  id: string;
  city: string;
  region: string;
  /** "GMT+2" today. */
  offset: string;
}

/** "America/Argentina/Buenos_Aires" → "America/Argentina/Buenos Aires". */
function formatTimeZone(id: string): string {
  return id.replaceAll("_", " ");
}

function listTimeZones(now: Date): TimeZoneOption[] {
  const ids = Intl.supportedValuesOf("timeZone");
  return (ids.includes("UTC") ? ids : ["UTC", ...ids]).map((id) => {
    const parts = formatTimeZone(id).split("/");
    const offset =
      new Intl.DateTimeFormat("en-US", { timeZone: id, timeZoneName: "shortOffset" })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value ?? "";
    return { id, city: parts.at(-1) ?? id, region: parts.slice(0, -1).join(" / "), offset };
  });
}

/**
 * Plain "contains every word" matching. cmdk's default fuzzy scoring suits commands, not places:
 * it would rank "Monticello" (America / Kentucky) above "Tokyo" for "tokyo".
 */
function matchesEveryWord(value: string, search: string, keywords?: string[]): number {
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => haystack.includes(word)) ? 1 : 0;
}

export function TimeZonePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (timeZone: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between px-2.5 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <GlobeIcon className="text-muted-foreground" />
            <span className="truncate">{formatTimeZone(value)}</span>
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-72 p-0">
        <TimeZoneList
          value={value}
          onSelect={(timeZone) => {
            onChange(timeZone);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Only rendered while the popover is open: formatting 400+ offsets is not free. */
function TimeZoneList({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (timeZone: string) => void;
}) {
  const zones = useMemo(() => listTimeZones(new Date()), []);
  const regions = useMemo(() => {
    const groups = new Map<string, TimeZoneOption[]>();
    for (const zone of zones) {
      const region = zone.region || "Other";
      groups.set(region, [...(groups.get(region) ?? []), zone]);
    }
    return [...groups];
  }, [zones]);
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const suggested = zones.filter((zone) => zone.id === value || zone.id === local);

  const item = (zone: TimeZoneOption, key: string) => (
    <CommandItem
      key={key}
      value={key}
      keywords={[zone.city, zone.region, zone.offset, zone.id]}
      data-checked={zone.id === value}
      onSelect={() => onSelect(zone.id)}
    >
      <span className="flex-1 truncate">
        {zone.city}
        {zone.id === local && <span className="text-xs text-muted-foreground"> · this device</span>}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">{zone.offset}</span>
    </CommandItem>
  );

  return (
    <Command filter={matchesEveryWord}>
      <CommandInput placeholder="Search a city or time zone…" />
      <CommandList className="max-h-80">
        <CommandEmpty>No time zone found.</CommandEmpty>
        <CommandGroup heading="Suggested">
          {suggested.map((zone) => item(zone, `suggested ${zone.id}`))}
        </CommandGroup>
        {regions.map(([region, regionZones]) => (
          <CommandGroup key={region} heading={region}>
            {regionZones.map((zone) => item(zone, zone.id))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
