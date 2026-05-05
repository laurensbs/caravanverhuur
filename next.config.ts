import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'u.cubeupload.com',
      },
      {
        protocol: 'https',
        hostname: 'caravanstalling-spanje.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'planderecuperacion.gob.es',
      },
    ],
  },
  async headers() {
    // CSP runs in REPORT-ONLY first. We log violations but don't block,
    // so we can tighten without breaking Stripe / YouTube / Leaflet tiles.
    // Switch the header name to `Content-Security-Policy` once the report
    // queue is clean for ~1 week.
    const csp = [
      "default-src 'self'",
      // Tailwind 4 + Framer Motion inject inline styles. Switching to
      // nonces requires a middleware that mints one per request — out of
      // scope for this PR.
      "style-src 'self' 'unsafe-inline'",
      // Next App Router still emits some inline scripts. Stripe.js for
      // future embedded checkout. unsafe-inline acceptable in report-only.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://u.cubeupload.com https://caravanstalling-spanje.com https://upload.wikimedia.org https://planderecuperacion.gob.es https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://*.cdninstagram.com https://scontent.cdninstagram.com",
      "font-src 'self' data:",
      // Sentry ingest = *.sentry.io (project-specific subdomain).
      // Stripe API for client-side payment flows.
      "connect-src 'self' https://api.stripe.com https://*.sentry.io https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://graph.instagram.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://play.gumlet.io https://video.gumlet.io",
      "media-src 'self' https://video.gumlet.io",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: 2 years, subdomains, preload-eligible. Only meaningful
          // over HTTPS — Vercel terminates TLS, so this header reaches
          // browsers only on https:// requests anyway.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ];
  },

};

// Wrap with Sentry only when DSN + auth-token are configured.
// Without auth-token, withSentryConfig still works (no sourcemap upload),
// but logs a warning each build. We skip the wrap entirely when no DSN
// is set so the local/CI build stays silent.
const hasSentry = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
);

const withSentry = hasSentry
  ? (cfg: NextConfig) => withSentryConfig(cfg, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : (cfg: NextConfig) => cfg;

// Bundle analyzer: opt-in via ANALYZE=true npm run build. Genereert een
// statische treemap in .next/analyze/ — geen runtime overhead bij normale builds.
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withAnalyzer(withSentry(nextConfig));
