import { getCalendars, getLocales } from "expo-localization";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import type { DemoOptions } from "@/contract/display/demo/options";
import { advanceDemoWorlds, createDemoWorlds, nextDemoWorldsDelay } from "@/contract/display/demo/simulation";
import { demoState } from "@/contract/display/demo/state";
import type { DisplayState } from "@/contract/display/types";
import { isTimeZone, LANGUAGES, type Language } from "@/contract/screens/settings";

/** The web's demo screen, speaking the device's language when screens speak it. */
export function demoOptions(): DemoOptions {
  const language = getLocales()[0]?.languageCode ?? "en";
  const timeZone = getCalendars()[0]?.timeZone ?? "America/New_York";
  return {
    accent: "emerald",
    theme: "dark",
    language: (LANGUAGES as readonly string[]).includes(language) ? (language as Language) : "en",
    soundPack: null,
    voice: { enabled: false, voiceId: null },
    showCustomerNames: true,
    chartRange: "90d",
    metric: "mrr",
    timeZone: isTimeZone(timeZone) ? timeZone : "America/New_York",
    accounts: 1,
    rotation: true,
  };
}

/**
 * The demo screen, live, like the web's `/d/demo`: a year of history generated on the device,
 * then something happens every few seconds. It pauses in the background.
 */
export function useDemoSimulation(options: DemoOptions): DisplayState {
  const [start] = useState(() => {
    const now = new Date();
    const worlds = createDemoWorlds(options, now);
    return { worlds, state: demoState(worlds, now) };
  });
  const [state, setState] = useState(start.state);

  useEffect(() => {
    let worlds = start.worlds;
    let turn = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(() => {
        const now = new Date();
        worlds = advanceDemoWorlds(worlds, turn, now);
        turn += 1;
        setState(demoState(worlds, now));
        schedule();
      }, nextDemoWorldsDelay(worlds, turn));
    };
    schedule();
    const subscription = AppState.addEventListener("change", (next) => {
      clearTimeout(timer);
      if (next === "active") schedule();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [start]);

  return state;
}
