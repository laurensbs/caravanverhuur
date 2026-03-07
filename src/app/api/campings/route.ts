import { NextResponse } from 'next/server';
import { getAllCampings } from '@/lib/db';
import { campings as staticCampings } from '@/data/campings';

// GET - Returns all active campings (DB campings take priority, falls back to static)
export async function GET() {
  try {
    const dbCampings = await getAllCampings(true); // active only
    if (dbCampings.length > 0) {
      return NextResponse.json({ campings: dbCampings, source: 'db' });
    }
    // Fallback to static campings if no DB campings exist yet
    return NextResponse.json({
      campings: staticCampings.map(c => ({
        id: c.id,
        name: c.name,
        location: c.location,
        description: c.description,
        website: c.website || '',
        active: true,
      })),
      source: 'static',
    });
  } catch {
    // Fallback to static
    return NextResponse.json({
      campings: staticCampings.map(c => ({
        id: c.id,
        name: c.name,
        location: c.location,
        description: c.description,
        website: c.website || '',
        active: true,
      })),
      source: 'static',
    });
  }
}
