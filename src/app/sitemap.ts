import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://caravanverhuurspanje.com';
  const now = new Date();

  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/caravans', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/boeken', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/over-ons', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/voorwaarden', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  const caravanIds = ['1', '2', '3', '4'];

  const destinationSlugs = [
    'pals', 'estartit', 'begur', 'tossa-de-mar', 'platja-daro',
    'palamos', 'roses', 'cadaques', 'lloret-de-mar', 'sant-feliu-de-guixols',
    'blanes', 'calella-de-palafrugell',
  ];

  return [
    ...staticPages.map(page => ({
      url: `${baseUrl}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...caravanIds.map(id => ({
      url: `${baseUrl}/caravans/${id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: `${baseUrl}/bestemmingen`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
    ...destinationSlugs.map(slug => ({
      url: `${baseUrl}/bestemmingen/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
