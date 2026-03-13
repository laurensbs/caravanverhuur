import type { NextConfig } from "next";

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
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    // Old destination slugs → main bestemmingen (campings) page
    const oldDestinationSlugs = [
      'pals', 'estartit', 'roses', 'lloret-de-mar', 'cadaques', 'blanes',
      'sant-pere-pescador', 'tossa-de-mar', 'begur', 'calella-de-palafrugell',
      'platja-daro', 'empuriabrava', 'figueres', 'palamos',
    ];
    return oldDestinationSlugs.map(slug => ({
      source: `/bestemmingen/${slug}`,
      destination: '/bestemmingen',
      permanent: true,
    }));
  },
};

export default nextConfig;
