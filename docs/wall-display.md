# Put a screen on the wall

A screen is a web page (`/d/<token>`) designed to run unattended, full screen, for months. Any
device with a modern browser works: a Raspberry Pi behind a TV, a spare laptop, a monitor next to
your desk, a tablet on a shelf.

Copy the screen link from **Screens → your screen → Screen link** in the dashboard. Anyone with the
link can view the screen, so treat it like a password; **Regenerate link** revokes the old one.
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
When several arrive at once, they play one after the other, a little faster.

## Sound

Browsers block audio until someone interacts with the page. When sound is enabled, the screen
shows "Click anywhere to enable sound": click once and you are done until the next reload. On a
dedicated device, start the browser with `--autoplay-policy=no-user-gesture-required` (see below)
and sound works without any click.

To check everything end to end, open the screen settings in the dashboard and click **Send a
test celebration**: every open screen plays a sample payment within a few seconds.

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
The dashboard itself stays in English.

## Several screens

Create as many screens as you like: one per product, one combining every Stripe account, a quiet
one without sound for the meeting room… Each has its own link and settings.
