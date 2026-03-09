import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/account/', '/mijn-account/', '/borg/', '/betaling/'],
    },
    sitemap: 'https://caravanverhuurspanje.com/sitemap.xml',
  };
}
