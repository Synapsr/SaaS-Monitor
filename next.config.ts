import type { NextConfig } from "next";

/** Identifies a build: open wall displays reload themselves when it changes. */
const buildId = process.env.BUILD_ID ?? Date.now().toString(36);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BUILD_ID: buildId },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The app must not be framed by other sites (clickjacking); displays may be embedded.
      { source: "/((?!d/).*)", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      // Display URLs carry their access token: never leak it, never index it.
      {
        source: "/d/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
