/**
 * The words of the public site in English: the reference every translation follows, which
 * `SiteText` makes them define in full. Links inside a text are written `[words](key)`: the key
 * names a link of `siteLinks()` (`src/lib/site/rich-text.ts`), and `**words**` stresses words.
 */
export const en = {
  meta: {
    /** The home page's title, in the words people search with. */
    title: "SaaS Monitor · Open-source Stripe MRR dashboard for your office TV",
    /** For search results and social previews: under 160 characters. */
    description:
      "Your Stripe MRR, ARR and every payment, live on the office TV, your phone and your watch. Open source: free during the beta, or self-hosted for good.",
    imageAlt: "SaaS Monitor: watch your SaaS grow, live",
    /** Under the demo’s MRR, on the social preview. */
    imageGrowth: (percent: string) => `${percent} in 30 days`,
  },
  nav: {
    skip: "Skip to content",
    home: "SaaS Monitor, home",
    main: "Main",
    demo: "Live demo",
    features: "Features",
    apps: "Apps",
    pricing: "Pricing",
    docs: "Docs",
    github: "GitHub",
    signIn: "Sign in",
    getStarted: "Get started",
    menu: "Menu",
    language: "Language",
  },
  /** Offered to visitors whose browser prefers this language, on a page in another one. */
  languageHint: {
    text: "This page is also in English.",
    action: "Read in English",
    dismiss: "Dismiss",
  },
  hero: {
    badge: "Open source · Free during the public beta",
    title: { start: "Watch your SaaS grow, ", highlight: "live", end: "." },
    lead: "SaaS Monitor turns your Stripe account into live numbers: MRR or ARR, today’s revenue and every payment, with a sound for each sale. On the office TV, on your phone and on your wrist.",
    primary: "Get started, it’s free",
    secondary: "Open the live demo",
    points: ["Free during the beta", "Free forever self-hosted", "Read-only Stripe key"],
  },
  demo: {
    title: "Live demo of a SaaS Monitor screen",
    caption: "The live demo, with a fictional SaaS. A sale lands every 20 seconds or so.",
    captionOn: "Sound on: every sale rings, then a voice says what happened.",
    captionBlocked: "Your browser kept the sound off. Click “Hear it” to try again.",
    hear: "Hear it",
    mute: "Mute",
    posterAlt:
      "A SaaS Monitor screen: MRR in large type with its growth, the goal, the MRR chart, revenue tiles and the latest payments",
    open: "Open the live demo",
  },
  proof: {
    label: "SaaS Monitor in short",
    /** After a star icon: how many stars the repository has. */
    stars: (count: string) => `${count} on GitHub`,
    star: "Star it on GitHub",
    license: "MIT license",
    selfHost: "Docker or Raspberry Pi",
    languages: "7 languages",
    privacy: "No ads, no tracking",
  },
  features: {
    eyebrow: "On the wall",
    title: "Built to keep you going",
    lead: "Building a SaaS is a long game. Seeing it grow, sale after sale, is what keeps a team shipping.",
    mrr: {
      title: "The number that matters, huge",
      text: "MRR front and center, with its 30-day growth, ARR and the road to your next milestone. Readable from across the room.",
      growth: (amount: string, percent: string) => `${amount} · ${percent} in 30 days`,
      toGoal: (amount: string, goal: string) => `${amount} to ${goal}`,
      pace: "at this pace: tomorrow",
    },
    moment: {
      title: "Every sale is a moment",
      text: "A sound, a card with the amount and the plan, confetti in your color. The whole office knows.",
      kind: "New customer",
      plan: "Team",
    },
    milestone: {
      title: "Milestones worth celebrating",
      text: "$1K, $10K, $100K MRR, or your own goal, with the day you’ll reach it at your current pace. Crossing one fills the screen.",
      reached: "Goal reached",
      next: (amount: string) => `Next stop: ${amount}. Keep going.`,
    },
    wall: {
      title: "Made for the wall",
      text: "Dark or light, in your brand color and in seven languages. From a 720p monitor to a 4K TV, it never sleeps and recovers on its own.",
    },
    accounts: {
      /** The combined numbers, as a screen rotating between accounts names them. */
      all: "All accounts",
      title: "All your products, one screen",
      text: "Add up several Stripe accounts in one currency, or let each product take its turn. Every moment says where it comes from.",
    },
    honest: {
      title: "Honest and private",
      text: "MRR as Stripe defines it, read with a restricted key encrypted at rest. Customer names stay hidden unless you show them.",
      points: ["Read-only restricted key", "Encrypted with AES-256-GCM", "Names hidden by default"],
    },
  },
  sounds: {
    eyebrow: "Sound",
    title: "Hear what a sale sounds like",
    lead: "Three sound packs, synthesized in the browser: nothing to install. Then a voice says what happened, in the screen’s language. Pick them per screen, or keep the meeting room quiet.",
    packs: {
      register: {
        name: "Cash register",
        description: "The classic ka-ching: a drawer and a till bell.",
      },
      chime: { name: "Chime", description: "Soft bells for a calm office." },
      arcade: { name: "Arcade", description: "8-bit coins and power-ups." },
    },
    events: {
      payment: "Payment",
      customer: "New customer",
      mrrUp: "MRR up",
      mrrDown: "MRR down",
      milestone: "Milestone",
    },
    play: (sound: string, pack: string) => `Play the ${sound} sound of the ${pack} pack`,
    download: (sound: string, pack: string) =>
      `Download the ${sound} sound of the ${pack} pack, as a WAV file`,
    voices: {
      title: "Voices",
      text: "After the sound, a voice says what happened, in the screen’s language. Two voices per language.",
      choose: "Phrase the voices say",
      phrases: {
        payment: "Payment",
        subscription: "New subscriber",
        customer: "New customer",
        upgrade: "Upgrade",
        goal: "Goal reached",
      },
      play: (voice: string, language: string, words: string) =>
        `Play ${voice}, a voice in ${language}, saying “${words}”`,
    },
    files: "Download every sound as a WAV file",
  },
  apps: {
    eyebrow: "Apps",
    title: "Your MRR in your pocket, too",
    lead: "The SaaS Monitor app opens any screen with its link or QR code, hosted or self-hosted. Turn your phone sideways and it becomes a wall display. No account, nothing tracked.",
    platforms: "iPhone · iPad · Apple Watch · Android · Wear OS",
    features: [
      {
        title: "Every sale, as it happens",
        text: "A notification for each payment, new subscriber, upgrade and milestone, in the screen’s language. On iPhone, it can ring with the screen’s own sound and voice.",
      },
      {
        title: "Widgets everywhere",
        text: "On iPhone, Home Screen, Lock Screen and StandBy widgets, also in CarPlay. On Android, home screen widgets.",
      },
      {
        title: "On your wrist",
        text: "Apple Watch and Wear OS apps, with complications, to keep your MRR on your watch face.",
      },
      {
        title: "Share any number",
        text: "Touch and hold a number to share it as a clean image, signed “Powered by SaaS Monitor”.",
      },
    ],
    stores: {
      /** Over the store's name, while the app isn't out yet. */
      soon: "Coming soon",
      appStore: {
        soon: "Coming soon to the App Store",
        live: "Download on the App Store",
        /** Over the store's name, once the app is out. */
        liveLine: "Download on the",
      },
      googlePlay: {
        soon: "Coming soon to Google Play",
        live: "Get it on Google Play",
        liveLine: "Get it on",
      },
    },
    pending: "Both apps are in review. They’ll be listed here the day they’re out.",
    images: {
      iphone:
        "The SaaS Monitor app on iPhone: MRR almost at its $15K goal, the MRR chart and today’s revenue",
      watch: "The Apple Watch app: MRR with its 30-day growth and chart",
      android: "The Android app sharing the MRR as an image, signed Powered by SaaS Monitor",
    },
  },
  steps: {
    eyebrow: "Setup",
    title: "On the wall in two minutes",
    guide: "Read the step-by-step guide",
    items: [
      {
        title: "Connect Stripe",
        text: "Create a read-only restricted key in one click and paste it. Your history is imported in about a minute.",
      },
      {
        title: "Make it yours",
        text: "Choose the sounds, the colors and your goal with a live preview. Every change is saved as you go.",
      },
      {
        title: "Put it on the wall",
        text: "Open the screen’s link on any TV, monitor or Raspberry Pi. No sign-in, nothing to install.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Free while in beta. Free forever on your own server.",
    lead: "SaaS Monitor is in public beta: the hosted version is free while it lasts. Self-hosted, it stays free for good.",
    hosted: {
      name: "Hosted for you",
      badge: "Public beta",
      price: "Free",
      term: "during the public beta",
      points: [
        "Every feature, nothing to install or update",
        "Instant updates from Stripe webhooks",
        "As many screens and teammates as you like",
      ],
      cta: "Get started",
    },
    selfHosted: {
      name: "On your own server",
      badge: "Open source",
      price: "Free",
      term: "forever, under the MIT license",
      points: [
        "Every feature, with no limits",
        "Docker in two commands, on any server or a Raspberry Pi",
        "Your Stripe data stays on your server",
      ],
      cta: "Self-hosting guide",
    },
  },
  openSource: {
    eyebrow: "Open source",
    title: "Yours to run, read and change",
    lead: "SaaS Monitor is open source under the MIT license. Run it with Docker on your own server or a Raspberry Pi in two commands, with nothing to clone or build. Your Stripe key never leaves your server.",
    star: "Star on GitHub",
    guide: "Self-hosting guide",
    facts: [
      { value: "MIT", label: "license, for good" },
      { value: "2", label: "commands to install" },
      { value: "arm64", label: "and amd64 images" },
    ],
    terminal: "Terminal",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Select the commands to copy them",
    script:
      "The [script](install-script) writes a Compose file and fresh secrets, then stops. Open localhost:3000 and connect Stripe.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions founders ask",
    items: [
      {
        question: "Is my Stripe key safe?",
        answer: [
          "You connect Stripe with a restricted key, created in your Stripe Dashboard with only the permissions SaaS Monitor needs: it reads subscriptions, customers, payments and the products, prices and coupons they use. One permission is optional: it lets SaaS Monitor register its own webhook endpoint, for instant updates.",
          "The key is encrypted at rest with AES-256-GCM, never leaves the server and is never displayed again. You can revoke it in Stripe at any time. [See every permission](permissions)",
        ],
      },
      {
        question: "Does the number match my Stripe Dashboard?",
        answer: [
          "Yes, in most cases: SaaS Monitor follows Stripe’s own definition of MRR. Only active and past-due subscriptions count, a yearly price counts for a twelfth, and discounts are subtracted, except one-time ones.",
          "A few limits are documented: tax-inclusive prices count with their tax, a coupon deleted before your first import counts on the whole subscription, and the chart before that import is rebuilt from each subscription’s current amount. [How MRR is computed](mrr)",
        ],
      },
      {
        question: "What do you store?",
        answer: [
          "Your Stripe key, encrypted, and a copy of what your screens need: subscriptions and their MRR changes, payments and new customers, with customers’ names, emails and countries. No card or bank details. Disconnecting an account deletes its data. Self-hosted, it all stays on your server, apart from custom voice phrases, if you turn them on, which go to Gradium, and notifications to the phones that follow a screen, which go through Expo’s push service.",
        ],
      },
      {
        question: "Which TVs work?",
        answer: [
          "Any screen with a modern browser. A Raspberry Pi 4 or 5 behind the TV gives the smoothest result: set up once, it opens the screen full screen, with sound, at every start. A smart TV’s browser, a spare laptop or a tablet work too. The screen keeps itself awake, recovers from network outages and reloads after updates. [Put a screen on the wall](wall)",
        ],
      },
      {
        question: "Is there a mobile app?",
        answer: [
          "The SaaS Monitor app, for iPhone, iPad, Apple Watch, Android and Wear OS, opens any screen with its link or QR code, hosted or self-hosted, and notifies you of each payment, new subscriber and milestone. No account, nothing tracked. [See the app](apps)",
        ],
      },
      {
        question: "Which languages does a screen speak?",
        answer: [
          "English, French, German, Spanish, Italian, Portuguese and Dutch, with numbers and dates written the local way. Its voice speaks English, French, German, Spanish and Portuguese.",
        ],
      },
      {
        question: "Paddle, Lemon Squeezy or Polar?",
        answer: [
          "Not yet: SaaS Monitor reads Stripe only, for now. If you use another one, [say so on GitHub](issues).",
        ],
      },
      {
        question: "How much does it cost?",
        answer: [
          "The hosted version is free during the public beta. On your own server, it’s free for good: SaaS Monitor is open source under the MIT license.",
        ],
      },
      {
        question: "Can I self-host?",
        answer: [
          "Yes. SaaS Monitor runs with Docker Compose, next to its MySQL database, on any server or a Raspberry Pi with a 64-bit OS. Your Stripe data stays on it; only the optional custom voice phrases are sent to Gradium to be spoken, and phone notifications go through Expo’s push service. [Self-hosting guide](self-hosting)",
        ],
      },
    ],
    maker: {
      title: "Who makes it",
      text: (director: string) => `SaaS Monitor is built by ${director} at [Synapsr](synapsr).`,
      also: "We also make [Louez](louez), open-source software for rental businesses, and [Hovod](hovod), an open-source video platform you host yourself.",
    },
  },
  closing: {
    title: "Keep going. Your next milestone is closer than you think.",
    primary: "Get started",
    secondary: "Star on GitHub",
  },
  /** The help button in the corner of every page, on an instance with a help widget. */
  support: {
    label: "Questions?",
    /** Read after the label by screen readers ("Questions? Write to us"): phones only see an icon. */
    action: "Write to us",
  },
  footer: {
    license: "Open source under the MIT license.",
    madeBy: "Made by [Synapsr](synapsr).",
    /** Where to write for help, in the footer and at the end of every docs page. */
    help: "Questions? Write to [support@saas-monitor.com](support).",
    trademark:
      "Stripe is a trademark of Stripe, Inc. SaaS Monitor is not affiliated with or endorsed by Stripe.",
    columns: { product: "Product", openSource: "Open source", legal: "Legal" },
    links: {
      demo: "Live demo",
      sounds: "Stripe notification sounds",
      alternatives: "Alternatives",
      changelog: "Changelog",
      docs: "Docs",
      githubDocs: "Docs on GitHub",
      github: "GitHub",
      selfHosting: "Self-hosting",
      privacy: "Privacy",
      terms: "Terms",
      legalNotice: "Legal notice",
    },
    /** Marks links to pages that only exist in English. */
    inEnglish: "in English",
    languages: "Languages",
  },
  notFound: {
    title: "Page not found",
    heading: "Nothing on this wall",
    text: "This page doesn’t exist, or it moved. The live demo, though, never stops.",
    home: "Back to home",
    demo: "Open the live demo",
  },
  soundPage: {
    meta: {
      title: "Stripe notification sound: how to change it",
      description:
        "Stripe’s app documents no sound setting: your phone picks the sound. How to change it on iPhone and Android, plus free cha-ching (or ka-ching) sounds for every sale.",
    },
    eyebrow: "Stripe notification sound",
    title: "How to change the Stripe notification sound",
    intro:
      "Short answer: in your phone’s settings, not in Stripe. The Stripe Dashboard app notifies you of new payments, new customers, disputed payments, deposited transfers and a daily summary. The settings Stripe documents turn them on or off; how they sound is up to your phone.",
    change: {
      title: "Change it on your phone",
      lead: "First allow notifications from Stripe on your phone, as Stripe asks. Then:",
      source: "Source:",
      iphone: {
        title: "On iPhone",
        steps: [
          "Open **Settings**, then **Notifications**.",
          "Tap **Stripe**, below Notification Style.",
          "Tap **Sounds**, then pick a sound.",
        ],
        note: "Apple notes that the last step works only if the app supports it.",
        sources: { apple: "Apple support" },
      },
      android: {
        title: "On Android",
        steps: [
          "Open **Settings**, then **Notifications** › **App notifications**.",
          "Tap **Stripe**, then a category of its notifications.",
          "Choose the sound of that category.",
        ],
        note: "Android lets you change the sound of each category of an app’s notifications. Menus vary from one phone maker to another.",
        sources: { android: "Android help", developers: "Android developers" },
      },
      stripe: {
        title: "In the Stripe app",
        steps: [
          "Tap your account’s icon, at the top left of any screen.",
          "Open **Global settings** › **Notification settings**.",
          "Turn notifications on or off for each of your accounts.",
        ],
        note: "Stripe documents these switches, and no choice of sound.",
        sources: { support: "Stripe support", app: "Stripe Dashboard mobile app" },
      },
    },
    library: {
      title: "Or give every sale a sound the whole room hears",
      lead: "A phone’s ping is easy to miss, and only you hear it. SaaS Monitor puts your Stripe revenue on a screen in the office and plays a sound for every payment, new customer and change of MRR, from one of three packs. Play them here, or download them as WAV files, free to use under the MIT license, which asks you to keep its notice with them.",
    },
    voices: {
      title: "And a voice that says what happened",
      lead: "After the sound, a screen can say the moment out loud, in English, French, German, Spanish or Portuguese. Ten voices, two per language, with recorded phrases; with a Gradium API key on the server, screens can also say the customer’s name, the amount or the plan.",
    },
    questions: {
      title: "Questions",
      items: [
        {
          question: "Can I change the sound inside the Stripe app?",
          answer: [
            "Stripe’s documentation of its Dashboard app describes switches to turn notifications on or off for each account, and no choice of sound. The sound comes from your phone’s notification settings.",
          ],
        },
        {
          question: "Which Stripe events play a sound on SaaS Monitor?",
          answer: [
            "Payments, new customers, MRR going up (new subscriptions, upgrades, reactivations) or down (downgrades, cancellations, subscriptions left unpaid), and milestones: five sounds per pack. For each kind of event, a screen chooses whether it plays its sound, says it out loud, shows a card or lists it in the feed.",
          ],
        },
        {
          question: "Does SaaS Monitor replace the Stripe app?",
          answer: [
            "No. It reads your Stripe account with a restricted key (one optional permission adds its own webhook) to show your revenue on a screen. Keep the Stripe app for refunds, payouts and everything else.",
          ],
        },
        {
          question: "Do I need to install anything to hear the sounds?",
          answer: [
            "No. Screens synthesize their sounds in the browser: open a screen’s link on a TV, a Raspberry Pi or a laptop, and click once to allow sound.",
          ],
        },
        {
          question: "Can I use the WAV files elsewhere?",
          answer: [
            "Yes. They are rendered from SaaS Monitor’s open-source code, under the MIT license, which asks you to keep its notice with them. Use them in your own alerts, bots or videos.",
          ],
        },
      ],
    },
    closing: {
      title: "Hear it on a wall",
      text: "The live demo runs a fictional SaaS where a sale lands every 20 seconds or so. Click once on the screen to turn the sound on.",
      register: "Open the demo with the cash register",
      arcade: "Or with the arcade",
    },
  },
};

export type SiteText = typeof en;
