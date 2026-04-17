import { NextResponse } from 'next/server';
import { getAllDestinations, setupDatabase } from '@/lib/db';
import { destinations as staticDestinations } from '@/data/destinations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const dbOverrides = await getAllDestinations();

    // Build lookup by slug
    const overrideMap = new Map<string, Record<string, unknown>>();
    for (const d of dbOverrides) {
      const row = d as Record<string, unknown>;
      overrideMap.set(row.slug as string, row);
    }

    // Merge static destinations with DB overrides
    const merged = staticDestinations.map(dest => {
      const override = overrideMap.get(dest.slug);
      if (!override) return dest;

      const heroImage = (override.hero_image as string) || dest.heroImage;
      const rawGallery = typeof override.gallery === 'string'
        ? JSON.parse(override.gallery)
        : (override.gallery || []);
      const gallery = (rawGallery as string[]).length > 0 ? rawGallery as string[] : dest.gallery;

      const description = (override.description as string) || dest.description;
      const longDescription = (override.long_description as string) || dest.longDescription;
      const travelTip = (override.travel_tip as string) || dest.travelTip;

      const rawHighlights = typeof override.highlights === 'string'
        ? JSON.parse(override.highlights)
        : override.highlights;
      const highlights = Array.isArray(rawHighlights) && rawHighlights.length > 0 ? rawHighlights as string[] : dest.highlights;

      const rawBeaches = typeof override.beaches === 'string'
        ? JSON.parse(override.beaches)
        : override.beaches;
      const beaches = Array.isArray(rawBeaches) && rawBeaches.length > 0 ? rawBeaches : dest.beaches;

      return { ...dest, heroImage, gallery, description, longDescription, highlights, travelTip, beaches };
    });

    return NextResponse.json({ destinations: merged });
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        await setupDatabase();
      } catch { /* ignore */ }
    }
    // Fallback to static
    return NextResponse.json({ destinations: staticDestinations });
  }
}
