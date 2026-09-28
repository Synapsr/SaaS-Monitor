import type { SoundPack } from "@/lib/screens/settings";
import type { SoundEvent } from "@/lib/sounds";
import { arcade } from "@/lib/sounds/packs/arcade";
import { chime } from "@/lib/sounds/packs/chime";
import { register } from "@/lib/sounds/packs/register";
import type { Voice } from "@/lib/sounds/synth";

/** Schedules a sound starting at `at` (seconds on the audio context's clock). */
export type SoundRecipe = (voice: Voice, at: number) => void;

export type SoundPackRecipes = Record<SoundEvent, SoundRecipe>;

export const SOUND_RECIPES: Record<SoundPack, SoundPackRecipes> = { register, chime, arcade };
