import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBySessionToken, getSavedTrails, saveTrail, unsaveTrail, setupDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('customer_session')?.value;
    if (!token) return NextResponse.json({ savedTrailIds: [] });

    const customer = await getCustomerBySessionToken(token);
    if (!customer) return NextResponse.json({ savedTrailIds: [] });

    const savedTrailIds = await getSavedTrails(customer.id);
    return NextResponse.json({ savedTrailIds });
  } catch {
    return NextResponse.json({ savedTrailIds: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await setupDatabase();
    const token = request.cookies.get('customer_session')?.value;
    if (!token) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const customer = await getCustomerBySessionToken(token);
    if (!customer) return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });

    const { trailId, action } = await request.json();
    if (!trailId) return NextResponse.json({ error: 'Trail ID verplicht' }, { status: 400 });

    if (action === 'unsave') {
      await unsaveTrail(customer.id, trailId);
    } else {
      await saveTrail(customer.id, trailId);
    }

    const savedTrailIds = await getSavedTrails(customer.id);
    return NextResponse.json({ success: true, savedTrailIds });
  } catch (error) {
    console.error('Error saving trail:', error);
    return NextResponse.json({ error: 'Fout bij opslaan' }, { status: 500 });
  }
}
