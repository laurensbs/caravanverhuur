import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByCaravanId } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const caravanId = request.nextUrl.searchParams.get('caravanId');

    if (!caravanId) {
      return NextResponse.json({ error: 'Missing caravanId' }, { status: 400 });
    }

    const bookings = await getBookingsByCaravanId(caravanId);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET /api/admin/caravan-bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch caravan bookings' }, { status: 500 });
  }
}
