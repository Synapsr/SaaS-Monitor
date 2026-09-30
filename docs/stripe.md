# Connect Stripe

SaaS Monitor reads your Stripe data with a **restricted API key**: a key you create in the Stripe
Dashboard that can only do what you allow. It never needs your secret key, and it never changes
anything in your account (the single optional write permission lets it register its own webhook
endpoint).

## Create the key

1. In the dashboard, open **Stripe accounts → Connect a Stripe account** and click **Create a
   restricted key on Stripe**. The Stripe Dashboard opens on the "Create restricted key" form, with
   the permissions below pre-selected when Stripe supports it.
2. Check the permissions, name the key (e.g. "SaaS Monitor") and create it.
3. Copy the key (`rk_live_…` or `rk_test_…`) and paste it in SaaS Monitor.

| Permission          | Section | Access | Why                                      |
| ------------------- | ------- | ------ | ---------------------------------------- |
| Subscriptions       | Billing | Read   | MRR, customers, upgrades and churn       |
| Customers           | Core    | Read   | New customers, their names and countries |
| Charges and Refunds | Core    | Read   | Revenue and payment celebrations         |
| Events              | Core    | Read   | Detect what changed since the last check |
| Products            | Core    | Read   | Plan names                               |
| Prices              | Billing | Read   | Amounts of tiered prices                 |
| Coupons             | Billing | Read   | Discounts, which reduce MRR              |
| Webhook Endpoints   | Webhook | Write  | _Optional_: instant updates (see below)  |

The key is checked when you paste it: if a permission is missing, SaaS Monitor tells you which
one. Keys are encrypted at rest and never displayed again.

Use a `rk_test_…` key from a [sandbox](https://docs.stripe.com/sandboxes) to try things out, and
connect as many accounts as you like: a screen can combine several of them. The test and live
modes of the same account can be connected side by side.

If a key is revoked or loses a permission, the account shows an error with the fix. Connecting
the same account again with a new key replaces the old key and keeps the imported data.

## First import

After connecting, SaaS Monitor imports your subscriptions, the last 12 months of payments and the
customers created in the last 7 days. Small accounts take a few seconds, large ones a few minutes;
the dashboard shows the progress and screens display an "importing" state meanwhile.

Stripe doesn't keep a history of past subscription changes, so the MRR chart before the import is
reconstructed from each subscription's start, end and current amount; an "All time" chart starts
with the first subscription that paid. From then on, every change is recorded as it happens.
Re-importing an account (from its menu) starts over: the changes recorded since it was connected
are lost.

## How MRR is computed

SaaS Monitor follows [Stripe's definition of MRR](https://docs.stripe.com/billing/subscriptions/analytics),
so the number on the wall matches your Stripe Dashboard:

- Only `active` and `past_due` subscriptions count: trials and `canceled`, `unpaid`, `paused` or
  `incomplete` subscriptions don't.
- A subscription set to cancel at the end of its period stops counting as soon as the cancellation
  is requested. One with a cancellation date (`cancel_at`) counts until that date.
- Each item is brought to a month with its own billing interval: a yearly price counts for a
  twelfth, a weekly one 52 times a year divided by 12. Quantities, tiers and volume prices are
  priced as Stripe invoices them.
- Metered usage and one-time prices are left out, and taxes are not added. A tax-inclusive price
  counts in full, though: see the limits below.
- `forever` discounts, and `repeating` ones until they end, are subtracted; `once` discounts are
  not. A customer's discount applies to the subscriptions without a discount of their own.
  Deleting a coupon only stops new redemptions: the discounts already using it keep counting.

Every change of a subscription's MRR is recorded as a movement: **new** (it starts paying),
**expansion** and **contraction** (its amount changes), **churn** (it stops counting) and
**reactivation** (it pays again after stopping). A churn says why: the subscription was
**canceled**, **won't renew** (a cancellation at period end, with the date it ends), is
**unpaid** (Stripe's retries of a failed payment ran out: paying the invoice brings it back as a
reactivation) or **paused**. Churns recorded before SaaS Monitor kept reasons take the one their
subscription shows. Net new MRR adds up this month's movements. A
_new customer_ paid nothing when the month began; a customer adding a second subscription is not
one.

ARR is twelve times MRR. A screen can show it as its main metric: its headline, chart, goal,
milestones, net new ARR and subscription changes are then twelve times larger, while payments and
revenue stay what customers paid.

Some limits to keep in mind:

- **History before the import** is rebuilt, as explained above: each subscription counts at its
  current amount from its start, so upgrades and downgrades that happened before the import don't
  show on the chart.
- **Tax-inclusive prices** count with their tax. Stripe leaves taxes out of MRR, but the tax
  share of an inclusive price is only known on invoices, from Stripe Tax: with such prices, the
  MRR on the wall is higher than in the Stripe Dashboard.
- **Coupons deleted before the import** can no longer be read from Stripe (SaaS Monitor keeps
  the terms of every coupon it reads, for when they are deleted later). Their terms then come
  from the discounts using them, when Stripe shows them there, but without the products a coupon
  is restricted to: it counts on the whole subscription. A discount whose coupon can't be read at
  all is left out of MRR, and the server log names the coupon.
- **Freshness** depends on how updates reach SaaS Monitor: within seconds with a webhook,
  otherwise at the pace described in [Instant updates](#instant-updates). A daily check also
  compares every subscription with Stripe, for changes Stripe makes without an event, such as a
  repeating coupon that ends or test data you delete.
- **Several currencies**: a screen converts every amount to its currency at today's exchange rate
  (European Central Bank rates, refreshed every 12 hours), past values included. The chart then
  shows the business growing rather than exchange rates moving, but a past value can differ from
  what Stripe showed that day. Amounts in a currency without a rate are left out, and the screen
  says so.

Revenue is what customers paid, net of refunds (and only your fee of the payments made for
[connected accounts](#stripe-connect-platforms)): today, this month, and the same number of days
of the previous month for comparison. Days and months follow the screen's time zone.

A **new customer** is a customer created in Stripe, often at sign-up, before they pay anything if
they ever do: screens announce them and count today's. Deleting a customer in Stripe, such as spam
or test data, removes them from the screens.

## Stripe Connect platforms

If your account is a Connect platform, the destination charges it makes for its connected
accounts (`transfer_data.destination`) appear in the feed with their own icon, as payments for a
connected account: the money is theirs. Your revenue only counts the application fee you keep
of them, and they ring without confetti. Charges imported before this was known are classified
at the next **Re-import data** of the account.

## Instant updates

Stripe limits how often an app may read an account (about 500 read requests per payment over 30
days, at least 10,000 per month), and your own integration shares that allowance. SaaS Monitor
respects it:

- **With a webhook** (instant updates), Stripe notifies SaaS Monitor the moment something happens:
  payments, new customers and MRR changes show up within seconds. A safety check still runs every
  30 minutes.
- **Without a webhook**, SaaS Monitor spends at most a quarter of your allowance checking Stripe:
  about every 17 minutes below 20 sales a month, every 3–4 minutes around 100 sales a month, and
  up to once a minute for busy accounts. The account page shows the current interval.

If Stripe stops delivering webhooks (endpoint disabled, URL changed…), SaaS Monitor notices that
events arrive without notification and falls back to checking at the normal pace.

Instant updates need SaaS Monitor to be reachable on a public HTTPS URL (`APP_URL`). When it is,
and the key has the **Webhook Endpoints: Write** permission, the endpoint is registered
automatically when you connect the account. Otherwise, from the account page you can:

- click **Enable instant updates** after adding the permission, or
- add the endpoint yourself in the Stripe Dashboard (**Developers → Webhooks**) with the URL and
  events shown on the account page, then paste its signing secret (`whsec_…`).

## Security

- Prefer restricted keys: a leaked key can then only read your data.
- Keys are encrypted with AES-256-GCM using `ENCRYPTION_KEY`; webhook payloads are verified with
  their signing secret.
- Disconnecting an account deletes its imported data and the webhook endpoint SaaS Monitor
  created. Revoke the key in Stripe too if you no longer need it.

## Why not "Sign in with Stripe"?

Stripe's OAuth for third-party apps now requires publishing a Stripe App, which every
self-hosted instance would have to do on its own. A restricted key is simpler and gives you full
control over the permissions.
