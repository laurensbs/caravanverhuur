import { NextResponse } from 'next/server';
import { getBadgeCounts } from '@/lib/db';

export async function GET() {
  try {
    const counts = await getBadgeCounts();
    return NextResponse.json(counts);
  } catch (error) {
    console.error('GET /api/admin/badges error:', error);
    return NextResponse.json({ bookings: 0, contacts: 0, chats: 0, payments: 0 });
  }
}
