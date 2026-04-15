import { NextRequest, NextResponse } from 'next/server';
import { getAllDestinations, upsertDestination, setupDatabase, logActivity } from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
};

// GET - List all destination photo overrides
export async function GET() {
  try {
    const destinations = await getAllDestinations();
    const parsed = destinations.map((d: Record<string, unknown>) => ({
      ...d,
      gallery: typeof d.gallery === 'string' ? JSON.parse(d.gallery) : (d.gallery || []),
    }));
    return NextResponse.json({ destinations: parsed }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        await setupDatabase();
        return NextResponse.json({ destinations: [] }, { headers: NO_CACHE_HEADERS });
      } catch {
        return NextResponse.json({ error: 'Database setup failed' }, { status: 500 });
      }
    }
    console.error('Error fetching destinations:', error);
    return NextResponse.json({ error: 'Fout bij ophalen bestemmingen' }, { status: 500 });
  }
}

// PUT - Update destination photos (heroImage + gallery) by slug
export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromHeaders(request);
    const body = await request.json();
    const { slug, hero_image, gallery } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is verplicht' }, { status: 400 });
    }

    await upsertDestination(slug, { hero_image, gallery });
    logActivity({
      actor: session.user,
      role: session.role,
      action: 'destination_updated',
      entityType: 'destination',
      entityId: slug,
      entityLabel: slug,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating destination:', error);
    return NextResponse.json({ error: 'Fout bij opslaan bestemming' }, { status: 500 });
  }
}
