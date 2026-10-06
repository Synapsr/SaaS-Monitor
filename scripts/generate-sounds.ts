/**
 * Renders the sounds of every pack (`src/lib/sounds/packs`) into
 * `public/sounds/<pack>/<event>.wav`, for what plays them without Web Audio: the SaaS Monitor app,
 * and the notifications it plays on a locked phone. Run it after changing a sound or a pack, with
 * Google Chrome installed (or `CHROME_PATH` set to a Chrome or Chromium):
 * `pnpm tsx scripts/generate-sounds.ts`.
 *
 * Sounds are rendered by Chrome, offline (`scripts/sound-page.ts`): the engine of most wall
 * displays, whose compressor other Web Audio implementations only approximate. Noise comes from a
 * generator seeded with the sound's name, and Chrome renders a sound the same way every time, to
 * the last bit of a few samples: a file is written again only when its sound changed.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "esbuild";
import { SOUND_PACKS } from "@/lib/screens/settings";
import type { SoundEvent } from "@/lib/sounds";
import { SOUND_RECIPES } from "@/lib/sounds/packs";
import type { SoundRendering } from "./sound-page";

/** CD quality: bells keep their partials (up to 12 kHz), and every phone plays it as is. */
const SAMPLE_RATE = 44_100;
/** Longer than any sound and its reverb tail (`SOUND_LIFETIME_MS`). */
const RENDER_SECONDS = 6;
/** Below this, the tail of the room is inaudible: the file ends there (-66 dBFS). */
const SILENCE = 10 ** (-66 / 20);
/** A short fade at the very end, so that the cut never clicks. */
const FADE_SECONDS = 0.02;

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

const output = path.join("public", "sounds");

/** A seed of the sound's name: the same noise every time, another noise for each sound. */
function seedOf(name: string): number {
  let hash = 2_166_136_261;
  for (const character of name) hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619);
  return hash >>> 0;
}

/** The page's code: the sound recipes, the display's chain, and `renderSound`. */
async function pageScript(): Promise<string> {
  const result = await build({
    entryPoints: [path.join("scripts", "sound-page.ts")],
    bundle: true,
    write: false,
    format: "iife",
    alias: { "@": path.resolve("src") },
    logLevel: "warning",
  });
  return result.outputFiles[0].text;
}

/** A headless Chrome and its first tab, driven through the DevTools protocol. */
async function openChrome() {
  const executable =
    process.env.CHROME_PATH ?? CHROME_PATHS.find((candidate) => existsSync(candidate));
  if (!executable)
    throw new Error("Install Google Chrome, or set CHROME_PATH to Chrome or Chromium.");
  const profile = mkdtempSync(path.join(tmpdir(), "sounds-"));
  const chrome = spawn(
    executable,
    ["--headless", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run"],
    { stdio: "ignore" },
  );
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  const close = async () => {
    chrome.kill();
    // Chrome writes to its profile until it exits.
    await exited;
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  };

  try {
    // Chrome writes the port it chose in its profile.
    const portFile = path.join(profile, "DevToolsActivePort");
    for (let attempt = 0; !existsSync(portFile); attempt += 1) {
      if (attempt > 100) throw new Error("Chrome did not start.");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const [port] = readFileSync(portFile, "utf8").split("\n");
    const origin = `http://127.0.0.1:${port}`;
    const { Browser: version } = (await (await fetch(`${origin}/json/version`)).json()) as {
      Browser: string;
    };
    const tabs = (await (await fetch(`${origin}/json/list`)).json()) as {
      type: string;
      webSocketDebuggerUrl: string;
    }[];
    const tab = tabs.find((candidate) => candidate.type === "page");
    if (!tab) throw new Error("Chrome opened no tab.");

    const socket = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve);
      socket.addEventListener("error", reject);
    });
    const answers = new Map<number, (message: unknown) => void>();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as { id?: number };
      if (message.id !== undefined) answers.get(message.id)?.(message);
    });
    let lastId = 0;

    /** Evaluates `expression` in the tab, awaiting it, and returns its value. */
    async function evaluate<T>(expression: string): Promise<T> {
      const id = ++lastId;
      const answer = new Promise<unknown>((resolve) => answers.set(id, resolve));
      const params = { expression, awaitPromise: true, returnByValue: true };
      socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params }));
      const { result } = (await answer) as {
        result: {
          result: { value: T };
          exceptionDetails?: { exception?: { description?: string } };
        };
      };
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description ?? "Evaluation failed.");
      }
      return result.result.value;
    }

    return {
      version,
      evaluate,
      close: () => {
        socket.close();
        return close();
      },
    };
  } catch (error) {
    await close();
    throw error;
  }
}

/** Cuts the inaudible end of the room's tail, with a short fade. */
function trim(samples: Float32Array): Float32Array {
  let end = samples.length;
  while (end > 0 && Math.abs(samples[end - 1]) < SILENCE) end -= 1;
  const fade = Math.round(FADE_SECONDS * SAMPLE_RATE);
  const trimmed = samples.slice(0, Math.min(samples.length, end + fade));
  for (let index = 0; index < fade && index < trimmed.length; index += 1) {
    trimmed[trimmed.length - 1 - index] *= index / fade;
  }
  return trimmed;
}

/** A WAV file: mono, 16-bit linear PCM, which every player and iOS notifications read. */
function wav(samples: Float32Array): Buffer {
  const data = samples.length * 2;
  const file = Buffer.alloc(44 + data);
  file.write("RIFF", 0, "ascii");
  file.writeUInt32LE(36 + data, 4);
  file.write("WAVE", 8, "ascii");
  file.write("fmt ", 12, "ascii");
  file.writeUInt32LE(16, 16);
  file.writeUInt16LE(1, 20); // Linear PCM.
  file.writeUInt16LE(1, 22); // Mono.
  file.writeUInt32LE(SAMPLE_RATE, 24);
  file.writeUInt32LE(SAMPLE_RATE * 2, 28);
  file.writeUInt16LE(2, 32);
  file.writeUInt16LE(16, 34);
  file.write("data", 36, "ascii");
  file.writeUInt32LE(data, 40);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    file.writeInt16LE(Math.round(clamped * 32_767), 44 + index * 2);
  });
  return file;
}

/** Whether a file holds this very sound: rendering again may move a few samples by one bit. */
function holds(file: string, contents: Buffer): boolean {
  if (!existsSync(file)) return false;
  const existing = readFileSync(file);
  if (existing.length !== contents.length) return false;
  for (let offset = 44; offset < contents.length; offset += 2) {
    if (Math.abs(existing.readInt16LE(offset) - contents.readInt16LE(offset)) > 1) return false;
  }
  return true;
}

function decibels(amplitude: number): string {
  return amplitude > 0 ? `${(20 * Math.log10(amplitude)).toFixed(1)} dBFS` : "silent";
}

const chrome = await openChrome();
try {
  await chrome.evaluate(await pageScript());
  console.log(`Rendering with ${chrome.version}`);
  for (const pack of SOUND_PACKS) {
    // Every event of the pack: recipes are typed to have them all.
    for (const event of Object.keys(SOUND_RECIPES[pack]) as SoundEvent[]) {
      const rendering: SoundRendering = {
        pack,
        event,
        seed: seedOf(`${pack}/${event}`),
        sampleRate: SAMPLE_RATE,
        seconds: RENDER_SECONDS,
      };
      const encoded = await chrome.evaluate<string>(`renderSound(${JSON.stringify(rendering)})`);
      // Copied: a Float32Array needs its own, aligned buffer.
      const bytes = Uint8Array.from(Buffer.from(encoded, "base64"));
      const samples = trim(new Float32Array(bytes.buffer));

      const file = path.join(output, pack, `${event}.wav`);
      mkdirSync(path.dirname(file), { recursive: true });
      const contents = wav(samples);
      const unchanged = holds(file, contents);
      if (!unchanged) writeFileSync(file, contents);
      const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
      const power = samples.reduce((sum, sample) => sum + sample ** 2, 0) / samples.length;
      console.log(
        `${pack}/${event}: ${(samples.length / SAMPLE_RATE).toFixed(2)} s, peak ${decibels(peak)},`,
        `RMS ${decibels(Math.sqrt(power))}, ${Math.round(contents.length / 1024)} KB`,
        unchanged ? "(unchanged)" : "",
      );
    }
  }
} finally {
  await chrome.close();
}
