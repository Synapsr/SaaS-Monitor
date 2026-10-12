/**
 * The words of the docs (`/docs`) in English: the reference every translation follows, which
 * `DocsText` makes them define in full. Like the rest of the site, `[words](key)` links words to
 * `siteLinks()[key]`, `**words**` stresses them (a button’s or a setting’s name) and `` `words` ``
 * sets them as code. Every fact comes from the guides in `docs/*.md` and from the code: change
 * them together.
 */
export const en = {
  common: {
    /** The docs’ name, in the breadcrumb, the sidebar and the phone menu. */
    docs: "Docs",
    breadcrumb: "Breadcrumb",
    /** The pages of the docs, as the sidebar lists them. */
    pages: {
      overview: "Overview",
      "get-started": "Get started",
      "wall-display": "Wall display",
      customize: "Customize",
      apps: "Apps",
      numbers: "Numbers",
      security: "Security",
      "self-hosting": "Self-hosting",
    },
    githubDocs: "Docs on GitHub",
    onThisPage: "On this page",
    previous: "Previous",
    next: "Next",
    github: {
      title: "Go deeper on GitHub",
      text: "The full guides, with every option, command and limit.",
    },
    cta: {
      title: "See your own numbers live today",
      text: "Free during the public beta. Connect Stripe with a read-only key, and your screen is ready in about two minutes.",
      primary: "Get started free",
      secondary: "Open the live demo",
    },
  },
  overview: {
    meta: {
      title: "Docs: your Stripe MRR on a TV in two minutes",
      description:
        "Short guides to SaaS Monitor: connect Stripe with a read-only key, put your MRR on a TV, make it yours, get the apps, or host it yourself.",
    },
    title: "Up and running in two minutes",
    lead: "Short guides that each read in a minute or two: set SaaS Monitor up, make it yours, and see why you can trust it. Every technical detail is on GitHub.",
    start: "Start here",
    read: "Read the guide",
    github: {
      title: "Prefer the technical guides?",
      text: "The docs on GitHub cover every option, command and limit, for developers and self-hosters.",
      links: {
        stripe: "Connect Stripe",
        wall: "Put a screen on the wall",
        selfHosting: "Self-hosting",
      },
    },
  },
  getStarted: {
    summary:
      "Sign up, connect Stripe with a read-only key, open a link on the TV. About two minutes.",
    meta: {
      title: "Get started: your Stripe MRR on a TV in two minutes",
      description:
        "Create a free account, connect Stripe with a read-only restricted key and open your screen’s link on any TV. Four steps, about two minutes.",
    },
    title: "Get started in two minutes",
    lead: "From sign-up to your MRR on the office TV, in four steps. Nothing to install, nothing to code.",
    facts: ["About two minutes", "Read-only Stripe key", "Free during the beta"],
    steps: {
      title: "Four steps",
      account: {
        title: "Create your free account",
        text: "Sign up on saas-monitor.com: it’s free during the public beta. You get a workspace, where you can invite your team later.",
      },
      connect: {
        title: "Connect Stripe with a read-only key",
        text: "Click **Create a restricted key on Stripe**: the Stripe Dashboard opens on its key form, with the right permissions selected. Check them, name the key and create it, then paste it in SaaS Monitor.",
        note: "The key is checked as you paste it: if a permission is missing, SaaS Monitor tells you which one.",
      },
      import: {
        title: "Let it import your history",
        text: "SaaS Monitor imports your subscriptions, the last 12 months of payments and the customers of the last 7 days. Small accounts take a few seconds, large ones a few minutes, and the dashboard shows the progress.",
      },
      tv: {
        title: "Open your screen on the TV",
        text: "Your first screen is created as soon as Stripe is connected. Copy its link, open it in the TV’s browser, on a Raspberry Pi or a spare laptop, and click once to turn the sound on.",
        note: "To hear it, click **Send a test celebration** in the screen settings: every open copy of the screen plays a sample sale.",
      },
    },
    permissions: {
      title: "Which permissions, and why",
      lead: "Seven permissions that read, and one optional permission that writes. Everything else stays on None.",
      columns: { permission: "Permission", access: "Access", why: "Why" },
      access: { read: "Read", write: "Write" },
      optional: "Optional",
      why: {
        subscriptions: "MRR, upgrades and churn",
        customers: "New customers, their names and countries",
        charges: "Revenue, and a celebration for every payment",
        events: "What changed since the last check",
        products: "Plan names",
        prices: "Amounts of tiered prices",
        coupons: "Discounts, which reduce MRR",
        webhooks: "Instant updates: SaaS Monitor adds its own webhook",
      },
      callout: {
        title: "Read-only by design",
        text: "Apart from adding its own webhook, if you allow it, the key can only read: no charges, no refunds, no changes to your customers. It’s encrypted at rest, never shown again, and you can revoke it in Stripe at any time.",
      },
      webhook:
        "With the optional **Webhook Endpoints** permission, every sale reaches the wall within seconds. [How updates work](doc-numbers)",
    },
    test: {
      title: "Try it with test data",
      text: "Not ready to connect your live account? Create a test mode key (`rk_test_…`) from a Stripe sandbox instead. The test and live modes of the same account can be connected side by side.",
    },
    next: {
      title: "What’s next",
      text: "Your screen works as it is. When you have a minute:",
    },
  },
  wallDisplay: {
    summary:
      "Any browser, a smart TV or a Raspberry Pi: what the screen shows, and how it runs for months on its own.",
    meta: {
      title: "Put your Stripe dashboard on a TV or Raspberry Pi",
      description:
        "Open your screen’s link in any browser, on a smart TV or a Raspberry Pi kiosk. It stays awake, recovers on its own and celebrates every sale.",
    },
    title: "Put it on the wall",
    lead: "A screen is a web page made to run full screen, unattended, for months. Anything with a modern browser can show it: no app to install, no sign-in.",
    devices: {
      title: "Pick a device",
      lead: "The screen fits any size, from a 720p monitor to a 4K TV, in landscape or portrait.",
      recommended: "Recommended",
      raspberryPi: {
        title: "Raspberry Pi",
        text: "A Raspberry Pi 4 or 5 behind the TV, set up once with one block of commands. It opens the screen full screen, with sound, at every start: no keyboard, no mouse, no click.",
      },
      smartTv: {
        title: "Smart TV",
        text: "Open the link in the TV’s browser and click once with the remote for sound. Some TV browsers are slow: a Raspberry Pi is smoother.",
      },
      computer: {
        title: "Laptop, mini PC or Mac",
        text: "Open the link in Chrome, press **F** for full screen and click once for sound. Turn off sleep in the system settings.",
      },
      tablet: {
        title: "Tablet",
        text: "Add the link to the home screen, then keep it in front with Guided Access on iPad or screen pinning on Android.",
      },
      phone: {
        title: "Your phone",
        text: "In the SaaS Monitor app, turn your phone sideways for TV mode: the whole screen, like on the wall. [See the apps](doc-apps)",
      },
      raspberryPiNote:
        "The dashboard gives you the Raspberry Pi command with your link filled in, under **Set up a TV or Raspberry Pi**.",
    },
    link: {
      title: "Your screen’s link",
      text: "Every screen has its own unguessable link: find it under **Screen link** in the screen settings. It opens with no sign-in, so treat it like a password. **Regenerate link** revokes the old one in a click.",
      password: {
        title: "Add a password",
        text: "For more safety, **Set a password**: each device asks for it once, then remembers it. Change it, and every device is locked out again. Signed-in members of your workspace never need it.",
      },
      phone: {
        title: "Open on your phone",
        text: "Under **Open on your phone**, scan the QR code with the SaaS Monitor app to follow the screen on your phone, with its widgets and notifications.",
      },
    },
    shows: {
      title: "What the screen shows",
      items: [
        "Your MRR, or ARR, in large type, with its growth over 30 days",
        "The road to your next milestone or your own goal, and the day you’ll reach it at your current pace",
        "A chart over 30 days, 90 days, 12 months or all time",
        "Revenue today and this month, customers and net new MRR",
        "A live feed of payments, new customers, upgrades and churn",
      ],
    },
    moments: {
      title: "Moments and celebrations",
      text: "Every sale, new customer or subscription change gets a large card in the middle of the screen, with its sound, then a voice if you like. Money coming in brings confetti, and each milestone takes over the whole screen.",
      detail:
        "Cards stay 10 seconds by default. When several arrive at once, they play one after the other.",
      imageAlt:
        "A new customer’s $199 payment in a card in the middle of the screen, with confetti",
      tip: {
        title: "Test it from your desk",
        text: "Click **Send a test celebration** in the screen settings: every open copy of the screen plays a sample sale within a few seconds.",
      },
    },
    unattended: {
      title: "Made to run on its own",
      items: [
        "Refreshes every few seconds, and recovers by itself after a network outage",
        "Keeps the display awake and hides the mouse cursor",
        "Shifts its content by a few pixels now and then, to protect OLED panels",
        "Reloads itself after an update, so it never runs an old version",
      ],
    },
    sound: {
      title: "Sound on a TV",
      text: "Browsers keep a page silent until someone interacts with it: click the screen once, and the sound stays on until the next reload. On a Raspberry Pi, the kiosk command lets it play without a click.",
    },
  },
  customize: {
    summary:
      "MRR or ARR, your goal, colors, languages, sounds and voices: make every screen yours.",
    meta: {
      title: "Customize your screen: goal, theme, sounds and voices",
      description:
        "Pick MRR or ARR, set a goal, choose the theme, color and language, the sounds and the voice, and what each Stripe event does. With a live preview.",
    },
    title: "Make it yours",
    lead: "Every screen has its own settings, with a live preview right next to them. Every change is saved as you go.",
    editorAlt: "The screen editor: settings on the left, live preview and share panel on the right",
    numbers: {
      title: "Your numbers",
      metric: {
        title: "MRR or ARR",
        text: "Show MRR, or ARR if that’s how you count: the headline, chart, goal and milestones follow. Payments and revenue stay what customers paid.",
      },
      goal: {
        title: "Milestones or your goal",
        text: "Automatic milestones celebrate each round number on the way up, from $100 to $1K, $10K and beyond. Or set your own target.",
      },
      chart: {
        title: "Chart range",
        text: "The last 30 days, 90 days, 12 months, or all time.",
      },
      currency: {
        title: "Currency and time zone",
        text: "Every amount is converted to the screen’s currency. Its time zone decides when “today” and “this month” start.",
      },
    },
    look: {
      title: "Theme and color",
      text: "Dark, or light for bright rooms. Pick one of five accent colors, or paste your brand color as hex: the screen adjusts it if needed, so that it stays readable.",
      custom: "Your color",
      imageAlt: "A light screen in German, in a custom orange",
    },
    language: {
      title: "Seven languages",
      text: "A screen speaks English, French, German, Spanish, Italian, Portuguese or Dutch, and writes numbers and dates the local way. The dashboard itself stays in English.",
    },
    sound: {
      title: "Sounds and voices",
      packs:
        "Three sound packs, synthesized right in the browser, with five sounds each, from a payment to a milestone. [Hear them all](sounds)",
      voice:
        "After the sound, a voice can say what happened: two voices per language, in English, French, German, Spanish and Portuguese. Sound and voice each have their own switch and volume.",
      own: "**Your own phrases**: with a Gradium API key on the server, the voice says what you write, with the customer’s name, the amount or the plan.",
    },
    events: {
      title: "What each event does",
      text: "For each kind of event, five switches: listed in the feed, shown as a card, its sound, said out loud, and a notification on the phones that follow the screen.",
      event: "Event",
      columns: { feed: "Feed", moment: "Card", sound: "Sound", voice: "Voice", push: "Phone" },
      names: {
        payment: "Payment",
        connectPayment: "Payment for a Connect account",
        subscription: "New subscriber",
        upgrade: "Upgrade",
        reactivation: "Reactivation",
        downgrade: "Downgrade",
        cancellation: "Cancellation",
        unpaid: "Failed payment",
        customer: "New customer",
        milestone: "Milestone",
      },
      on: "On",
      off: "Off",
      caption:
        "The defaults. Losses aren’t said out loud, and phones only hear the good news. Voices speak once you turn them on.",
    },
    accounts: {
      title: "Several Stripe accounts",
      text: "A screen can show several Stripe accounts, converted to its currency, in one of two ways.",
      added: {
        title: "Added up",
        text: "One total for every account. The feed names the account of each item.",
      },
      rotation: {
        title: "One at a time",
        text: "Each account takes its turn with its own numbers, and their total too if you like. When something happens, the screen shows its account right away.",
      },
      imageAlt:
        "Two products on one screen: a new subscriber of Acme Analytics, named in the moment and in the rotation above",
      more: "Or make one screen per product, and a quiet one without sound for the meeting room: as many as you like, each with its own link and settings.",
    },
    names: {
      title: "Customer names",
      text: "Hidden by default: anyone who sees the screen would see who pays you. Show them if you like. Customers that Stripe only knows by their email can then be named by their email, masked (`j•••@gmail.com`) or in full, or not at all. Voices never read emails.",
    },
  },
  apps: {
    summary:
      "Your screens on iPhone, iPad, Apple Watch, Android and Wear OS, with a notification for every sale.",
    meta: {
      title: "The app: your Stripe MRR on iPhone, Android and Apple Watch",
      description:
        "Follow any screen on iPhone, iPad, Apple Watch, Android and Wear OS: a notification for every sale, widgets, watch complications, numbers to share.",
    },
    title: "Your MRR in your pocket",
    lead: "The SaaS Monitor app opens any screen with its link or QR code, on saas-monitor.com or on your own server. No account, nothing tracked.",
    add: {
      title: "Add a screen",
      steps: [
        "In the screen settings, find **Open on your phone**.",
        "Scan its QR code with the app, or paste the screen’s link.",
        "If the screen has a password, type it once on each phone.",
      ],
    },
    notifications: {
      title: "A notification for every sale",
      text: "Payments, new subscribers, upgrades, reactivations, new customers and milestones, in the screen’s language and currency. A burst of activity arrives as one notification that sums it up.",
      choose:
        "Choose which events notify in the screen’s **Events**, under **Phone**. On each phone, turn a screen’s notifications off, or mute some of its events.",
      sound:
        "On iPhone, a notification can ring with the screen’s own sound and voice, even when the phone is locked: turn on **Play sounds and voices** in the app’s settings.",
      speed:
        "Notifications go out as soon as SaaS Monitor hears from Stripe: within seconds with [instant updates](doc-numbers).",
      /** When the notifications of the illustration arrived. */
      now: "now",
    },
    widgets: {
      title: "Widgets and watches",
      text: "On iPhone, Home Screen, Lock Screen and StandBy widgets, also in CarPlay. On Android, home screen widgets. Apple Watch and Wear OS apps, with complications, keep your MRR on your watch face.",
      wearAlt: "The Wear OS app: MRR with its 30-day growth, chart and progress to the goal",
    },
    tv: {
      title: "TV mode",
      text: "Turn your phone sideways on a screen for TV mode: everything at once, like on the wall, and the phone stays awake. With **Play sounds and voices** on, it plays each moment’s sound and voice too.",
    },
    share: {
      title: "Share any number",
      text: "Touch and hold a number to share it as a clean image, signed “Powered by SaaS Monitor”. Made for your next milestone post.",
      imageAlt: "A $79 payment shared as an image, signed Powered by SaaS Monitor",
    },
    privacy: {
      title: "No account, no tracking",
      text: "A screen’s link is all the app needs. It contains no analytics, advertising or tracking, keeps your screens in the device’s secure storage, and only talks to each screen’s server and to the services that deliver notifications. Customers are named only on screens that show names. [Privacy policy](privacy)",
    },
  },
  numbers: {
    summary:
      "MRR as Stripe defines it, so the wall matches your Stripe Dashboard. ARR, revenue, currencies and updates.",
    meta: {
      title: "How MRR, ARR and revenue are computed from Stripe",
      description:
        "MRR as Stripe defines it, so the number on the wall matches your Stripe Dashboard. How ARR, revenue, currencies, instant updates and history work.",
    },
    title: "Numbers you can trust",
    lead: "SaaS Monitor computes MRR the way Stripe defines it, so the number on the wall stays close to the one in your Stripe Dashboard. Here’s exactly how.",
    mrr: {
      title: "MRR, as Stripe defines it",
      items: [
        "Only active and past-due subscriptions count: trials, and canceled, unpaid, paused or incomplete subscriptions don’t.",
        "Each price is brought to a month: a yearly price counts for a twelfth.",
        "Quantities, tiers and volume prices count as Stripe invoices them.",
        "Discounts are subtracted, forever ones and repeating ones until they end. One-time discounts are not.",
        "A subscription set to cancel at the end of its period stops counting as soon as the cancellation is requested.",
        "Metered usage and one-time prices are left out, and taxes are not added.",
      ],
    },
    movements: {
      title: "Every change, recorded",
      text: "Each change of MRR is recorded as it happens, and net new MRR adds up the month’s changes. A lost subscription says why: canceled, won’t renew, payment failed or paused.",
      kinds: {
        new: { name: "New", text: "starts paying" },
        expansion: { name: "Expansion", text: "pays more" },
        contraction: { name: "Contraction", text: "pays less" },
        churn: { name: "Churn", text: "stops counting" },
        reactivation: { name: "Reactivation", text: "pays again" },
      },
    },
    arr: {
      title: "ARR",
      text: "ARR is twelve times MRR. A screen can show it as its main metric: the headline, chart, goal and milestones are then in ARR, while payments and revenue stay what customers paid.",
    },
    revenue: {
      title: "Revenue today and this month",
      text: "Revenue is what customers paid, net of refunds: today, this month, and the same days of last month to compare. Days and months follow the screen’s time zone.",
      connect:
        "On a Stripe Connect platform, payments made for connected accounts show in the feed, and only the fee you keep counts as your revenue.",
    },
    currencies: {
      title: "Several currencies",
      text: "Every amount is converted to the screen’s currency at today’s rate, from the European Central Bank, refreshed every 12 hours. Past values too: the chart shows your business growing, not exchange rates moving.",
    },
    updates: {
      title: "Instant updates",
      text: "With a webhook, Stripe tells SaaS Monitor the moment something happens. Without one, SaaS Monitor checks Stripe at a pace that respects Stripe’s read allowance.",
      webhook: { label: "With a webhook", value: "Within seconds" },
      polling: {
        label: "Without a webhook",
        value: "About every 17 minutes for small accounts, up to once a minute for busy ones",
      },
      daily:
        "A daily check also compares every subscription with Stripe, for the few changes Stripe makes without an event, such as a coupon that runs out.",
    },
    history: {
      title: "Your history",
      text: "When you connect, SaaS Monitor imports your subscriptions, the last 12 months of payments and the customers of the last 7 days. Stripe keeps no history of past subscription changes, so the chart before that day is rebuilt from each subscription’s start, end and current amount. From then on, every change is recorded as it happens.",
    },
    limits: {
      title: "Known differences",
      text: "The few cases where the wall and Stripe can differ are documented:",
      items: [
        "Tax-inclusive prices count with their tax.",
        "A coupon deleted before your first import counts on the whole subscription.",
        "Upgrades and downgrades made before your first import don’t show on the chart.",
      ],
    },
  },
  security: {
    summary:
      "A read-only key, encrypted at rest. Names hidden by default. Open source, so anyone can check.",
    meta: {
      title: "Security: a read-only Stripe key, encrypted at rest",
      description:
        "SaaS Monitor reads Stripe with a restricted, read-only key encrypted with AES-256-GCM. No ads, no tracking, names hidden by default, and open source.",
    },
    title: "Safe to connect",
    lead: "SaaS Monitor reads only what your screens need, keeps your key encrypted, and shows nothing you didn’t choose. It’s open source, so you don’t have to take our word for it.",
    facts: [
      { value: "Read-only", label: "restricted Stripe key" },
      { value: "AES-256-GCM", label: "encryption at rest" },
      { value: "MIT", label: "open source, for anyone to check" },
    ],
    key: {
      title: "A key that can only read",
      text: "You connect Stripe with a restricted key, created in your Stripe Dashboard with only the permissions SaaS Monitor needs: it never asks for your secret key. The one optional write permission lets it add its own webhook, for instant updates. Revoke the key in Stripe at any time. [See every permission](permissions)",
    },
    encryption: {
      title: "Encrypted, and never shown again",
      text: "Keys are encrypted at rest with AES-256-GCM and never leave the server: the dashboard only shows a masked hint. Webhooks from Stripe are verified with their signing secret.",
    },
    data: {
      title: "What is stored",
      text: "Your Stripe key, encrypted, and a copy of what your screens need: subscriptions and their MRR changes, payments and new customers, with their names, emails and countries. No card or bank details.",
      delete: "Disconnect a Stripe account, and everything imported from it is deleted right away.",
    },
    screens: {
      title: "Screens show only what you choose",
      items: [
        "Customer names and emails stay off your screens, and their notifications, unless you turn them on.",
        "A screen’s link is unguessable, and **Regenerate link** revokes the old one.",
        "Add a password, and each device has to type it once.",
      ],
    },
    tracking: {
      title: "No ads, no tracking",
      text: "The site runs no analytics and loads no third-party script. No advertising or tracking cookies, and your data is never sold. The app has no account and no tracking either. [Privacy policy](privacy)",
    },
    others: {
      title: "Who else sees what",
      text: "Only what you turn on: custom voice phrases are sent to Gradium to be spoken, and phone notifications go through the push services that deliver them.",
    },
    openSource: {
      title: "Open source, so anyone can check",
      text: "Every line of SaaS Monitor is on GitHub under the MIT license: read how your key is stored, or run it on your own server, where your Stripe data stays.",
      report: "Found a vulnerability? Report it privately",
    },
  },
  selfHosting: {
    summary:
      "Two commands with Docker, on any server or a Raspberry Pi. Free for good, under the MIT license.",
    meta: {
      title: "Self-host SaaS Monitor with Docker in two commands",
      description:
        "Run SaaS Monitor on your own server or a Raspberry Pi with Docker Compose: two commands, free for good under the MIT license. HTTPS, updates, backups.",
    },
    title: "Run it on your own server",
    lead: "SaaS Monitor is one Next.js server and a MySQL database. With Docker, it runs on any server, a spare computer or a Raspberry Pi, with every feature, free for good.",
    install: {
      title: "Install in two commands",
      requirements:
        "You need Docker with Compose, on a server, a spare computer or a Raspberry Pi with a 64-bit OS.",
      script:
        "The [script](install-script) writes a `saas-monitor` folder with a Compose file and a `.env` of fresh secrets, then stops: it needs no root, starts nothing and touches nothing else.",
      then: "Open `http://localhost:3000`, create your account and connect Stripe. Database migrations run on their own.",
    },
    tv: {
      title: "Open it from the TV",
      text: "Set `APP_URL` in `.env` to the address the TV will use, such as `http://192.168.1.20:3000`, and run `docker compose up -d` again: screen links are built from it.",
      callout: {
        title: "Keep ENCRYPTION_KEY safe",
        text: "It encrypts the Stripe keys in your database. Never change it: without it, every Stripe account has to be connected again.",
      },
    },
    https: {
      title: "HTTPS for instant updates",
      text: "A local network is enough for a TV in the same office. Put SaaS Monitor behind HTTPS with a domain to open screens from anywhere and get instant updates: Stripe only sends webhooks to a public HTTPS address. Any reverse proxy works, such as Caddy.",
      without:
        "Without it, SaaS Monitor checks Stripe at a steady pace, about every 17 minutes for small accounts.",
    },
    updates: {
      title: "Updates",
      text: "Pull the new image and restart: open screens notice the new version and reload themselves. To update on your own terms, pin a release with `SAAS_MONITOR_VERSION`.",
    },
    data: {
      title: "What stays on your server",
      text: "Everything: your Stripe key, your data and your settings live in your own MySQL database, and one command backs them up. Two optional features reach out: custom voice phrases are sent to Gradium to be spoken, and phone notifications go through Expo’s push service.",
      signups:
        "Once your team has signed up, set `DISABLE_SIGNUPS=true`: nobody else can create an account, and invitations keep working.",
    },
    cta: {
      title: "Two commands, and it’s yours",
      text: "Every feature, free for good. The full guide covers configuration, HTTPS, updates, backups and building from source.",
      guide: "Full self-hosting guide on GitHub",
    },
  },
};

export type DocsText = typeof en;
