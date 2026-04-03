import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampings,
  createCamping,
  updateCamping,
  deleteCamping,
  reorderCampings,
  setupDatabase,
  logActivity,
  migrateCampingsColumns,
} from '@/lib/db';
import { campings as staticCampings } from '@/data/campings';
import { getSessionFromHeaders } from '@/lib/admin-auth';

// Never cache admin API responses
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
};

// GET - List all campings (auto-seeds from static data if DB is empty, syncs missing ones)
export async function GET() {
  try {
    let campings = await getAllCampings();

    // Auto-seed static campings into DB if empty
    if (campings.length === 0 && staticCampings.length > 0) {
      for (const sc of staticCampings) {
        await createCamping({
          name: sc.name,
          slug: sc.slug,
          location: sc.location,
          region: sc.region,
          description: sc.description,
          long_description: sc.longDescription || '',
          website: sc.website || '',
          photos: sc.photos || [],
          facilities: sc.facilities || [],
          best_for: sc.bestFor || [],
          nearest_destinations: sc.nearestDestinations || [],
          latitude: sc.coordinates?.lat,
          longitude: sc.coordinates?.lng,
        });
      }
      campings = await getAllCampings();
    } else if (campings.length < staticCampings.length) {
      // Sync missing static campings into DB
      const existingSlugs = new Set(campings.map((c: Record<string, unknown>) => c.slug));
      const existingNames = new Set(campings.map((c: Record<string, unknown>) => (c.name as string).toLowerCase()));

      for (const sc of staticCampings) {
        if (!existingSlugs.has(sc.slug) && !existingNames.has(sc.name.toLowerCase())) {
          await createCamping({
            name: sc.name,
            slug: sc.slug,
            location: sc.location,
            region: sc.region,
            description: sc.description,
            long_description: sc.longDescription || '',
            website: sc.website || '',
            photos: sc.photos || [],
            facilities: sc.facilities || [],
            best_for: sc.bestFor || [],
            nearest_destinations: sc.nearestDestinations || [],
            latitude: sc.coordinates?.lat,
            longitude: sc.coordinates?.lng,
          });
        }
      }
      campings = await getAllCampings();
    }

    // Parse JSONB fields for the admin UI
    const parsed = campings.map((c: Record<string, unknown>) => ({
      ...c,
      photos: typeof c.photos === 'string' ? JSON.parse(c.photos) : (c.photos || []),
    }));

    return NextResponse.json({ campings: parsed }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    // Auto-create tables if they don't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        await setupDatabase();
        // After setup, seed static campings
        for (const sc of staticCampings) {
          await createCamping({
            name: sc.name,
            slug: sc.slug,
            location: sc.location,
            region: sc.region,
            description: sc.description,
            long_description: sc.longDescription || '',
            website: sc.website || '',
            photos: sc.photos || [],
            facilities: sc.facilities || [],
            best_for: sc.bestFor || [],
            nearest_destinations: sc.nearestDestinations || [],
            latitude: sc.coordinates?.lat,
            longitude: sc.coordinates?.lng,
          });
        }
        const campings = await getAllCampings();
        const parsed = campings.map((c: Record<string, unknown>) => ({
          ...c,
          photos: typeof c.photos === 'string' ? JSON.parse(c.photos) : (c.photos || []),
        }));
        return NextResponse.json({ campings: parsed }, { headers: NO_CACHE_HEADERS });
      } catch (setupError) {
        console.error('Error setting up database for campings:', setupError);
        return NextResponse.json({ error: 'Fout bij database setup' }, { status: 500 });
      }
    }
    console.error('Error fetching campings:', error);
    return NextResponse.json({ error: 'Fout bij ophalen campings' }, { status: 500 });
  }
}

// POST - Create new camping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location, description, website, slug, region, long_description, photos, facilities, best_for, nearest_destinations, latitude, longitude } = body;

    if (!name || !location) {
      return NextResponse.json({ error: 'Naam en locatie zijn verplicht' }, { status: 400 });
    }

    const result = await createCamping({
      name, location, description, website, slug, region, long_description,
      photos, facilities, best_for, nearest_destinations, latitude, longitude,
    });
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'camping_created', entityType: 'camping', entityId: result.id, entityLabel: name }).catch(() => {});
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error creating camping:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken camping' }, { status: 500 });
  }
}

// PUT - Update camping or reorder
export async function PUT(request: NextRequest) {
  try {
    await migrateCampingsColumns();
    const body = await request.json();

    // Reorder mode
    if (body.reorder && Array.isArray(body.orderedIds)) {
      await reorderCampings(body.orderedIds);
      return NextResponse.json({ success: true });
    }

    // Update single camping
    const { id, name, location, description, website, active, slug, region, long_description, photos, facilities, best_for, nearest_destinations, latitude, longitude } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    await updateCamping(id, {
      name, location, description, website, active, slug, region, long_description,
      photos, facilities, best_for, nearest_destinations, latitude, longitude,
    });
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'camping_updated', entityType: 'camping', entityId: id, entityLabel: name || `#${id}` }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating camping:', error);
    return NextResponse.json({ error: 'Fout bij updaten camping' }, { status: 500 });
  }
}

// DELETE - Delete camping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    await deleteCamping(id);
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'camping_deleted', entityType: 'camping', entityId: id, entityLabel: `Camping #${id}` }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting camping:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen camping' }, { status: 500 });
  }
}
