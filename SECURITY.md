# Security policy

SaaS Monitor stores API keys that give read access to Stripe accounts, so security reports are
taken seriously.

## Reporting a vulnerability

Report vulnerabilities privately through
[GitHub security advisories](https://github.com/Synapsr/SaaS-Monitor/security/advisories/new).
Please include steps to reproduce and the impact you observed. You will get an answer within a
few days, and a fix will be released as quickly as possible, crediting you if you wish.

## How data is protected

- Stripe keys are encrypted at rest (AES-256-GCM with `ENCRYPTION_KEY`) and never sent to the
  browser. Restricted, read-only keys are recommended; the only optional write permission lets
  the app register its own webhook endpoint.
- Webhooks are verified with their Stripe signing secret.
- Screen URLs contain an unguessable token. They only expose the metrics shown on the screen;
  customer names are hidden unless enabled, and so are the emails of customers without a name
  (masked on the server when a screen asks for it). Regenerating the link revokes the old one.
- A screen may also ask for a password, hashed like user passwords. A device that typed it keeps
  an HTTP-only cookie bound to that password (the SaaS Monitor app keeps the same proof and sends
  it in an `X-Screen-Access` header), so changing it locks every device out again. Attempts are
  limited per screen and client address.
- Phones following a screen with the SaaS Monitor app register with its link (and password), and
  are forgotten when the link is regenerated or the password changes. Their notifications go to
  Apple and Google, directly from the instance that publishes the apps, or through the Expo push
  service from the others: they say what the screen's cards say, customer names included only
  when the screen shows them. Registrations are limited per screen and client address, and a
  screen notifies 50 phones at most. The apps' APNs key and Firebase service account
  (`APNS_PRIVATE_KEY`, `FCM_SERVICE_ACCOUNT`) are secrets of that instance alone.
- Every dashboard query is scoped to the workspace of the signed-in member.
- Invitation links work like passwords: email addresses are not verified yet, so whoever opens a
  link can create an account with the invited address and join the workspace. Share them
  privately, and revoke the ones that are no longer needed.
- Behind a reverse proxy, publish the app on localhost only and let the proxy set
  `X-Forwarded-For`, or sign-in rate limits can be bypassed (see
  [Self-hosting](docs/self-hosting.md#public-url-and-https)).
