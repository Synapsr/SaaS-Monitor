import * as SecureStore from "expo-secure-store";
import { z } from "zod";
import { SCREEN_EVENTS } from "@/contract/display/events";
import { ACCENTS, isCustomAccent, LANGUAGES, THEMES } from "@/contract/screens/settings";
import type { SavedScreen } from "@/screens/types";

/*
 * Screens are credentials: each is kept in the keychain (Keystore on Android), one item per
 * screen, since items may be refused past a couple of kilobytes. Their order is an item of its
 * own, of keys only.
 */

const ORDER_ITEM = "screens.order";
const screenItem = (key: string) => `screen.${key}`;

/** Readable once the device was unlocked after a restart, so background work may read it too. */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const appearanceSchema = z.object({
  theme: z.enum(THEMES),
  accent: z.union([z.enum(ACCENTS), z.string().refine(isCustomAccent)]),
  language: z.enum(LANGUAGES),
});

const savedScreenSchema = z.object({
  key: z.string().regex(/^[0-9a-f]{16}$/),
  baseUrl: z.string().min(1),
  token: z.string().min(1),
  accessProof: z.string().nullable(),
  name: z.string(),
  alias: z.string().nullable().catch(null),
  notify: z.boolean().catch(true),
  mutedEvents: z.array(z.enum(SCREEN_EVENTS)).catch([]),
  // A language or an accent this version doesn't know is only a lost look.
  appearance: appearanceSchema.nullable().catch(null),
  addedAt: z.string(),
});

async function readJson(item: string): Promise<unknown> {
  const value = await SecureStore.getItemAsync(item, OPTIONS);
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function writeJson(item: string, value: unknown): Promise<void> {
  return SecureStore.setItemAsync(item, JSON.stringify(value), OPTIONS);
}

/** The screens of the device, in their order. One that can't be read is left out, not fatal. */
export async function loadScreens(): Promise<SavedScreen[]> {
  const order = z.array(z.string()).safeParse(await readJson(ORDER_ITEM));
  if (!order.success) return [];
  const screens = await Promise.all(
    order.data.map(async (key) => {
      const parsed = savedScreenSchema.safeParse(await readJson(screenItem(key)));
      return parsed.success ? (parsed.data as SavedScreen) : null;
    }),
  );
  return screens.filter((screen): screen is SavedScreen => screen !== null);
}

export function writeScreen(screen: SavedScreen): Promise<void> {
  return writeJson(screenItem(screen.key), screen);
}

export function writeOrder(keys: readonly string[]): Promise<void> {
  return writeJson(ORDER_ITEM, keys);
}

export function deleteScreen(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(screenItem(key), OPTIONS);
}

/** A small value of the app's own (a choice, a flag), validated as it is read. */
export async function readPreference<T>(name: string, schema: z.ZodType<T>): Promise<T | null> {
  const parsed = schema.safeParse(await readJson(`preference.${name}`));
  return parsed.success ? parsed.data : null;
}

export function writePreference(name: string, value: unknown): Promise<void> {
  return writeJson(`preference.${name}`, value);
}
