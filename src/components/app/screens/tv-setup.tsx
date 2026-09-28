import { CopyCode } from "@/components/app/copy-button";

/** Starts Chromium full screen, allowed to play sounds without a click, and without popups. */
export function kioskCommand(url: string): string {
  return `chromium --kiosk --autoplay-policy=no-user-gesture-required --noerrdialogs --disable-infobars --incognito ${url}`;
}

/** How to get a screen onto a TV, shared by the onboarding and the screen editor. */
export function TvSetupSteps({ url }: { url: string }) {
  return (
    <ul className="flex flex-col gap-4 text-sm">
      <li className="flex flex-col gap-1">
        <p className="font-medium">Smart TV, monitor or spare laptop</p>
        <p className="text-pretty text-muted-foreground">
          Open the link in its browser and go full screen (F11 on most computers). Turn off sleep
          mode: the screen updates by itself.
        </p>
      </li>
      <li className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-medium">Raspberry Pi</p>
          <p className="text-pretty text-muted-foreground">
            Start Chromium in kiosk mode. The autoplay flag lets it play sounds without a click.
          </p>
        </div>
        <CopyCode code={kioskCommand(url)} label="kiosk command" />
      </li>
      <li className="flex flex-col gap-1">
        <p className="font-medium">Sound</p>
        <p className="text-pretty text-muted-foreground">
          Browsers mute pages until someone interacts with them: click the screen once. Then send a
          test celebration from the screen settings to hear it.
        </p>
      </li>
    </ul>
  );
}
