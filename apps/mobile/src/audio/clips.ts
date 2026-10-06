import { announcementUrl, soundClipUrl, type MomentAudio } from "@/contract/display/moment-audio";
import { recordedClipUrl } from "@/contract/voice/moment-speech";
import type { AnnouncementRequest } from "@/contract/voice/request";
import type { ScreenAccess } from "@/screens/api";

type Sound = NonNullable<MomentAudio["sound"]>;
type Voice = NonNullable<MomentAudio["voice"]>;

/**
 * Where a clip comes from: a file every instance serves (the sounds rendered from the wall's own,
 * the recorded phrases of voices), or what a screen's server says in the screen's own words.
 */
export type ClipSource =
  | { kind: "file"; url: string }
  | { kind: "announcement"; url: string; headers: Record<string, string>; body: string };

export function soundSource({ baseUrl }: ScreenAccess, { pack, event }: Sound): ClipSource {
  return { kind: "file", url: `${baseUrl}${soundClipUrl(pack, event)}` };
}

export function recordedSpeechSource({ baseUrl }: ScreenAccess, { id, phrase }: Voice): ClipSource {
  return { kind: "file", url: `${baseUrl}${recordedClipUrl(id, phrase)}` };
}

/**
 * The screen's own words for the moment, on a screen that says them; `null` otherwise. WAV:
 * the phone's players don't read Ogg Opus.
 */
export function announcementSource(access: ScreenAccess, { announcement }: Voice): ClipSource | null {
  if (announcement === null) return null;
  const body: AnnouncementRequest = { moment: announcement, format: "wav" };
  return {
    kind: "announcement",
    url: `${access.baseUrl}${announcementUrl(access.token)}`,
    headers: {
      "content-type": "application/json",
      ...(access.accessProof ? { "x-screen-access": access.accessProof } : {}),
    },
    body: JSON.stringify(body),
  };
}

/**
 * The name of a file downloaded from `url` in the app's cache: the same for the same URL, with
 * its extension, which players read the format from.
 */
export function cacheName(url: string): string {
  // FNV-1a, twice with different offsets: 64 bits are plenty for a few dozen files.
  const hash = (offset: number) => {
    let value = offset;
    for (let index = 0; index < url.length; index += 1) {
      value = Math.imul(value ^ url.charCodeAt(index), 16_777_619);
    }
    return (value >>> 0).toString(16).padStart(8, "0");
  };
  // Not `URL`: React Native's leaves out the path.
  const extension = /\.([a-z0-9]{1,4})(?:[?#].*)?$/i.exec(url)?.[1]?.toLowerCase() ?? "bin";
  return `${hash(0x811c9dc5)}${hash(0x5bd1e995)}.${extension}`;
}
