import { NextResponse } from 'next/server';
import { getAllTrails, setupDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseJsonb(val: unknown): string[] {
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return Array.isArray(val) ? val : [];
}

export async function GET() {
  try {
    await setupDatabase();
    const trails = await getAllTrails(true); // active only
    const parsed = trails.map((t: Record<string, unknown>) => ({
      id: String(t.id),
      name: (t.name as string) || '',
      slug: (t.slug as string) || '',
      location: (t.location as string) || '',
      description: (t.description as string) || '',
      longDescription: (t.long_description as string) || '',
      distanceKm: t.distance_km ? Number(t.distance_km) : null,
      durationMinutes: t.duration_minutes ? Number(t.duration_minutes) : null,
      difficulty: (t.difficulty as string) || 'medium',
      alltrailsUrl: (t.alltrails_url as string) || '',
      googleMapsUrl: (t.google_maps_url as string) || '',
      photos: parseJsonb(t.photos),
      tags: parseJsonb(t.tags),
    }));
    return NextResponse.json({ trails: parsed });
  } catch (error) {
    console.error('Error fetching trails:', error);
    return NextResponse.json({ trails: [] });
  }
}
