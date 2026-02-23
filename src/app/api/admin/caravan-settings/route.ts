import { NextRequest, NextResponse } from 'next/server';
import { getCaravanSettings, upsertCaravanSetting, getAvailableCaravanIds } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unavailableOnly = searchParams.get('unavailable');

    if (unavailableOnly === 'true') {
      const unavailableIds = await getAvailableCaravanIds();
      return NextResponse.json({ unavailableIds });
    }

    const settings = await getCaravanSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/admin/caravan-settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch caravan settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { caravanId, available, status, adminNotes } = body;

    if (!caravanId) {
      return NextResponse.json({ error: 'Missing caravanId' }, { status: 400 });
    }

    await upsertCaravanSetting(
      caravanId,
      available !== undefined ? available : true,
      status || (available === false ? 'NIET_BESCHIKBAAR' : 'BESCHIKBAAR'),
      adminNotes
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/caravan-settings error:', error);
    return NextResponse.json({ error: 'Failed to update caravan settings' }, { status: 500 });
  }
}
