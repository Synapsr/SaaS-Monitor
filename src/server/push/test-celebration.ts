import "server-only";
import { displayLocale } from "@/lib/display/i18n";
import { momentAudio } from "@/lib/display/moment-audio";
import type { Moment } from "@/lib/display/moments";
import type { ScreenSettings } from "@/lib/screens/settings";
import { speaksOwnPhrases } from "@/server/voice/own-phrases";
import { screenKey } from "./content";
import { forgetTokens, screenDevices } from "./devices";
import { deliveries, type Notice } from "./messages";
import { defaultTransports, deliver, type PushTransports } from "./transports";

export interface TestPushOptions {
  /** How notifications reach phones: this instance's, or fakes in tests. */
  transports?: Partial<PushTransports>;
}

/**
 * Notifies every phone following the screen that "Send a test celebration" was clicked, so the
 * founder can check notifications end to end, on phones and the watches they reach. The founder
 * asked for it: events a phone muted don't matter, a phone that turned the screen off does.
 * `testEventId` is the screen's `DisplayState.testEvent`: the test plays as the screen's displays
 * play it, with the same sound and voice. Returns how many phones were notified. Best effort:
 * never throws.
 */
export async function notifyTestCelebration(
  screen: { id: string; token: string; settings: ScreenSettings; testEventId: string },
  { transports }: TestPushOptions = {},
): Promise<number> {
  try {
    const devices = (await screenDevices([screen.id])).get(screen.id) ?? [];
    if (!devices.length) return 0;
    const { settings } = screen;
    const { text } = displayLocale(settings.language);
    // The moment the screen's displays play (`trackMoments`).
    const moment: Moment = { id: `test:${screen.testEventId}`, kind: "test" };
    const audio = momentAudio(moment, settings, speaksOwnPhrases(settings));
    const test: Notice = {
      key: "test",
      screen: screenKey(screen.token),
      // What a test celebration plays on the screen: a payment.
      events: ["payment"],
      type: "test",
      title: text.moments.test,
      body: text.moments.testDetails,
      ...(audio && { audio }),
    };
    const everyEvent = devices.map((device) => ({ ...device, mutedEvents: [] }));
    const sent = deliveries([
      { devices: everyEvent, moments: [test], summary: null, milestones: [] },
    ]);
    const report = await deliver(sent, { ...defaultTransports(), ...transports });
    await forgetTokens(report);
    return report.sent;
  } catch (error) {
    console.warn(
      `[push] screen=${screen.id} could not send the test notification:`,
      error instanceof Error ? error.message : error,
    );
    return 0;
  }
}
