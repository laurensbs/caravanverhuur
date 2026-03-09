import { NextResponse } from 'next/server';
import { getAllCampings } from '@/lib/db';
import { campings as staticCampings } from '@/data/campings';

// Always fetch fresh data from DB — never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function mapStaticCamping(c: typeof staticCampings[0]) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    location: c.location,
    region: c.region,
    description: c.description,
    longDescription: c.longDescription || '',
    website: c.website || '',
    photos: c.photos,
    coordinates: c.coordinates,
    facilities: c.facilities,
    nearestDestinations: c.nearestDestinations,
    bestFor: c.bestFor,
    active: true,
  };
}

function parseJsonb(val: unknown): string[] {
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return Array.isArray(val) ? val : [];
}

// GET - Returns all active campings in Camping interface format (camelCase)
// DB campings take priority; static photos used as fallback when DB photos are empty
export async function GET() {
  try {
    const dbCampings = await getAllCampings(true); // active only
    if (dbCampings.length > 0) {
      // Build a map of static campings by name for photo/data fallback
      const staticMap = new Map(staticCampings.map(c => [c.name.toLowerCase(), c]));

      // Map DB campings to Camping interface (camelCase)
      const parsed = dbCampings.map((c: Record<string, unknown>) => {
        const dbPhotos = parseJsonb(c.photos);
        const staticMatch = staticMap.get(((c.name as string) || '').toLowerCase());
        // Use DB photos if admin has set them (non-empty), otherwise fall back to static
        const photos = dbPhotos.length > 0 ? dbPhotos : (staticMatch?.photos || []);

        return {
          id: String(c.id),
          name: (c.name as string) || '',
          slug: (c.slug as string) || '',
          location: (c.location as string) || '',
          region: (c.region as string) || staticMatch?.region || 'Baix Empordà',
          description: (c.description as string) || staticMatch?.description || '',
          longDescription: (c.long_description as string) || staticMatch?.longDescription || '',
          website: (c.website as string) || staticMatch?.website || '',
          photos,
          coordinates: {
            lat: Number(c.latitude) || staticMatch?.coordinates?.lat || 0,
            lng: Number(c.longitude) || staticMatch?.coordinates?.lng || 0,
          },
          facilities: parseJsonb(c.facilities).length > 0 ? parseJsonb(c.facilities) : (staticMatch?.facilities || []),
          nearestDestinations: parseJsonb(c.nearest_destinations).length > 0 ? parseJsonb(c.nearest_destinations) : (staticMatch?.nearestDestinations || []),
          bestFor: parseJsonb(c.best_for).length > 0 ? parseJsonb(c.best_for) : (staticMatch?.bestFor || []),
          active: true,
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
