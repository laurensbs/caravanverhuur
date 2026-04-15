import { NextRequest, NextResponse } from 'next/server';
import { getAllTrails, createTrail, updateTrail, deleteTrail, reorderTrails, setupDatabase } from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';
import { logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
};

function parseJsonb(val: unknown): string[] {
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return Array.isArray(val) ? val : [];
}

// GET - List all trails
export async function GET() {
  try {
    await setupDatabase();
    const trails = await getAllTrails();
    const parsed = trails.map((t: Record<string, unknown>) => ({
      ...t,
      photos: parseJsonb(t.photos),
      tags: parseJsonb(t.tags),
    }));
    return NextResponse.json({ trails: parsed }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching trails:', error);
    return NextResponse.json({ error: 'Fout bij ophalen wandelroutes' }, { status: 500 });
  }
}

// POST - Create new trail
export async function POST(request: NextRequest) {
  try {
    await setupDatabase();
    const body = await request.json();
    const { name, location, description, long_description, distance_km, duration_minutes, difficulty, alltrails_url, google_maps_url, photos, tags } = body;

    if (!name?.trim() || !location?.trim()) {
      return NextResponse.json({ error: 'Naam en locatie zijn verplicht' }, { status: 400 });
    }

    const result = await createTrail({
      name, location, description, long_description,
      distance_km: distance_km ? Number(distance_km) : undefined,
      duration_minutes: duration_minutes ? Number(duration_minutes) : undefined,
      difficulty, alltrails_url, google_maps_url, photos, tags,
    });

    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'trail_created', entityType: 'trail', entityId: result.id, entityLabel: name }).catch(() => {});
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error creating trail:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken wandelroute' }, { status: 500 });
  }
}

// PUT - Update trail or reorder
export async function PUT(request: NextRequest) {
  try {
    await setupDatabase();
    const body = await request.json();

    if (body.reorder && Array.isArray(body.orderedIds)) {
      await reorderTrails(body.orderedIds);
      return NextResponse.json({ success: true });
    }

    const { id, name, location, description, long_description, distance_km, duration_minutes, difficulty, alltrails_url, google_maps_url, photos, tags, active } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    await updateTrail(id, {
      name, location, description, long_description,
      distance_km: distance_km !== undefined ? (distance_km ? Number(distance_km) : null) : undefined,
      duration_minutes: duration_minutes !== undefined ? (duration_minutes ? Number(duration_minutes) : null) : undefined,
      difficulty, alltrails_url, google_maps_url, photos, tags, active,
    });

    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'trail_updated', entityType: 'trail', entityId: id, entityLabel: name || `#${id}` }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating trail:', error);
    return NextResponse.json({ error: 'Fout bij updaten wandelroute' }, { status: 500 });
  }
}

// DELETE - Delete trail
export async function DELETE(request: NextRequest) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }
    await deleteTrail(id);
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'trail_deleted', entityType: 'trail', entityId: id, entityLabel: '' }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trail:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen wandelroute' }, { status: 500 });
  }
}
