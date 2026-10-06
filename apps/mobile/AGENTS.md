# SaaS Monitor mobile

Companion app of [SaaS Monitor](https://github.com/Synapsr/SaaS-Monitor) (web repo: `../SaaS-Monitor`,
read its `AGENTS.md`): it puts a SaaS Monitor screen everywhere a founder looks, and notifies every
moment (a payment, a new subscriber…).

- **Phone and tablet**: the screens of the app, portrait, and a landscape "TV mode" (kept awake).
- **Widgets**: home screen and lock screen (iOS and Android), StandBy, and **CarPlay**: since iOS 26
  CarPlay shows WidgetKit widgets and Live Activities of any app, no CarPlay entitlement needed.
- **Watches**: an Apple Watch app with complications and Smart Stack widgets; a Wear OS app with a
  tile and complications. Notifications reach both watches by themselves.
- **Notifications**: sent by the SaaS Monitor server for each moment, in the screen's language,
  through APNs and FCM directly or through Expo's push service; each device can mute a screen or
  some of its events. iOS marks them time-sensitive: Siri can announce them in CarPlay and on
  AirPods.
- **Android Auto** shows no dashboards (only media, messaging, navigation, calls, reminders and
  games): out of scope. Never pose as a messaging app to get in.

There is no account in the app. A screen link, `https://<instance>/d/<token>`, is the key: scanned
from its QR code (screen settings, "Open on your phone") or pasted. Any instance works, the hosted
one (https://saas-monitor.com) or a self-hosted one; the same store apps serve them all.

## Layout

- `src/app/` — routes (Expo Router). Other app code lives in `src/`: `src/audio/` plays the
  moments of the screen on display with its sound and voice, when the device asks for it
  (Settings, "Play sounds and voices"), like notification sounds: the ring/silent switch silences
  them, and they mix with other audio. Android plays them in the app only.
- `src/contract/` — the web app's display contract (`DisplayState`…), copied from `../SaaS-Monitor`
  by `scripts/sync-contract.mjs`: never edited by hand.
- `modules/screen-bridge/` — local Expo module handing the app's screens to widgets and watches.
  Its TypeScript API (`setScreens`, `reloadWidgets`, `setNotificationAudio`, `SharedScreen`) is
  the contract between the app and the native code: its Swift side (`ios/`) and Kotlin side
  (`android/`) implement it.
- `targets/` — Apple targets (`@bacons/apple-targets`): `widget/` (WidgetKit: home and lock
  screen, StandBy, CarPlay), `watch/` (watchOS app), `watch-widget/` (complications and Smart
  Stack), `notification-service/` (gives a moment's notification the screen's sound and voice,
  when the device asks for it: "Also when the phone is locked"). `shared/` holds the Swift the
  widgets and the watch share (`Core`: models, networking, display; `Widgets`), linked into them
  by `with-shared-code.js`. They get the screens through the App Group `group.com.saasmonitor.app`.
- `wear/` — the Wear OS app (Kotlin, Compose for Wear OS, Tiles, complications), its own Gradle
  project with the same application id, `com.saasmonitor.app`.
- `plugins/` — config plugins for anything native the app needs beyond Expo's
  (`withAndroidWidgets.ts`: the Glance widgets of `modules/screen-bridge/android`).
- `docs/` — notes, such as why there is no Android Auto app (`android-auto.md`).

## Server API (v1)

Every client (app, widgets, watches) talks to the instance of the screen, `{baseUrl}`:

- `GET {baseUrl}/api/screens/{token}/state` → `200` the screen's `DisplayState` (see
  `src/contract/`), `401 { error }` when it asks for its password, `404 { error }` when the link no
  longer works. A password-protected screen takes the header `X-Screen-Access: {accessProof}`.
  Displays poll it every 10 seconds; widgets as often as their platform lets them.
- `POST {baseUrl}/api/screens/{token}/access` with `{ "password": string }` → `200 { "proof" }`,
  `401 { "error": "wrong-password" }`, `429 { "error": "too-many-attempts" }`, `404`.
- `PUT {baseUrl}/api/screens/{token}/devices` with `{ installationId, platform: "ios" | "android",
  pushToken?: "ExponentPushToken[…]", deviceToken?: string, apnsEnvironment?: "development" |
  "production", locale?: string, enabled?: boolean, mutedEvents?: ScreenEvent[] }` (and
  `X-Screen-Access` if needed) → `200 { "ok": true }`. `installationId` is a UUID the app generates
  once and keeps (secure store); `deviceToken` the native token (APNs on iOS, FCM on Android, from
  `getDevicePushTokenAsync()`), with its `apnsEnvironment` on iOS; at least one of `pushToken` and
  `deviceToken`. `enabled` is the screen's "Notifications on this device" (off for every screen
  while notifications are paused on the device), `mutedEvents` the events this device doesn't
  want. Idempotent: the app sends it on every launch, when screens or choices change, and when a
  token rolls.
- `DELETE {baseUrl}/api/screens/{token}/devices` with `{ installationId }` → `204`.
- What moments play, as the wall display does (`momentAudio`, in `src/contract/display/`):
  `GET {baseUrl}/sounds/{pack}/{event}.wav` (rendered from the wall's sounds),
  `GET {baseUrl}/voices/{voice}/{phrase}.mp3` (recorded phrases), and, for a screen that says its
  own words, `POST {baseUrl}/api/screens/{token}/announcement` with
  `{ "moment": announcement, "format": "wav" }` (and `X-Screen-Access` if needed) → `200` the
  audio, or an error (`404`, `409`, `429`, `502`…) after which the recorded phrase plays.

Notifications come from APNs or FCM directly, or through the Expo push service (which needs no
credentials from the instance), handled alike: `title` and `body` in the screen's language,
`data: { "type": "moment" | "test", "screen": key, "event", "audio"? }` (`test`: "Send a test
celebration" on the dashboard), where `key` is the first 16 hex characters of the SHA-256 of the
screen's token, `event` one of the web app's screen events (`payment`, `connectPayment`,
`subscription`…) and `audio` what the moment plays on the screen's displays (`MomentAudio`; a JSON
string on FCM), when it plays something. iOS notifications are `time-sensitive`, and
`mutable-content` with `audio` (in `body` on APNs, like Expo's); Android ones use the channel
`moments`. Which events notify is the screen's choice: its Events settings, column
"Phone" (`settings.events[event].push`); each device may mute more.

Push needs configuration the app degrades without: an EAS project id for Expo tokens, the APNs
entitlement (`aps-environment`) on iOS, and a Firebase project (`google-services.json`) on Android
for both Expo and native tokens.

## Conventions

- TypeScript strict. Small modules with explicit names; comments explain why, not what.
- UI copy in English, sentence case; what a screen shows speaks the screen's language, like the
  web display (its words come with the contract).
- Design like the wall display: calm and dark-first, near-black surfaces, the screen's accent glow,
  large tabular numbers. Respect reduced motion and Dynamic Type.
- npm (`.npmrc` sets `legacy-peer-deps`). Run `npm run typecheck`, `npm run lint` and `npm test`
  (Jest, `jest-expo`: tests sit next to the code, `*.test.ts`, never in `src/app/`) before calling
  anything done; build what you touch (`npx expo prebuild`, Xcode or Gradle).
- `npm run sync-contract [path/to/SaaS-Monitor]` copies the web's display contract into
  `src/contract/` (`--check` tells when it is stale); commit what it writes. App code imports it
  as `@/contract/…`, and `@/…` is `src/`.
- Commits: Conventional Commits (`feat:`, `fix:`…), no AI attribution or `Co-Authored-By`
  trailers.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
