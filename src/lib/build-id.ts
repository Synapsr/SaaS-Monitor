/**
 * Identifies the running build. Displays receive it with every state and reload themselves when
 * the server runs another build (see `useVersionReload`). Set from `BUILD_ID` at build time
 * (`next.config.ts`); outside Next.js, e.g. in tests, there is none.
 */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "development";
