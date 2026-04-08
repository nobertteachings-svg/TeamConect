import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/logo.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ...securityHeaders,
        ],
      },
    ];
  },
};

let config = withNextIntl(nextConfig);

try {
  const { withSentryConfig } = await import("@sentry/nextjs");
  config = withSentryConfig(config, {
    org: process.env.SENTRY_ORG || "teamconect",
    project: process.env.SENTRY_PROJECT || "teamconect",
    silent: !process.env.CI,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  });
} catch {
  // Sentry optional
}

export default config;
