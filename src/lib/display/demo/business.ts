/*
 * The fictional SaaS of the demo screen: its name, goal, plans and customers.
 */

/**
 * The demo screen's token: its page, `/d/demo`, and the screen API's `/api/screens/demo/…`, which
 * the SaaS Monitor app polls like any screen's. Real tokens are 32 characters: no screen has it.
 */
export const DEMO_TOKEN = "demo";

/** A Stripe account of the demo, simulated from its own seed. */
export interface DemoBusiness {
  /** Its id in the display state, like a real account's. */
  id: string;
  name: string;
  seed: number;
}

/**
 * The demo's SaaS, and a second one for a screen showing several accounts (`?accounts=2`). The
 * first seed is picked so that the history ends about $300 below the goal, crossed a minute after
 * loading.
 */
export const DEMO_BUSINESSES: readonly DemoBusiness[] = [
  { id: "demo", name: "Acme Analytics", seed: 70 },
  { id: "demo-mail", name: "Acme Mail", seed: 7 },
];
/** The name of a demo screen showing several accounts: the company behind them. */
export const COMPANY_NAME = "Acme Inc.";
export const DEMO_CURRENCY = "usd";
/**
 * The MRR goal the demo crosses within its first minutes, in major units like `settings.goal`: for
 * each of its accounts.
 */
export const DEMO_GOAL = 15_000;

export const PLANS = [
  { name: "Starter", price: 2_900 },
  { name: "Pro", price: 7_900 },
  { name: "Team", price: 19_900 },
  { name: "Scale", price: 49_000 },
] as const;
export const PLAN_WEIGHTS = [0.42, 0.4, 0.14, 0.04];
/** The plan of the first live customer: a sale worth celebrating. */
export const TEAM_PLAN = 2;
export const AVERAGE_PRICE = PLANS.reduce(
  (sum, plan, index) => sum + plan.price * PLAN_WEIGHTS[index],
  0,
);

/** Where customers come from, with weights. */
export const COUNTRIES = [
  ["US", 30],
  ["GB", 10],
  ["DE", 9],
  ["FR", 8],
  ["CA", 6],
  ["NL", 5],
  ["AU", 4],
  ["SE", 3],
  ["ES", 3],
  ["IT", 3],
  ["BR", 3],
  ["IN", 3],
  ["JP", 2],
  ["CH", 2],
  ["IE", 2],
  ["PL", 2],
  ["DK", 1],
  ["SG", 1],
  ["NZ", 1],
  ["MX", 1],
] as const;

export const COMPANIES = [
  "Brightwave",
  "Kestrel Data",
  "Fernhill Studio",
  "Oakline Legal",
  "Nimbus Travel",
  "Juniper Health",
  "Atlas Robotics",
  "Lumen & Co",
  "Pinecrest Media",
  "Quill & Ink",
  "Tidewater Labs",
  "Copperleaf",
  "Bluebird Dental",
  "Northstar Fitness",
  "Meridian Freight",
  "Saltbox Coffee",
  "Wildflower Events",
  "Ironwood Capital",
  "Mosaic Learning",
  "Clearwater Clinics",
  "Redwood Realty",
  "Maple & Main",
  "Foxglove Design",
  "Granite Peak",
  "Sundial Solar",
  "Brook & Stone",
  "Aurora Bikes",
  "Cobalt Games",
  "Driftwood Hotels",
  "Emberly Bakery",
  "Fable Books",
  "Glasshouse Studio",
  "Hearth Homes",
  "Kindred Care",
  "Lighthouse Schools",
  "Marigold Florist",
  "Nomad Coworking",
  "Odyssey Tours",
  "Riverbend Farms",
  "Summit Physio",
  "Trellis Garden",
  "Velvet Audio",
] as const;
