## What and why

<!-- What does this change, and why is it needed? Link the issue it closes. -->

## How to test

<!-- Steps a reviewer can follow. Screenshots for UI changes (dashboard and wall screen). -->

## Checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] Tenant data is only read or written through `requireWorkspace()`
- [ ] Docs updated if behavior or configuration changed
