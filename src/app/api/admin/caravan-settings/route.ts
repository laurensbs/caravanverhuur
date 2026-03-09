import { NextRequest, NextResponse } from 'next/server';
import { getCaravanSettings, upsertCaravanSetting, getAvailableCaravanIds, logActivity } from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';

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

    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'caravan_updated', entityType: 'caravan', entityId: caravanId, entityLabel: `Caravan ${caravanId}`, details: available === false ? 'Niet beschikbaar gezet' : 'Beschikbaar gezet' }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/caravan-settings error:', error);
    return NextResponse.json({ error: 'Failed to update caravan settings' }, { status: 500 });
  }
}
