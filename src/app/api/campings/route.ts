import { NextResponse } from 'next/server';
import { getAllCampings } from '@/lib/db';
import { campings as staticCampings } from '@/data/campings';

function mapStaticCamping(c: typeof staticCampings[0]) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    location: c.location,
    region: c.region,
    description: c.description,
    long_description: c.longDescription || '',
    website: c.website || '',
    photos: c.photos,
    facilities: c.facilities,
    best_for: c.bestFor,
    nearest_destinations: c.nearestDestinations,
    latitude: c.coordinates.lat,
    longitude: c.coordinates.lng,
    active: true,
  };
}

// GET - Returns all active campings (DB campings take priority, falls back to static)
// Always enriches with static photos (local paths guaranteed to work)
export async function GET() {
  try {
    const dbCampings = await getAllCampings(true); // active only
    if (dbCampings.length > 0) {
      // Build a map of static campings by name for photo fallback
      const staticMap = new Map(staticCampings.map(c => [c.name.toLowerCase(), c]));

      // Parse JSONB fields from DB
      const parsed = dbCampings.map((c: Record<string, unknown>) => {
        const dbPhotos = typeof c.photos === 'string' ? JSON.parse(c.photos) : (c.photos || []);
        // Always prefer static photos (local paths) over DB photos (may be broken external URLs)
        const staticMatch = staticMap.get(((c.name as string) || '').toLowerCase());
        const photos = staticMatch && staticMatch.photos.length > 0 ? staticMatch.photos : dbPhotos;

        return {
          ...c,
          photos,
          facilities: typeof c.facilities === 'string' ? JSON.parse(c.facilities) : (c.facilities || []),
          best_for: typeof c.best_for === 'string' ? JSON.parse(c.best_for) : (c.best_for || []),
          nearest_destinations: typeof c.nearest_destinations === 'string' ? JSON.parse(c.nearest_destinations) : (c.nearest_destinations || []),
        };
      });
      return NextResponse.json({ campings: parsed, source: 'db' });
    }
    // Fallback to static campings if no DB campings exist yet
    return NextResponse.json({
      campings: staticCampings.map(mapStaticCamping),
      source: 'static',
    });
  } catch {
    // Fallback to static
    return NextResponse.json({
      campings: staticCampings.map(mapStaticCamping),
      source: 'static',
    });
  }
}
