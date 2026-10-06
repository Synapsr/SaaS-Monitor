import { fetch } from "expo/fetch";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import { cacheName, type ClipSource } from "@/audio/clips";
import type { Clip, ClipLoader } from "@/audio/moment-player";
import { completeWavHeader } from "@/audio/wav";

/*
 * Clips played with expo-audio, from files in the app's cache: sounds and recorded phrases are
 * downloaded once (an instance serves the same files for weeks), the screen's own words each time.
 */

/** A clip that takes longer to load is not worth waiting for: its moment is gone. */
const LOAD_TIMEOUT_MS = 10_000;
/** Files kept this long before they are downloaded again, should the instance have new ones. */
const CACHE_DAYS = 7;
/** For a clip whose player can't tell its length: longer than any phrase. */
const UNKNOWN_DURATION_S = 8;

const directory = new Directory(Paths.cache, "moment-audio");
const downloads = new Map<string, Promise<File>>();
let audioMode: Promise<void> | null = null;
let announcements = 0;

/**
 * Like notification sounds: the ring/silent switch silences them on iPhone, and they mix with
 * what else plays (music, a podcast) rather than stop it. Only while the app is in front.
 */
function setAudioMode(): Promise<void> {
  audioMode ??= setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: "mixWithOthers",
    shouldPlayInBackground: false,
    allowsRecording: false,
  }).catch(() => {
    audioMode = null;
  });
  return audioMode;
}

function cacheDirectory(): Directory {
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

/** The file at `url`, downloaded once. */
function cachedFile(url: string): Promise<File> {
  let download = downloads.get(url);
  if (!download) {
    download = (async () => {
      const file = new File(cacheDirectory(), cacheName(url));
      const age = Date.now() - (file.lastModified ?? 0);
      if (file.exists && age < CACHE_DAYS * 24 * 3_600_000) return file;
      // Downloaded aside, then moved: a failed download never leaves half a file behind.
      const partial = new File(cacheDirectory(), `${file.name}.part`);
      await File.downloadFileAsync(url, partial, { idempotent: true });
      if (file.exists) file.delete();
      await partial.move(file);
      return file;
    })();
    // A failed download may work next time.
    download.catch(() => downloads.delete(url));
    downloads.set(url, download);
  }
  return download;
}

/** What the screen's server says in the screen's own words, in a file of its own. */
async function announcementFile(source: Extract<ClipSource, { kind: "announcement" }>): Promise<File> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);
  try {
    const response = await fetch(source.url, {
      method: "POST",
      headers: source.headers,
      body: source.body,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Announcement: ${response.status}`);
    const file = new File(cacheDirectory(), `announcement-${(announcements += 1)}.wav`);
    file.write(completeWavHeader(new Uint8Array(await response.arrayBuffer())));
    return file;
  } finally {
    clearTimeout(timeout);
  }
}

/** Resolves once the player knows its clip, or rejects. */
function loaded(player: AudioPlayer): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("The clip did not load in time.")), LOAD_TIMEOUT_MS);
    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.isLoaded) finish();
      else if (status.error) finish(new Error(status.error));
    });
    function finish(error?: Error) {
      clearTimeout(timeout);
      subscription.remove();
      if (error) reject(error);
      else resolve();
    }
    if (player.isLoaded) finish();
  });
}

export const expoClips: ClipLoader = {
  async load(source) {
    await setAudioMode();
    const file = source.kind === "file" ? await cachedFile(source.url) : await announcementFile(source);
    const player = createAudioPlayer({ uri: file.uri });
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      player.remove();
      // The screen's own words are said once.
      if (source.kind === "announcement" && file.exists) file.delete();
    };
    try {
      await loaded(player);
    } catch (error) {
      release();
      throw error;
    }
    const clip: Clip = {
      duration: player.duration > 0 ? player.duration : UNKNOWN_DURATION_S,
      play(volume) {
        player.volume = volume;
        player.play();
      },
      release,
    };
    return clip;
  },
};

/** Downloads sounds before their first moment, which they would otherwise be late for. */
export function prefetch(urls: readonly string[]): void {
  for (const url of urls) cachedFile(url).catch(() => {});
}
