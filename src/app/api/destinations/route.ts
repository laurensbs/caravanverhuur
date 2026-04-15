import { NextResponse } from 'next/server';
import { getAllDestinations, setupDatabase } from '@/lib/db';
import { destinations as staticDestinations } from '@/data/destinations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const dbOverrides = await getAllDestinations();

    // Build lookup by slug
    const overrideMap = new Map<string, { hero_image?: string; gallery?: unknown }>();
    for (const d of dbOverrides) {
      const row = d as Record<string, unknown>;
      overrideMap.set(row.slug as string, {
        hero_image: row.hero_image as string | undefined,
        gallery: row.gallery,
      });
    }

    // Merge static destinations with DB overrides
    const merged = staticDestinations.map(dest => {
      const override = overrideMap.get(dest.slug);
      if (!override) return dest;

      const heroImage = override.hero_image || dest.heroImage;
      const rawGallery = typeof override.gallery === 'string'
        ? JSON.parse(override.gallery)
        : (override.gallery || []);
      const gallery = (rawGallery as string[]).length > 0 ? rawGallery as string[] : dest.gallery;

      return { ...dest, heroImage, gallery };
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
