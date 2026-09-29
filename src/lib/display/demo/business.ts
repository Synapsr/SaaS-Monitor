/*
 * The fictional SaaS of the demo screen: its name, goal, plans and customers.
 */

export const BUSINESS_NAME = "Acme Analytics";
export const DEMO_ACCOUNT_ID = "demo";
export const DEMO_CURRENCY = "usd";
/** The MRR goal the demo crosses within its first minutes, in major units like `settings.goal`. */
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
