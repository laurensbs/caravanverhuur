import { NextRequest, NextResponse } from 'next/server';
import { checkCaravanAvailability } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caravanId = searchParams.get('caravanId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  if (!caravanId || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const available = await checkCaravanAvailability(caravanId, checkIn, checkOut);
    return NextResponse.json({ available });
  } catch {
    // DB not available — assume available (fallback)
    return NextResponse.json({ available: true });
  }
}
