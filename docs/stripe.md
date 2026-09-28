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

| Permission          | Section | Access | Why                                           |
| ------------------- | ------- | ------ | --------------------------------------------- |
| Subscriptions       | Billing | Read   | MRR, customers, upgrades and churn            |
| Customers           | Core    | Read   | Customer names and countries in the live feed |
| Charges and Refunds | Core    | Read   | Revenue and payment celebrations              |
| Events              | Core    | Read   | Detect what changed since the last check      |
| Products            | Core    | Read   | Plan names                                    |
| Prices              | Billing | Read   | Amounts of tiered prices                      |
| Coupons             | Billing | Read   | Discounts, which reduce MRR                   |
| Webhook Endpoints   | Webhook | Write  | _Optional_: instant updates (see below)       |

The key is checked when you paste it: if a permission is missing, SaaS Monitor tells you which
one. Keys are encrypted at rest and never displayed again.

Use a `rk_test_…` key from a [sandbox](https://docs.stripe.com/sandboxes) to try things out, and
connect as many accounts as you like: a screen can combine several of them. The test and live
modes of the same account can be connected side by side.

If a key is revoked or loses a permission, the account shows an error with the fix. Connecting
the same account again with a new key replaces the old key and keeps the imported data.

## First import

After connecting, SaaS Monitor imports your subscriptions and the last 12 months of payments.
Small accounts take a few seconds, large ones a few minutes; the dashboard shows the progress and
screens display an "importing" state meanwhile.

Stripe doesn't keep a history of past subscription changes, so the MRR chart before the import is
reconstructed from each subscription's start, end and current amount. From then on, every change
is recorded as it happens.

## Instant updates

Stripe limits how often an app may read an account (about 500 read requests per payment over 30
days, at least 10,000 per month), and your own integration shares that allowance. SaaS Monitor
respects it:

- **With a webhook** (instant updates), Stripe notifies SaaS Monitor the moment something happens:
  payments and MRR changes show up within seconds. A safety check still runs every 30 minutes.
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
