/**
 * The tools SaaS Monitor is compared with on `/alternatives`. Every fact about another product
 * comes from its own site, with the page it was read on and when: prices change, and a
 * comparison page must never say more than its sources. Update `checked` when you re-read one.
 */

/** A fact about another product, as its own site states it. */
export interface Sourced {
  text: string;
  /** The page of their site that says it. */
  source: string;
  /** When it was last read there, `YYYY-MM-DD`. */
  checked: string;
}

export interface ComparisonRow {
  topic: string;
  them: Sourced;
  /** SaaS Monitor's side. */
  us: string;
}

export interface Question {
  question: string;
  answer: string;
}

export interface Alternative {
  slug: string;
  name: string;
  website: string;
  /** What kind of tool it is, in a few words. */
  kind: string;
  /** What it does, in its own terms. */
  summary: Sourced;
  /** Its entry price, for the table of all tools. */
  price: Sourced;
  /** The page's title: what people search for. */
  title: string;
  /** The page's heading: how the two fit together. */
  headline: string;
  /** The page's description, and the answer under its heading. */
  description: string;
  rows: ComparisonRow[];
  pickThem: string[];
  pickUs: string[];
  /** How the two work together, or when one is enough. */
  together: string;
  faq: Question[];
}

const CHECKED = "2026-09-30";

const BAREMETRICS_PRICING = "https://baremetrics.com/pricing";
const CHARTMOGUL_PRICING = "https://chartmogul.com/pricing/";
const GECKOBOARD_PRICING = "https://www.geckoboard.com/pricing/";
const GECKOBOARD_STRIPE = "https://www.geckoboard.com/integrations/stripe/";
const PINGBELL_PRICING = "https://pingbell.io/pricing";
const PINGBELL_STRIPE = "https://pingbell.io/solutions/stripe-push-notifications/";
const PINGBELL_MRR = "https://pingbell.io/solutions/saas-mrr-counter/";
const PROFITWELL = "https://www.paddle.com/profitwell-metrics";

const fact = (text: string, source: string): Sourced => ({ text, source, checked: CHECKED });

/** What SaaS Monitor is, the same on every page. */
const OURS = {
  purpose:
    "A live screen for the office: MRR or ARR, today's revenue and a feed of sales, with sounds and celebrations",
  price: "Free during the public beta, and free for good on your own server (MIT license)",
  sources: "Stripe only, with several Stripe accounts on one screen if you like",
  screens: "As many as you like, each with its own settings",
} as const;

export const ALTERNATIVES: readonly Alternative[] = [
  {
    slug: "baremetrics",
    name: "Baremetrics",
    website: "https://baremetrics.com",
    kind: "Subscription analytics",
    summary: fact(
      "Subscription analytics: over 28 metrics such as MRR, ARR, churn, upgrades and downgrades, with segments and email reports.",
      BAREMETRICS_PRICING,
    ),
    price: fact("Priced by the ARR it tracks, up to 35% off billed annually", BAREMETRICS_PRICING),
    title: "Baremetrics alternative for your office TV",
    headline: "Baremetrics and SaaS Monitor: analysis, and a screen on the wall",
    description:
      "Baremetrics explains your subscription revenue. SaaS Monitor puts it on the office TV and rings on every sale. They do different jobs, and many teams will want both.",
    rows: [
      {
        topic: "Made for",
        them: fact(
          "Analyzing subscription revenue: over 28 metrics such as MRR, ARR, churn, upgrades and downgrades",
          BAREMETRICS_PRICING,
        ),
        us: OURS.purpose,
      },
      {
        topic: "Price",
        // Its pricing page served two price lists on the same day (one free up to $180K ARR):
        // only what both say is stated.
        them: fact(
          "Priced by the ARR it tracks: Launch up to $360K ARR, Growth up to $3.6M, Scale above; up to 35% off billed annually. Its pricing page showed two different price lists when we checked: see it for yours",
          BAREMETRICS_PRICING,
        ),
        us: OURS.price,
      },
      {
        topic: "Goals",
        them: fact("Goal tracking, from the Growth plan", BAREMETRICS_PRICING),
        us: "The next milestone or your own goal on screen, with the date you'll reach it at your pace",
      },
      {
        topic: "Keeping the team posted",
        them: fact(
          "Automated email reports; a Slack integration from the Growth plan",
          BAREMETRICS_PRICING,
        ),
        us: "A sound and a voice in the room for each sale, and a celebration at each milestone. No Slack or email reports",
      },
      {
        topic: "Beyond metrics",
        them: fact(
          "Payment recovery and cancellation insights, $129 a month each as add-ons",
          BAREMETRICS_PRICING,
        ),
        us: "None: SaaS Monitor only reads Stripe, with a read-only key",
      },
    ],
    pickThem: [
      "You want to dig into why revenue moves, with segments, benchmarks and, on Scale, scenario planning.",
      "You want help recovering failed payments or learning why customers cancel.",
      "You want metrics sent to your inbox every day, week or month.",
    ],
    pickUs: [
      "You want the team to see, and hear, every sale as it lands.",
      "You want the number on the wall to match your Stripe Dashboard: SaaS Monitor follows Stripe's definition of MRR.",
      "You want a screen that costs nothing: free during the beta, free for good on your own server.",
      "You'd like to read the code, or keep your Stripe data on your own server.",
    ],
    together:
      "Keep Baremetrics for analysis, and put SaaS Monitor on the office TV. Each connects to Stripe on its own, and SaaS Monitor only needs a read-only restricted key: neither gets in the other's way.",
    faq: [
      {
        question: "Is SaaS Monitor a Baremetrics alternative?",
        answer:
          "For one part of it. SaaS Monitor shows your Stripe revenue live on a screen, with sounds and celebrations. It has no cohorts, forecasts, email reports or payment recovery. If a live view of MRR is all you need, it may be enough; otherwise, run both.",
      },
      {
        question: "Will both show the same MRR?",
        answer:
          "SaaS Monitor follows Stripe's own definition of MRR, so it matches your Stripe Dashboard. Analytics tools make their own choices about trials, discounts or failed payments, so small gaps between tools are normal.",
      },
      {
        question: "Can both read the same Stripe account?",
        answer:
          "Yes. SaaS Monitor reads Stripe with a restricted key of its own, read-only, and never writes to your account.",
      },
    ],
  },
  {
    slug: "chartmogul",
    name: "ChartMogul",
    website: "https://chartmogul.com",
    kind: "Subscription analytics and CRM",
    summary: fact(
      "Subscription analytics (MRR, ARR, churn and LTV) across billing systems, with a built-in CRM.",
      CHARTMOGUL_PRICING,
    ),
    price: fact("Free up to $120K ARR, then Starter from $69 a month", CHARTMOGUL_PRICING),
    title: "ChartMogul alternative for your office TV",
    headline: "ChartMogul and SaaS Monitor: the numbers you report, and the ones you celebrate",
    description:
      "ChartMogul turns billing data into investor-grade metrics. SaaS Monitor puts your Stripe revenue on the office TV, with a sound for every sale. Use ChartMogul for reporting and SaaS Monitor for the wall.",
    rows: [
      {
        topic: "Made for",
        them: fact(
          "Subscription analytics (MRR, ARR, churn and LTV) with a built-in CRM",
          CHARTMOGUL_PRICING,
        ),
        us: OURS.purpose,
      },
      {
        topic: "Price",
        them: fact(
          "Free up to $120K ARR. Starter from $69 a month ($57 billed annually), Pro from $119 ($99 billed annually), rising with your ARR",
          CHARTMOGUL_PRICING,
        ),
        us: OURS.price,
      },
      {
        topic: "Billing systems",
        them: fact(
          "1 billing source on Free and Starter, 5 on Pro, such as Stripe, Chargebee or Paddle",
          CHARTMOGUL_PRICING,
        ),
        us: OURS.sources,
      },
      {
        topic: "Keeping the team posted",
        them: fact("Scheduled email reports and Slack updates", CHARTMOGUL_PRICING),
        us: "A sound and a voice in the room for each sale, and a celebration at each milestone. No Slack or email reports",
      },
      {
        topic: "Dashboards",
        them: fact("5 team dashboards on Free and Starter, 10 on Pro", CHARTMOGUL_PRICING),
        us: `${OURS.screens}, shown full screen on a TV`,
      },
    ],
    pickThem: [
      "You report metrics to investors or a board, and need them consistent across billing systems.",
      "You want a CRM tied to revenue, or forecasts and industry benchmarks.",
      "You want metrics posted to Slack or email on a schedule.",
    ],
    pickUs: [
      "You want the team to see, and hear, every sale as it lands.",
      "You want a screen that runs by itself on a TV or a Raspberry Pi, with no one signed in.",
      "You want the number on the wall to match your Stripe Dashboard: SaaS Monitor follows Stripe's definition of MRR.",
      "You'd like to read the code, or keep your Stripe data on your own server.",
    ],
    together:
      "Keep ChartMogul for the numbers you report, and put SaaS Monitor on the wall for the ones you celebrate. Each reads Stripe on its own; SaaS Monitor only needs a read-only restricted key.",
    faq: [
      {
        question: "Is ChartMogul free?",
        answer:
          "Up to $120K ARR ($10K MRR), according to its pricing page when we checked. Paid plans then rise with your ARR.",
      },
      {
        question: "Does SaaS Monitor replace ChartMogul?",
        answer:
          "No. SaaS Monitor has no CRM, cohorts, benchmarks or forecasts. It does one thing: your Stripe revenue, live on a screen, with sounds and celebrations.",
      },
      {
        question: "Can both read the same Stripe account?",
        answer:
          "Yes. SaaS Monitor reads Stripe with a restricted key of its own, read-only, and never writes to your account.",
      },
    ],
  },
  {
    slug: "geckoboard",
    name: "Geckoboard",
    website: "https://www.geckoboard.com",
    kind: "TV dashboards",
    summary: fact(
      "Real-time dashboards from 90+ data sources, shown on TV screens, through sharing links, or in Slack and Teams.",
      GECKOBOARD_PRICING,
    ),
    price: fact("Essentials from $79 a month, billed annually", GECKOBOARD_PRICING),
    title: "Free Geckoboard alternative for Stripe",
    headline: "Geckoboard and SaaS Monitor: every tool on a TV, or Stripe with a sound",
    description:
      "Geckoboard builds TV dashboards from 90+ data sources. SaaS Monitor does one of them, Stripe revenue, with sounds, a voice and celebrations, free and open source. Here is how to choose, or use both.",
    rows: [
      {
        topic: "Made for",
        them: fact(
          "Real-time dashboards you build from 90+ data sources, for TVs, links, Slack and Teams",
          GECKOBOARD_PRICING,
        ),
        us: "One screen made for Stripe revenue, ready without building anything: MRR, sales, sounds and celebrations",
      },
      {
        topic: "Price",
        them: fact(
          "Essentials from $79 a month, Performance from $319 a month, billed annually; 14-day free trial",
          GECKOBOARD_PRICING,
        ),
        us: OURS.price,
      },
      {
        topic: "TV screens",
        them: fact("1 on Essentials, $20 each to add more; 5 on Performance", GECKOBOARD_PRICING),
        us: OURS.screens,
      },
      {
        topic: "Celebrations",
        them: fact("Full-screen celebrations, on Performance", GECKOBOARD_PRICING),
        us: "A moment for every sale with confetti, and a full-screen celebration at each milestone",
      },
      {
        topic: "Stripe",
        them: fact(
          "A Stripe integration with customer and subscriber counts, and several Stripe accounts",
          GECKOBOARD_STRIPE,
        ),
        us: "MRR as Stripe computes it, revenue, new customers and each subscription change, from one or several Stripe accounts",
      },
      {
        topic: "Data sources",
        them: fact("90+ data sources", GECKOBOARD_PRICING),
        us: "Stripe only",
      },
    ],
    pickThem: [
      "Your screens mix Stripe with other tools: CRM, support desk, analytics, spreadsheets.",
      "You need alerts, drilldowns and custom themes (Performance plan).",
      "You want one tool for every team's dashboard.",
    ],
    pickUs: [
      "Your screen is about Stripe revenue, and you want it on the wall in minutes.",
      "You want sound: a sale you hear, and a voice that says what happened.",
      "You want several screens without paying per screen.",
      "You'd like to read the code, or keep your Stripe data on your own server.",
    ],
    together:
      "Keep Geckoboard for the dashboards that mix your tools, and give Stripe a screen of its own with SaaS Monitor, where a sale rings when it lands.",
    faq: [
      {
        question: "Is there a free Geckoboard alternative for Stripe?",
        answer:
          "SaaS Monitor is free during its public beta, and free for good on your own server, under the MIT license. It only shows Stripe: for other data sources, you still need a dashboard tool.",
      },
      {
        question: "Which TVs does SaaS Monitor work on?",
        answer:
          "Any device with a modern browser: a Raspberry Pi behind a TV (the setup we recommend), a smart TV's browser or a spare laptop. Screens stay awake, recover from outages and reload after updates on their own.",
      },
      {
        question: "Can I build my own widgets in SaaS Monitor?",
        answer:
          "No: the screen's layout is fixed and made for revenue. You choose the metric (MRR or ARR), the chart's range, a goal, the sounds, the colors and the language.",
      },
    ],
  },
  {
    slug: "pingbell",
    name: "PingBell",
    website: "https://pingbell.io",
    kind: "Live boards for TVs, with phone notifications",
    summary: fact(
      "Live boards for TVs: sales, orders and sign-ups from Stripe, Shopify, Wix, Google Forms and more, with native TV apps and phone notifications.",
      PINGBELL_PRICING,
    ),
    price: fact("Core from $20 a month billed annually, $30 month to month", PINGBELL_PRICING),
    title: "PingBell alternative, free and open source",
    headline: "PingBell or SaaS Monitor: two ways to put Stripe on the office TV",
    description:
      "PingBell and SaaS Monitor both put revenue on a TV. PingBell covers many sources, native TV apps and phones; SaaS Monitor goes deep on Stripe MRR, free and open source. An honest comparison.",
    rows: [
      {
        topic: "Made for",
        them: fact(
          "Live boards on TVs for sales, orders, sign-ups and goals, from Stripe, Shopify, Wix, Google Forms and more",
          PINGBELL_PRICING,
        ),
        us: OURS.purpose,
      },
      {
        topic: "Price",
        them: fact(
          "Per workspace: Core $20 a month billed annually ($30 month to month), Plus $50 ($75), Team $200 ($300); 14-day trial",
          PINGBELL_PRICING,
        ),
        us: OURS.price,
      },
      {
        topic: "Screens",
        them: fact(
          "Unlimited on every plan, with apps for Apple TV, Fire TV, Roku and Android TV, or a browser",
          PINGBELL_PRICING,
        ),
        us: "As many as you like, in any modern browser: a Raspberry Pi, a smart TV's browser, a spare laptop",
      },
      {
        topic: "Revenue counter",
        them: fact(
          "Counts the payment events you point it at, such as paid invoices, and can add up several Stripe accounts",
          PINGBELL_MRR,
        ),
        us: "MRR as Stripe computes it, from subscriptions, with each account on its own or added up",
      },
      {
        topic: "Sound",
        them: fact("70+ built-in notification sounds", PINGBELL_STRIPE),
        us: "Three sound packs and a voice that says what happened, in five languages",
      },
      {
        topic: "Goals",
        them: fact("Goal lines, with a celebration when you cross one", PINGBELL_MRR),
        us: "The next milestone or your own goal, with a full-screen celebration when you reach it",
      },
    ],
    pickThem: [
      "You want native TV apps: Apple TV, Fire TV, Roku or Android TV.",
      "You track more than Stripe: shop orders, form sign-ups, webhooks.",
      "You want notifications on your team's phones, or leaderboards for a sales team.",
    ],
    pickUs: [
      "Stripe is where your revenue lives, and you want MRR exactly as Stripe computes it.",
      "You want a voice that says what just happened, in English, French, German, Spanish or Portuguese.",
      "You want it free: during the beta on saas-monitor.com, for good on your own server.",
      "You'd like to read the code, or keep your Stripe data on your own server.",
    ],
    together:
      "These two overlap more than most: both put revenue on a TV. If Stripe is your only source, try SaaS Monitor first, since it costs nothing. If you need other sources, native TV apps or phone notifications, PingBell covers them.",
    faq: [
      {
        question: "Is there a free PingBell alternative?",
        answer:
          "SaaS Monitor is free during its public beta, and free for good on your own server. It only reads Stripe, and runs in a browser rather than a TV app.",
      },
      {
        question: "Why doesn't SaaS Monitor count payments as MRR?",
        answer:
          "Because MRR is about subscriptions: SaaS Monitor follows Stripe's definition (active and past-due subscriptions, brought to a month, without taxes or metered usage), so the wall matches your Stripe Dashboard. Payments show up too, as today's revenue and in the feed.",
      },
      {
        question: "Does SaaS Monitor need a TV app?",
        answer:
          "No. A screen is a web page: open its link in a Raspberry Pi's browser, a smart TV's browser or on a laptop, and it runs on its own.",
      },
    ],
  },
  {
    slug: "profitwell",
    name: "ProfitWell Metrics",
    website: "https://www.paddle.com/profitwell-metrics",
    kind: "Subscription analytics, by Paddle",
    summary: fact(
      "Free subscription reporting by Paddle: MRR, churn, upgrades and downgrades, customer lifetime value, with benchmarks.",
      PROFITWELL,
    ),
    price: fact("Free", PROFITWELL),
    title: "ProfitWell Metrics alternative for your office TV",
    headline: "ProfitWell Metrics and SaaS Monitor: free analytics, and a free screen",
    description:
      "ProfitWell Metrics, by Paddle, is free subscription analytics. SaaS Monitor is a free, open-source screen that puts your Stripe revenue on the office TV. They do different jobs: use both.",
    rows: [
      {
        topic: "Made for",
        them: fact(
          "Subscription reporting: MRR, churn, upgrades and downgrades, customer lifetime value",
          PROFITWELL,
        ),
        us: OURS.purpose,
      },
      {
        topic: "Price",
        them: fact("Free: “completely free”, in its own words", PROFITWELL),
        us: OURS.price,
      },
      {
        topic: "Billing systems",
        them: fact("Stripe, Chargebee, Paddle and other billing tools", PROFITWELL),
        us: OURS.sources,
      },
      {
        topic: "Benchmarks",
        them: fact("Benchmarks against 30,000 subscription and SaaS companies", PROFITWELL),
        us: "None: SaaS Monitor shows your own numbers",
      },
      {
        topic: "Alerts",
        them: fact("Customizable alerts on the metrics you choose", PROFITWELL),
        us: "A sound, a voice and a card on screen for each sale, and a celebration at each milestone",
      },
    ],
    pickThem: [
      "You want free, in-depth subscription analytics, with segments and cohorts.",
      "You want to compare yourself with other subscription companies.",
      "You bill with Paddle or Chargebee as well as, or instead of, Stripe.",
    ],
    pickUs: [
      "You want the team to see, and hear, every sale as it lands.",
      "You want a screen that runs by itself on a TV or a Raspberry Pi, with no one signed in.",
      "You'd like to read the code, or keep your Stripe data on your own server.",
    ],
    together:
      "Both are free, and they don't overlap: keep ProfitWell Metrics for analysis, and put SaaS Monitor on the office TV.",
    faq: [
      {
        question: "Is ProfitWell Metrics still free?",
        answer:
          "Paddle's page calls it “completely free” when we checked. It works with Stripe too, not only with Paddle's own billing.",
      },
      {
        question: "Does SaaS Monitor replace ProfitWell Metrics?",
        answer:
          "No. SaaS Monitor has no churn analysis, cohorts or benchmarks. It shows your Stripe revenue live on a screen, with sounds and celebrations.",
      },
    ],
  },
];

export function alternativeBySlug(slug: string): Alternative | undefined {
  return ALTERNATIVES.find((alternative) => alternative.slug === slug);
}

/** Every fact the page states about another product, to render and check their sources. */
export function sourcedFacts(alternative: Alternative): Sourced[] {
  return [alternative.summary, alternative.price, ...alternative.rows.map((row) => row.them)];
}

/** The pages facts come from, in the order they first appear. */
export function sourcesOf(alternative: Alternative): string[] {
  return [...new Set(sourcedFacts(alternative).map((fact) => fact.source))];
}

/** A `YYYY-MM-DD` date as the pages write it: "September 30, 2026". */
export function formatCheckedDate(day: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  );
}
