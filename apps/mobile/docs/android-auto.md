# Android Auto feasibility

**Conclusion.** Ship nothing for Android Auto now: a Stripe dashboard fits none of the categories
Google accepts in cars, and its push notifications never reach the car screen.\
Watch the widgets Google is bringing to Android Auto in 2026, the one plausible path once their
rules are published.

_Checked 2026-10-05 against official Google pages (see Sources)._

## What Android Auto accepts today

An app must "belong to one of the supported categories and meet specific design requirements
before it can be listed on Google Play" for cars ([Car App Library][apps]). The categories
([Android for Cars overview][overview], [car app quality][quality]):

- **While driving or parked**: media (audio only), communication (messaging notifications;
  templated messaging and calling are labs, testing tracks only), navigation, points of interest
  (parking, charging, fuel), IoT (actions on connected devices, such as a garage door or lights)
  and weather.
- **Parked only**: games, on Android Auto and Android Automotive OS, generally available since
  September 2026 ([what's new][whatsnew]); video, and browsers (labs), on Android Automotive OS
  only ([parked apps][parked]). Video on Android Auto is in early access, for phones on Android 17
  and later ([what's new][whatsnew], [Android Developers Blog][blog]).

Weather opened to every developer in May 2025 ([what's new][whatsnew]). Templated apps declare
their category, such as `androidx.car.app.category.IOT` ([IoT apps][iot], [weather
apps][weather]). Rule PC-1 applies to all: "The app must not include features outside the app
types intended for cars" ([car app quality][quality]).

## Which notifications reach the car

Android Auto's notifications are "restricted to those considered important enough to appear in a
driving situation": navigation, phone calls, messages and reminders ([notification
design][aa-notif]). A phone app gets in through messaging only: a `MessagingStyle` notification
with a reply action and a mark-as-read action, and an `automotive_app_desc` declaring
`notification` ([messaging notifications][messaging]). Rule IN-1 adds that an app "must display
notifications only when relevant to the driver's needs" ([car app quality][quality]). On Android
Automotive OS, a non-system app raises a heads-up notification only in `CATEGORY_CALL`,
`CATEGORY_MESSAGE` or `CATEGORY_NAVIGATION` ([AAOS notifications][aaos-notif]).

Our Expo pushes on the `moments` channel are ordinary notifications, so they stay on the phone.

## Why SaaS Monitor would be rejected

- **No category fits.** MRR and a payment feed are not audio, a conversation, a route, a place to
  drive to, a connected device or the weather (our reading of the list above).
- **Faking one breaks policy.** Wrapping a "new subscriber" moment in `MessagingStyle` with a
  reply action would add features "outside the app types intended for cars" (PC-1) and fail IN-1
  ([car app quality][quality]). Google Play forbids "false or misleading information or claims"
  and apps "improperly categorized" ([deceptive behavior][deceptive]), and asks developers not to
  "misrepresent or conceal your app's primary purpose" ([misrepresentation][misrep]).
- **Review would catch it.** Car-compatible releases are reviewed against the car app quality
  guidelines, blocking for open testing and production ([distribute to cars][distribute]).

## What could work later

- **Widgets on Android Auto (most promising, unconfirmed).** Google said in May 2026 that mobile
  widgets "will be available to users of Android Auto this year, and cars with Google built-in
  later on" ([Android Developers Blog][blog]). The guidance asks for Jetpack Glance, responsive
  layouts, light and dark themes, and no reliance on scrolling ([adapt widgets for
  cars][widgets]). Which apps qualify, whether widgets show while driving, and how they are
  reviewed is not documented; the [widget quality guidelines][widget-quality] have no car
  criteria. The app's Android widgets are already Glance (`modules/screen-bridge/android`): they
  are the starting point if the rules allow them.
- **Android Automotive OS parked apps.** Built-in cars take video, games and browsers (labs) while
  parked ([parked apps][parked]). The Car ready mobile apps program distributes existing apps in
  those three categories only, with Android Auto support "at a later date" ([car ready
  apps][car-ready]). A dashboard is none of them. Speculative: a car browser could show our
  `/d/<token>` web screen while parked, with no app from us.
- **Voice.** App Actions for cars serve POI apps only ([App Actions for cars][actions]); reading
  aloud applies to messages ([notification design][aa-notif]). We found no official way for
  Assistant or Gemini to read other apps' alerts in the car.

## Conclusion

Ship nothing for Android Auto now, and never dress moments up as messages. Watch:

1. the Android Auto widget rollout, and whether non-category apps may show widgets while driving;
2. the supported categories and the car app quality change notes;
3. Car ready mobile apps reaching Android Auto, or adding categories.

## Sources

All fetched on 2026-10-05; the page's own "last updated" date is in parentheses.

- [Android for Cars overview](https://developer.android.com/training/cars) (2026-09-22)
- [Car app quality](https://developer.android.com/docs/quality-guidelines/car-app-quality)
  (2026-09-14)
- [Android for Cars App Library](https://developer.android.com/training/cars/apps) (2026-06-18)
- [Build parked apps for cars](https://developer.android.com/training/cars/parked) (2026-07-13)
- [Car ready mobile apps](https://developer.android.com/training/cars/car-ready-mobile-apps)
  (2026-07-13)
- [IoT apps](https://developer.android.com/training/cars/apps/iot) (2026-09-08)
- [Weather apps](https://developer.android.com/training/cars/apps/weather) (2026-10-02)
- [Extend messaging notifications to Android Auto](https://developer.android.com/training/cars/communication/notification-messaging)
  (2026-09-23)
- [Android Auto notifications design](https://developers.google.com/cars/design/android-auto/product-experience/system-ui/notifications)
  (2025-05-28)
- [Notifications on Android Automotive OS](https://developer.android.com/training/cars/platforms/automotive-os/notifications)
  (2026-09-15)
- [Distribute to cars](https://developer.android.com/training/cars/distribute) (2026-09-14)
- [What's new in Android for Cars](https://developer.android.com/training/cars/whats-new)
  (2026-09-14)
- [Adapt widgets for cars](https://developer.android.com/design/ui/cars/guides/flows/widgets)
  (2026-05-12)
- [Widget quality](https://developer.android.com/docs/quality-guidelines/widget-quality)
  (2026-04-06)
- [App Actions for cars](https://developer.android.com/develop/devices/assistant/cars)
  (2026-07-16)
- [Android Developers Blog: What's new in Android for Cars](https://android-developers.googleblog.com/2026/05/android-for-cars-unifying-platforms-premium-experiences.html)
  (published 2026-05-19)
- [Play policy: Deceptive behavior](https://support.google.com/googleplay/android-developer/answer/9888077)
  (play.google.com/about/privacy-security-deception/deceptive-behavior/ redirects here)
- [Play policy: Misrepresentation](https://support.google.com/googleplay/android-developer/answer/9888689)

[overview]: https://developer.android.com/training/cars
[quality]: https://developer.android.com/docs/quality-guidelines/car-app-quality
[apps]: https://developer.android.com/training/cars/apps
[parked]: https://developer.android.com/training/cars/parked
[car-ready]: https://developer.android.com/training/cars/car-ready-mobile-apps
[iot]: https://developer.android.com/training/cars/apps/iot
[weather]: https://developer.android.com/training/cars/apps/weather
[messaging]: https://developer.android.com/training/cars/communication/notification-messaging
[aa-notif]: https://developers.google.com/cars/design/android-auto/product-experience/system-ui/notifications
[aaos-notif]: https://developer.android.com/training/cars/platforms/automotive-os/notifications
[distribute]: https://developer.android.com/training/cars/distribute
[whatsnew]: https://developer.android.com/training/cars/whats-new
[widgets]: https://developer.android.com/design/ui/cars/guides/flows/widgets
[widget-quality]: https://developer.android.com/docs/quality-guidelines/widget-quality
[actions]: https://developer.android.com/develop/devices/assistant/cars
[blog]: https://android-developers.googleblog.com/2026/05/android-for-cars-unifying-platforms-premium-experiences.html
[deceptive]: https://support.google.com/googleplay/android-developer/answer/9888077
[misrep]: https://support.google.com/googleplay/android-developer/answer/9888689
