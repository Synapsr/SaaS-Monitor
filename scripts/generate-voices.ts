/**
 * Records what voices say without a Gradium API key (`RECORDED_PHRASES`) into
 * `public/voices/<voice>/<phrase>.mp3`, and checks every clip by transcribing it back. Run it
 * after changing a phrase or a voice, with `GRADIUM_API_KEY` in `.env` and ffmpeg installed:
 * `pnpm tsx scripts/generate-voices.ts` (add `--force` to record existing clips again).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Phrase } from "@/lib/voice/announcements";
import { RECORDED_PHRASES } from "@/lib/voice/phrases";
import { VOICES, type Voice } from "@/lib/voice/voices";

if (existsSync(".env")) process.loadEnvFile(".env");
const key = process.env.GRADIUM_API_KEY;
const api = (process.env.GRADIUM_API_URL || "https://api.gradium.ai/api").replace(/\/+$/, "");
if (!key) throw new Error("Set GRADIUM_API_KEY in .env to record the voices.");

const force = process.argv.includes("--force");
const output = path.join("public", "voices");
const scratch = mkdtempSync(path.join(tmpdir(), "voices-"));
/** Takes of a clip at most, until one transcribes back to its phrase. */
const TAKES = 4;
const CONCURRENCY = 4;

async function gradium(route: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${api}${route}`, {
    ...init,
    headers: { "x-api-key": key!, ...init.headers },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${route}: ${response.status} ${await response.text()}`);
  return response;
}

/** A take of the phrase, as Ogg Opus. A low temperature keeps recorded voices steady. */
async function record(voice: Voice, text: string, take: number): Promise<Buffer> {
  const response = await gradium("/post/speech/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice_id: voice.gradiumId,
      output_format: "opus",
      only_audio: true,
      json_config: { temp: 0.3 + take * 0.1 },
    }),
  });
  return Buffer.from(await response.arrayBuffer());
}

function ffmpeg(...args: string[]) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
}

/**
 * Trims the silence around the phrase, keeping a breath before its first sound, and evens out
 * loudness across voices.
 */
function master(take: Buffer, name: string): string {
  const input = path.join(scratch, `${name}.ogg`);
  const output = path.join(scratch, `${name}.wav`);
  writeFileSync(input, take);
  const trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08";
  ffmpeg(
    ...["-i", input, "-af", `${trim},areverse,${trim},areverse,loudnorm=I=-16:TP=-1.5:LRA=11`],
    ...["-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", output],
  );
  return output;
}

/**
 * What Gradium hears in a mastered clip. Speech recognition misses the first word of a phrase
 * that starts right away: a second of silence comes first.
 */
async function transcribe(voice: Voice, clip: string): Promise<string> {
  const padded = clip.replace(/\.wav$/, ".padded.wav");
  ffmpeg(...["-i", clip, "-af", "adelay=1000:all=1", "-c:a", "pcm_s16le", padded]);
  const config = encodeURIComponent(JSON.stringify({ language: voice.language }));
  const response = await gradium(`/post/speech/asr?json_config=${config}`, {
    method: "POST",
    headers: { "Content-Type": "audio/wav" },
    body: new Uint8Array(readFileSync(padded)),
  });
  return (await response.text())
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { type: string; text?: string })
    .filter((message) => message.type === "text")
    .map((message) => message.text)
    .join(" ");
}

/** Words without case, accents or punctuation: what a transcription can be compared on. */
function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .split(" ");
}

/** Share of the phrase's words heard in the transcription. */
function heard(expected: string, transcript: string): number {
  const said = new Set(words(transcript));
  const wanted = words(expected);
  return wanted.filter((word) => said.has(word)).length / wanted.length;
}

async function recordClip(voice: Voice, phrase: Phrase): Promise<string | null> {
  const file = path.join(output, voice.id, `${phrase}.mp3`);
  if (!force && existsSync(file)) return null;
  const text = RECORDED_PHRASES[voice.language][phrase];

  let best: { clip: string; score: number; transcript: string } | null = null;
  for (let take = 0; take < TAKES && (best?.score ?? 0) < 1; take += 1) {
    const clip = master(await record(voice, text, take), `${voice.id}-${phrase}-${take}`);
    const transcript = await transcribe(voice, clip);
    const score = heard(text, transcript);
    if (!best || score > best.score) best = { clip, score, transcript };
  }
  mkdirSync(path.dirname(file), { recursive: true });
  // MP3: every browser decodes it, older kiosks included.
  ffmpeg("-i", best!.clip, "-c:a", "libmp3lame", "-ar", "44100", "-b:a", "64k", file);
  const check = best!.score === 1 ? "ok" : `heard "${best!.transcript}"`;
  return `${voice.id}/${phrase}: ${text} (${check})`;
}

const jobs = VOICES.flatMap((voice) =>
  (Object.keys(RECORDED_PHRASES[voice.language]) as Phrase[]).map((phrase) => ({ voice, phrase })),
);
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const { voice, phrase } = jobs[next++];
      const line = await recordClip(voice, phrase);
      if (line) console.log(line);
    }
  }),
);
rmSync(scratch, { recursive: true, force: true });
