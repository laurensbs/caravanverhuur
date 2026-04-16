import { NextResponse } from 'next/server';
import { getAllTrails } from '@/lib/db';

export const revalidate = 300; // cache 5 minutes

function parseJsonb(val: unknown): string[] {
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return Array.isArray(val) ? val : [];
}

export async function GET() {
  try {
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
    return NextResponse.json({ trails: parsed }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Error fetching trails:', error);
    return NextResponse.json({ trails: [] });
  }
}
