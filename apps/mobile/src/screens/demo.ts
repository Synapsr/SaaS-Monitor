import { DEMO_TOKEN } from "@/contract/display/demo/business";
import { parseScreenLink, type ScreenLink } from "@/screens/link";

/*
 * `/d/demo` on an instance is a screen of simulated data, a sample company whose payments and
 * subscribers keep coming, which its screen API serves like any screen's.
 */

/** The hosted instance's demo screen, the one the app offers: no account, no Stripe. */
export const HOSTED_DEMO: ScreenLink = { baseUrl: "https://saas-monitor.com", token: DEMO_TOKEN };

/**
 * The demo screen the app adds. `EXPO_PUBLIC_DEMO_URL`, read when the app is bundled, points it
 * at another instance's (`http://localhost:3000/d/demo`), to try a change of the web first.
 */
export function demoLink(override: string | undefined = process.env.EXPO_PUBLIC_DEMO_URL): ScreenLink {
  const link = override ? parseScreenLink(override) : null;
  return link?.token === DEMO_TOKEN ? link : HOSTED_DEMO;
}

/** Whether a screen is an instance's demo screen, whatever instance it comes from. */
export function isDemoScreen(screen: Pick<ScreenLink, "token">): boolean {
  return screen.token === DEMO_TOKEN;
}
