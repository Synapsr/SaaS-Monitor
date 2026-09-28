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
  customer names are hidden unless enabled. Regenerating the link revokes the old one.
- Every dashboard query is scoped to the workspace of the signed-in member.
