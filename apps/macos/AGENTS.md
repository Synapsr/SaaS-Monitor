# SaaS Monitor for Mac

A SaaS Monitor screen around the MacBook's notch, as the Dynamic Island does on iPhone: the
selected screen's curve and number beside the notch, its moments dropping from it with their sound
and voice, the screen itself while the pointer rests on the notch. Screens without a notch get a
virtual one in the middle of the menu bar. A menu bar app without a Dock icon (SwiftUI and AppKit,
macOS 15+, sandboxed), bundle id `com.saasmonitor.mac`.

Read `../mobile/AGENTS.md` first: the Mac app talks to instances with the same server API (v1),
opens screens from the same links (and the demo screen), and compiles the Swift that the widgets
and the watch share, `../mobile/targets/shared/Core`, with a stand-in for their App Group
(`SaaSMonitor/Platform/AppGroup.swift`): its screens in its own defaults, their last states in its
own container.

## Layout

- `SaaSMonitor/App/` — the app: its menu bar menu, its windows (settings, adding a screen), what
  wires the rest together (`AppDelegate`), and `NotchPreview`, debug builds' fixed looks.
- `SaaSMonitor/Notch/` — the notch: `NotchLayout` reads the hardware notch from `NSScreen` and
  sizes each look (`NotchPresentation`), `NotchPanel` is the window over the menu bar,
  `NotchController` opens it when the pointer rests on it and lets clicks through elsewhere, the
  views draw each look.
- `SaaSMonitor/Screens/` — screen links (`ScreenLink`, the rules of the mobile app's
  `src/screens/link.ts`), passwords, the screens added, and following them every 10 seconds as
  walls do (`ScreenMonitor`).
- `SaaSMonitor/Moments/` — one moment after the other in the notch, each once whichever screens
  report it.
- `SaaSMonitor/Audio/` — `MomentAudio` is the web's `momentAudio`
  (`src/lib/display/moment-audio.ts`): keep them in step. `MomentPlayer` plays the files every
  instance serves.
- `SaaSMonitor/Settings/` — the app's own settings, on this Mac; what screens show and play is set
  on the dashboard.
- `SaaSMonitorTests/` — Swift Testing, for the pure logic.

## Commands

```bash
./generate.sh   # the Xcode project, from project.yml (XcodeGen); again after adding a file
xcodebuild -project SaaSMonitor.xcodeproj -scheme SaaSMonitor test
```

The project is generated, not committed, like the mobile app's `ios/`. Debug builds take
`-NotchPreview compact|moment|milestone|loss|expanded` to hold a look, with a sample screen, for
development and screenshots.

## Conventions

- Swift 6, strict concurrency. Small types with explicit names; comments explain why, not what.
- UI copy in English, sentence case; what a screen shows speaks the screen's language, from the
  shared `Core`.
- Design like the wall display: the notch's black, the screen's accent, large tabular numbers,
  calm motion. Respect reduced motion. Clicks must reach the menu bar and the apps whenever the
  notch is not open, and everything must be reachable from the notch: a full menu bar hides the
  app's icon behind it.
- Commits: Conventional Commits (`feat(mac):`, `fix(mac):`…), no AI attribution or
  `Co-Authored-By` trailers.

## Releases

`macos.buildNumber` in `../mobile/version.json` numbers the next upload, and `version` is shared
with the other apps; run `./generate.sh` after changing them.
