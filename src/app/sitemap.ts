import type { MetadataRoute } from 'next';
import { campings } from '@/data/campings';
import { destinations } from '@/data/destinations';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://caravanverhuurspanje.com';
  const now = new Date();

  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/boeken', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/over-ons', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/voorwaarden', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  const campingSlugs = campings.map(c => c.slug);

  return [
    ...staticPages.map(page => ({
      url: `${baseUrl}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    { url: `${baseUrl}/bestemmingen`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...campingSlugs.map(slug => ({
      url: `${baseUrl}/bestemmingen/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...destinations.map(d => ({
      url: `${baseUrl}/bestemmingen/${d.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
