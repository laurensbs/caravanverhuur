import { NextRequest, NextResponse } from 'next/server';
import { globalSearch } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ bookings: [], contacts: [], customers: [] });
    }
    const results = await globalSearch(q);
    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/admin/search error:', error);
    return NextResponse.json({ bookings: [], contacts: [], customers: [], error: 'Search failed' }, { status: 500 });
  }
}
