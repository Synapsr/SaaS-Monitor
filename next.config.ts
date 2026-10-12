import type { NextConfig } from "next";

/**
 * Identifies a build: open wall displays reload themselves when it changes. Docker Compose passes
 * an empty `BUILD_ID` when none is set, which must also get a unique value.
 */
const buildId = process.env.BUILD_ID || Date.now().toString(36);

/**
 * Nothing is loaded from other sites except social sign-in avatars, and, on the site and the
 * dashboard, Gleap's help widget (`GLEAP_API_KEY`): its API, live messages, frames and media. One
 * image serves every instance, built before its settings are known, so both allow Gleap whether or
 * not it is set; screens never load it. Inline scripts and styles stay allowed for Next.js
 * hydration; the policy is off in development, where hot reloading needs `eval`.
 */
function contentSecurityPolicy(frameAncestors: string, { support = false } = {}) {
  const gleap = support ? " https://*.gleap.io" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${gleap}`,
    `style-src 'self' 'unsafe-inline'${gleap}`,
    `img-src 'self' data: blob: https://avatars.githubusercontent.com https://*.googleusercontent.com${gleap}`,
    `font-src 'self' data:${gleap}`,
    `connect-src 'self'${support ? " https://*.gleap.io wss://*.gleap.io" : ""}`,
    ...(support ? [`media-src 'self'${gleap}`] : []),
    // Confetti is drawn by a worker created from a blob.
    "worker-src 'self' blob:",
    `frame-src 'self'${gleap}`,
    `frame-ancestors ${frameAncestors}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The Docker image ships the minimal standalone server; `next start` needs the regular output.
  output: process.env.STANDALONE_BUILD === "true" ? "standalone" : undefined,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BUILD_ID: buildId },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The app must not be framed by other sites (clickjacking).
      {
        source: "/((?!d/).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          ...(isProduction
            ? [
                {
                  key: "Content-Security-Policy",
                  value: contentSecurityPolicy("'self'", { support: true }),
                },
              ]
            : []),
        ],
      },
      // Displays may be embedded anywhere. Their URL carries the access token: never leak it,
      // never index it.
      {
        source: "/d/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          ...(isProduction
            ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy("*") }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
