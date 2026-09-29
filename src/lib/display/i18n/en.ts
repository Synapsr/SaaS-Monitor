/** The words of a screen in English: the reference every translation follows. */
export const en = {
  metricNames: { mrr: "Monthly recurring revenue", arr: "Annual recurring revenue" },
  topBar: {
    accounts: "Stripe accounts",
    testData: "Test data",
    live: "Live",
    reconnecting: "Reconnecting…",
    enterFullScreen: "Enter full screen",
    exitFullScreen: "Exit full screen",
    enableSound: "Click anywhere to enable sound",
  },
  accountStatus: { ready: "imported", importing: "importing", error: "failing" },
  /** The combined numbers of a screen rotating between its accounts. */
  allAccounts: "All accounts",
  hero: { inThirtyDays: "in 30 days" },
  goal: {
    goal: "Goal",
    nextMilestone: "Next milestone",
    toGo: (amount: string) => `${amount} to go`,
    atThisPace: (when: string) => `at this pace: ${when}`,
    today: "today",
    tomorrow: "tomorrow",
  },
  chart: {
    ranges: { "30d": "last 30 days", "90d": "last 90 days", "12m": "last 12 months" },
    since: (month: string) => `since ${month}`,
    allTime: "all time",
    empty: "The curve appears after a few days of history.",
    goal: (amount: string) => `Goal ${amount}`,
    summary: (title: string, from: string, to: string) => `${title}: from ${from} to ${to}.`,
  },
  tiles: {
    revenueToday: "Revenue today",
    yesterday: (amount: string) => `${amount} yesterday`,
    thisMonth: "This month",
    versus: (month: string) => `vs ${month}`,
    versusAmount: (amount: string, month: string) => `vs ${amount} in ${month}`,
    customers: "Customers",
    newThisMonth: (count: number) => `+${count} this month`,
    inTrial: (count: number) => `${count} in trial`,
    paying: "Paying customers",
    netNew: (metric: string) => `Net new ${metric}`,
    gainedLost: (gained: string, lost: string) => `${gained} gained · ${lost} lost`,
  },
  feed: {
    title: "Latest activity",
    empty: "New customers, payments and subscriptions will appear here the moment they happen.",
    kinds: {
      payment: "Payment",
      customer: "New customer",
      new: "New subscription",
      expansion: "Upgrade",
      reactivation: "Reactivation",
      contraction: "Downgrade",
      churn: "Cancellation",
    },
    /** A payment made for one of the account's Stripe Connect accounts. */
    connectPayment: "For a connected account",
    justNow: "just now",
    minutesAgo: (minutes: number) => `${minutes} min ago`,
    hoursAgo: (hours: number) => `${hours} h ago`,
    yesterday: "yesterday",
  },
  warnings: {
    unconvertedCurrency: (currency: string) =>
      `Amounts in ${currency} are left out: no exchange rate is available right now.`,
    failingAccount: (account: string) => `${account}: this Stripe account needs attention.`,
  },
  moments: {
    titles: {
      payment: "Payment received",
      customer: "New customer",
      new: "New subscriber",
      expansion: "Upgrade",
      reactivation: "Welcome back",
      contraction: "Downgrade",
      churn: "Subscription canceled",
    },
    connectPayment: "Payment for a connected account",
    connectFee: (amount: string) => `Your fee: ${amount}`,
    /** A new customer whose name is hidden and country unknown. */
    someoneNew: "Someone new",
    customersToday: (count: number) =>
      count === 1 ? "First new customer today" : `${count} new customers today`,
    catchingUp: "Catching up",
    payments: (count: number) => (count === 1 ? "1 new payment" : `${count} new payments`),
    changes: (count: number) =>
      count === 1 ? "1 subscription change" : `${count} subscription changes`,
    customers: (count: number) => (count === 1 ? "1 new customer" : `${count} new customers`),
    test: "Test celebration",
    testDetails: "This is how your next payment will look and sound",
    goalReached: "Goal reached",
    milestoneReached: "Milestone reached",
    newMilestone: "New milestone",
    nextStop: (amount: string) => `Next stop: ${amount}. Keep going.`,
  },
  status: {
    importing: "Importing your Stripe history…",
    importingDetails:
      "Subscriptions and payments are on their way. It takes a minute or two for most accounts, and this screen updates by itself.",
    failing: "Stripe data can’t be loaded right now",
    failingDetails:
      "Every account of this screen is failing, often because an API key was revoked. Check the Stripe connections in your dashboard: the screen will recover by itself.",
    empty: "Connect Stripe to bring this screen to life",
    emptyDetails: (screen: string, metric: string) =>
      `Add a Stripe account to “${screen}” in your dashboard. Your ${metric}, revenue and every new payment will show up here, live.`,
    gone: "This screen link no longer works",
    goneDetails: (app: string) =>
      `The screen may have been deleted, or its link regenerated. Open it again from your ${app} dashboard to get its current link.`,
  },
  lock: {
    title: "This screen is protected",
    details: "Type its password to open it. This device will remember it.",
    password: "Password",
    open: "Open the screen",
    wrongPassword: "Wrong password. Try again.",
    tooManyAttempts: "Too many attempts. Wait a few minutes, then try again.",
  },
};

export type DisplayText = typeof en;
