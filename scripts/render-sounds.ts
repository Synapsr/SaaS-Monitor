/**
 * Renders every sound of every pack to `public/sounds/<pack>/<event>.mp3`, the downloads of
 * `/stripe-notification-sound`. Run it after changing a sound (`src/lib/sounds`).
 *
 * Screens synthesize their sounds with the Web Audio API, which Node lacks: the synth runs in
 * Chromium, through an OfflineAudioContext and the master chain screens use, then ffmpeg encodes
 * the result. Randomness (noise, the reverb's room) is seeded per file, so a sound keeps its
 * character from one render to the next.
 *
 * Playwright is not a dependency of the project: install playwright-core and its Chromium
 * anywhere, point PLAYWRIGHT_CORE at it, and have ffmpeg installed:
 *
 *   npm install --prefix /tmp/render-sounds playwright-core
 *   npx --prefix /tmp/render-sounds playwright-core install chromium
 *   PLAYWRIGHT_CORE=/tmp/render-sounds/node_modules/playwright-core pnpm tsx scripts/render-sounds.ts
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { SOUND_FILES } from "@/lib/marketing/sound-files";

/** Longer than the longest sound and its reverb tail (the screens' `SOUND_LIFETIME_MS`). */
const RENDER_SECONDS = 6;
const SAMPLE_RATE = 48_000;
/** Below this, the tail is inaudible and is cut, after a short fade. */
const SILENCE_DB = -66;
/** Loudest peak of all files: the relative levels of the sounds stay as screens play them. */
const PEAK_DB = -1;
/** What the page promises: small enough for any phone or notification tool. */
const MAX_FILE_BYTES = 100_000;
const ORIGIN = "https://render.local";

interface Playwright {
  chromium: {
    launch(): Promise<{
      newPage(): Promise<{
        route(url: string, handler: (route: Route) => Promise<void>): Promise<void>;
        goto(url: string): Promise<unknown>;
        waitForFunction(expression: string): Promise<unknown>;
        evaluate<T, A>(script: (argument: A) => Promise<T>, argument: A): Promise<T>;
      }>;
      close(): Promise<void>;
    }>;
  };
}

interface Route {
  request(): { url(): string };
  fulfill(response: { status?: number; contentType?: string; body: string }): Promise<void>;
}

async function loadPlaywright(): Promise<Playwright> {
  const require = createRequire(import.meta.url);
  const location = process.env.PLAYWRIGHT_CORE;
  try {
    const entry = location
      ? require.resolve(path.resolve(location))
      : require.resolve("playwright-core");
    const imported = await import(pathToFileURL(entry).href);
    return (imported.default ?? imported) as Playwright;
  } catch {
    throw new Error(
      "playwright-core not found: install it and set PLAYWRIGHT_CORE (see the top of this script).",
    );
  }
}

/** The synth's sources as browser modules, served under `@/`: `@/lib/sounds/synth` and so on. */
function browserModule(specifier: string): string | null {
  const base = path.join("src", specifier.replace(/^\/src\//, ""));
  for (const candidate of [`${base}.ts`, path.join(base, "index.ts")]) {
    try {
      const source = readFileSync(candidate, "utf8");
      return ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
    } catch {
      // Not this one: try the folder's index.
    }
  }
  return null;
}

/**
 * The page that renders: an import map for `@/`, a seeded `Math.random`, and `render()`, which
 * plays one sound into an offline context and returns it as a 16-bit WAV, in base64.
 */
const PAGE = `<!doctype html>
<script type="importmap">{ "imports": { "@/": "/src/" } }</script>
<script>
  // mulberry32: small, fast and good enough for noise.
  window.seed = (value) => {
    let state = value >>> 0;
    Math.random = () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
</script>
<script type="module">
  import { SOUND_RECIPES } from "@/lib/sounds/packs";
  import { createMasterChain } from "@/lib/sounds/graph";

  window.render = async ({ pack, event, seconds, sampleRate, seed }) => {
    window.seed(seed);
    const context = new OfflineAudioContext(2, seconds * sampleRate, sampleRate);
    const { input, reverb } = createMasterChain(context);
    SOUND_RECIPES[pack][event]({ context, output: input, reverb }, 0.01);
    const buffer = await context.startRendering();
    // Base64 of the raw floats: far lighter to send back than arrays of numbers.
    return Array.from({ length: buffer.numberOfChannels }, (_, channel) => {
      const bytes = new Uint8Array(buffer.getChannelData(channel).buffer);
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      }
      return btoa(binary);
    });
  };
  window.ready = true;
</script>`;

/** A stable seed per file: renders do not depend on the order of the files. */
function seedOf(text: string): number {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function wav(channels: Float32Array[], sampleRate: number): Buffer {
  const frames = channels[0].length;
  const data = Buffer.alloc(frames * channels.length * 2);
  for (let frame = 0; frame < frames; frame += 1) {
    channels.forEach((samples, channel) => {
      const value = Math.max(-1, Math.min(1, samples[frame]));
      data.writeInt16LE(Math.round(value * 32767), (frame * channels.length + channel) * 2);
    });
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels.length, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels.length * 2, 28);
  header.writeUInt16LE(channels.length * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function floats(base64: string): Float32Array {
  const bytes = Buffer.from(base64, "base64");
  // Copied: a Float32Array needs an aligned buffer of its own.
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
}

/** Cuts the inaudible end of the tail, with a 20 ms fade so the cut makes no click. */
function trim(channels: Float32Array[], sampleRate: number): Float32Array[] {
  const threshold = 10 ** (SILENCE_DB / 20);
  let end = 0;
  for (const samples of channels) {
    for (let index = samples.length - 1; index > end; index -= 1) {
      if (Math.abs(samples[index]) > threshold) {
        end = index;
        break;
      }
    }
  }
  const fade = Math.round(sampleRate * 0.02);
  const length = Math.min(channels[0].length, end + fade);
  return channels.map((samples) => {
    const trimmed = samples.slice(0, length);
    for (let index = 0; index < fade; index += 1) {
      trimmed[length - 1 - index] *= index / fade;
    }
    return trimmed;
  });
}

function peak(channels: Float32Array[]): number {
  let loudest = 0;
  for (const samples of channels) {
    for (const sample of samples) loudest = Math.max(loudest, Math.abs(sample));
  }
  return loudest;
}

const playwright = await loadPlaywright();
const browser = await playwright.chromium.launch();
const scratch = mkdtempSync(path.join(tmpdir(), "sounds-"));
try {
  const page = await browser.newPage();
  await page.route(`${ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/") {
      await route.fulfill({ contentType: "text/html", body: PAGE });
      return;
    }
    const code = browserModule(pathname);
    await route.fulfill(
      code === null
        ? { status: 404, body: `No module at ${pathname}` }
        : { contentType: "text/javascript", body: code },
    );
  });
  await page.goto(`${ORIGIN}/`);
  await page.waitForFunction("window.ready === true");

  const renders = [];
  for (const file of SOUND_FILES) {
    const channels = await page.evaluate(
      (options) =>
        (window as unknown as { render(o: typeof options): Promise<string[]> }).render(options),
      {
        pack: file.pack,
        event: file.event,
        seconds: RENDER_SECONDS,
        sampleRate: SAMPLE_RATE,
        seed: seedOf(file.url),
      },
    );
    renders.push({ file, channels: trim(channels.map(floats), SAMPLE_RATE) });
  }

  const gain = 10 ** (PEAK_DB / 20) / Math.max(...renders.map(({ channels }) => peak(channels)));
  for (const { file, channels } of renders) {
    const input = path.join(scratch, `${file.pack}-${file.event}.wav`);
    writeFileSync(
      input,
      wav(
        channels.map((samples) => samples.map((sample) => sample * gain)),
        SAMPLE_RATE,
      ),
    );
    const output = path.join("public", file.url);
    mkdirSync(path.dirname(output), { recursive: true });
    execFileSync("ffmpeg", [
      ...["-hide_banner", "-loglevel", "error", "-y", "-i", input],
      ...["-codec:a", "libmp3lame", "-b:a", "128k"],
      // No encoder version or date in the file: it only describes the sound.
      ...["-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact"],
      ...["-metadata", `title=${file.title}`, "-metadata", "artist=SaaS Monitor"],
      output,
    ]);
    const bytes = statSync(output).size;
    if (bytes > MAX_FILE_BYTES)
      throw new Error(`${output} is ${bytes} bytes, over ${MAX_FILE_BYTES}`);
    console.log(`${output}  ${(channels[0].length / SAMPLE_RATE).toFixed(2)} s  ${bytes} bytes`);
  }
} finally {
  await browser.close();
  rmSync(scratch, { recursive: true, force: true });
}
