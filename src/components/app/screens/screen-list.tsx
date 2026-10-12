import type { DisplayState } from "@/lib/display/types";
import { cn } from "@/lib/utils";
import type { Screen } from "@/server/screens";
import { ScreenCard } from "./screen-card";
import { screenTags } from "./screen-tags";
import { screenUrl } from "./screen-url";

/**
 * The screens of a workspace, as a gallery of their previews: a wall is recognized by its look
 * and its numbers before its name. A single screen spreads out instead of sitting alone in a
 * column; two or four fill two columns rather than leave a gap in three.
 */
export function ScreenList({
  screens,
  states,
  appUrl,
}: {
  screens: Screen[];
  /** `loadDisplayStates(screens)`. */
  states: ReadonlyMap<string, Promise<DisplayState | null>>;
  appUrl: string;
}) {
  const settings = screens.map((screen) => screen.settings);
  const card = (screen: Screen) => (
    <ScreenCard
      screen={screen}
      url={screenUrl(appUrl, screen.publicToken)}
      state={states.get(screen.id)}
      tags={screenTags(screen.settings, settings)}
      wide={screens.length === 1}
    />
  );

  if (screens.length === 1) return card(screens[0]);
  const columns = screens.length === 2 || screens.length === 4 ? 2 : 3;
  return (
    // Explicit columns: an implicit one would grow to the longest line of a card, past the page.
    <ul className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3")}>
      {screens.map((screen) => (
        <li key={screen.id} className="flex">
          {card(screen)}
        </li>
      ))}
    </ul>
  );
}
