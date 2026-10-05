# Put a screen on the wall

A screen is a web page (`/d/<token>`) designed to run unattended, full screen, for months. Any
device with a modern browser works: a Raspberry Pi behind a TV, a spare laptop, a monitor next to
your desk, a tablet on a shelf.

Copy the screen link from **Screens → your screen → Screen link** in the dashboard, or open it on
[your phone](#on-your-phone). Anyone with the link can view the screen, so treat it like a
password; **Regenerate link** revokes the old one.
For more safety, **Set a password** next to it: each device asks for it once, then remembers it,
and changing it locks every device out again. Members of your workspace, signed in, never need it.

## What the screen does on its own

- Refreshes every few seconds and recovers by itself after a network outage.
- Keeps the display awake (Screen Wake Lock), hides the mouse cursor, and shifts content by a
  few pixels from time to time to protect OLED panels from burn-in.
- Reloads itself after you update SaaS Monitor, so a screen never runs an old version.
- Press <kbd>F</kbd> (or use the button in the corner) to toggle full screen.

## Moments

Each sale, new customer or subscription change gets a large card in the middle of the screen, for
as long as you choose in the screen settings (**Moments stay on screen**, 10 seconds by default).
When several arrive at once, they play one after the other, a little faster. A new subscription
comes first, then the payment that started it: Stripe collects the payment a few seconds before
the subscription starts, so a new customer's first payment waits for the next update of the
screen, in case its subscription follows.

## Events

**Events**, in the screen settings, decides what each kind of event does: payments, payments made
for a [Stripe Connect account](stripe.md#stripe-connect-platforms), new subscribers, upgrades,
reactivations, downgrades, cancellations, failed payments, new customers and milestones. For each
one, five boxes:

- **Feed**: listed in the activity feed on the side of the screen.
- **Card**: shown as a card in the middle of the screen (the whole screen for a milestone).
- **Sound**: plays its sound, from the screen's sound pack.
- **Voice**: said out loud by the screen's [voice](#voice).
- **Phone**: a notification on the phones that follow the screen with the
  [SaaS Monitor app](#on-your-phone). On by default for good news (payments, new subscribers,
  upgrades, reactivations, new customers, milestones), off for losses and for payments made for
  Stripe Connect accounts.

Every box is its own choice: a payment may ring without a card, and a Connect platform may keep
the payments made for its connected accounts off the feed, while the feed still shows its latest
own payments. Checking a sound or a voice plays it, to hear what you chose. Sound and voice only
play once turned on in their own sections.

## Sound

Browsers block audio until someone interacts with the page. When sound is enabled, the screen
shows "Click anywhere to enable sound": click once and you are done until the next reload. On a
dedicated device, start the browser with `--autoplay-policy=no-user-gesture-required` (see below)
and sound works without any click.

To check everything end to end, open the screen settings in the dashboard and click **Send a
test celebration**: every open screen plays a sample payment within a few seconds.

## Voice

A screen can also say what just happened, out loud, right after the sound: "New subscriber!",
"Payment received!". Turn on **Announce out loud** in the screen settings, pick a voice (two per
language), and check what it says in [Events](#events): losses are not said out loud unless you
check them. Voice has its own switch and volume, so a screen can speak without playing sounds.
Voices speak English, French, German, Spanish and Portuguese, the screen's language.

Out of the box, voices say recorded phrases that ship with SaaS Monitor: nothing is sent anywhere.

**Your own phrases.** With a [Gradium](https://gradium.ai) API key on the server
(`GRADIUM_API_KEY`, see [Self-hosting](self-hosting.md)), turn on **Your own phrases**: the voice
then says what you write, with the details of each moment:

| Variable    | Says                                                      |
| ----------- | --------------------------------------------------------- |
| `{name}`    | the customer's name, when the screen shows customer names |
| `{amount}`  | the amount on the card: a payment, or the change of MRR   |
| `{plan}`    | the plan's name                                           |
| `{country}` | the customer's country                                    |
| `{product}` | the Stripe account's name, for screens with several       |
| `{fee}`     | your fee, on a payment for a connected account            |

For example `{name} just joined {plan}, for {amount}!` says "Ada Lovelace just joined Pro, for
$49!". Write up to five variations per announcement: one is picked at random each time, among
those whose details are known, so a phrase with `{name}` gives way to another one when the name is
hidden. Each announcement is synthesized by Gradium when it happens (the text, customer's name
included, is sent to Gradium), and every open copy of the screen says the same phrase.

## On your phone

The SaaS Monitor app (iOS and Android) shows a screen on your phone, in its widgets and on your
watch, and notifies you of what happens. It has no account: the screen's link is all it needs, on
saas-monitor.com or on your own instance. In the screen settings, under **Open on your phone**,
scan the QR code with the app (or paste the link in it). A screen with a password asks for it
once on each phone.

**Notifications** say what the screen's cards say, in the screen's language and currency: "New
subscriber, +$49 MRR", then "Payment received, $49". Which events notify is the **Phone** column
of [Events](#events). Customers are named only if the screen shows names, and a screen of several
Stripe accounts names the account of each notification. A burst of activity (after an outage,
say) arrives as one notification summing it up, and each milestone is notified once. A phone
following several screens of the same account hears of each thing once. In the app, each phone
can turn a screen's notifications off, or mute some of its events, on top of the screen's
choices.

Notifications go out when SaaS Monitor syncs the Stripe account, which happens when a Stripe
webhook arrives, when a screen polls, or when the dashboard is open: there is no background
worker. For notifications within seconds, turn on
[instant updates](stripe.md#instant-updates) for the account. Without them, the account is only
checked while a screen or the dashboard is open, every few minutes at best (about every 17
minutes for small accounts), and notifications wait for it.

Notifications reach phones through Apple and Google: their title and text go through these
services. saas-monitor.com sends to them directly; self-hosted instances go through the Expo push
service, which forwards them, with no setup or credentials, only outbound HTTPS access to
`exp.host` (see [Self-hosting](self-hosting.md#notifications)). **Regenerate link** or a new password stops
notifying every phone that followed the screen, like it locks out its displays; uninstalling the
app stops them too.

## Raspberry Pi (recommended)

Any Raspberry Pi 4 or 5 connected to a TV over HDMI does the job. With Raspberry Pi OS (desktop):

1. In Raspberry Pi Imager, enable auto-login, Wi-Fi and SSH before flashing the card.
2. Disable screen blanking: `sudo raspi-config` → **Display Options** → **Screen Blanking** →
   **No**.
3. Pick the HDMI audio output from the volume icon in the taskbar if you want sound on the TV,
   and install the emoji font used for country flags: `sudo apt install fonts-noto-color-emoji`.
4. Start the screen automatically at login. Raspberry Pi OS uses the labwc compositor: add this
   line to `~/.config/labwc/autostart` (create the file if needed), with your screen's link. The
   dashboard gives the same command with the link filled in, under **Set up a TV or Raspberry
   Pi**: add the final `&` so that the session keeps starting.

   ```bash
   chromium --kiosk --noerrdialogs --disable-infobars --incognito \
     --autoplay-policy=no-user-gesture-required \
     --check-for-update-interval=31536000 \
     "https://monitor.example.com/d/your-screen-token" &
   ```

   On older releases the browser binary is called `chromium-browser`.

5. Reboot: the screen opens full screen, with sound, without keyboard or mouse.

For a vertical monitor, rotate the output in **Screen Configuration** (or with
`wlr-randr --output HDMI-A-1 --transform 90`); the layout adapts to portrait automatically.

## Other devices

| Device                | How                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Laptop, mini PC, Mac  | Open the link in Chrome, press <kbd>F</kbd>, click once for sound. Disable sleep in the system settings.                      |
| Chromium-based kiosk  | Any machine can use the Raspberry Pi command above.                                                                           |
| Smart TV browser      | Open the link, click once with the remote to enable sound. Some TV browsers are slow: a Raspberry Pi gives a smoother result. |
| iPad / Android tablet | Open the link, add it to the home screen, then use Guided Access (iPad) or screen pinning (Android) to keep it in front.      |

## Several products on one screen

A screen may show several Stripe accounts, converted to its currency. In **Several accounts**,
choose how:

- **Added up**: one total for every account; the feed names the account of each item.
- **One at a time**: each account takes its turn on screen with its own numbers, every 10 seconds
  to a minute, and their total too if you like. When something happens, the screen shows its
  account right away, and the moment names it; moments of several accounts play one after the
  other.

## Look and language

In the screen settings, pick a dark or a light theme (light suits bright rooms and lit shelves),
an accent color, or your own color pasted as hex: the screen makes it lighter or darker if it
needs to, so that it stays readable. The screen speaks English, French, German, Spanish,
Italian, Portuguese or Dutch, and writes numbers and dates the local way (`12 480 €` in French).
Its [voice](#voice) speaks the same language.
The dashboard itself stays in English.

Customer names are hidden by default: anyone who sees the screen sees who pays you. Once you show
them, **Customers without a name** decides how the screen names those Stripe only knows by their
email: not at all, by their email masked (`j•••@gmail.com`, masked by the server before it
reaches the screen), or by their full email. Voices never read emails.

## Several screens

Create as many screens as you like: one per product, one combining every Stripe account, a quiet
one without sound for the meeting room… Each has its own link and settings.
