import { NextRequest, NextResponse } from 'next/server';
import { getAllPricingRules, getActivePricingRules, createPricingRule, updatePricingRule, deletePricingRule, logActivity, migratePricingRules } from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Auto-migrate: extend hoogseizoen to Aug 30 if still ends Jul 31
    await migratePricingRules().catch(() => {});

    const rules = activeOnly ? await getActivePricingRules() : await getAllPricingRules();
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('GET /api/admin/pricing error:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromHeaders(request);
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, percentage, startDate, endDate, daysBeforeCheckin, minNights, active, priority } = body;

    if (!name || !type || percentage === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = ['seizoen', 'vroegboek', 'lastminute'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const id = await createPricingRule({ name, type, percentage, startDate, endDate, daysBeforeCheckin, minNights, active, priority });

    logActivity({ actor: session.user, role: session.role, action: 'pricing_rule_created', entityType: 'pricing', entityId: id, entityLabel: name, details: `${type}: ${percentage}%` }).catch(() => {});

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('POST /api/admin/pricing error:', error);
    return NextResponse.json({ error: 'Failed to create pricing rule' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSessionFromHeaders(request);
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await updatePricingRule(id, data);

    logActivity({ actor: session.user, role: session.role, action: 'pricing_rule_updated', entityType: 'pricing', entityId: id, entityLabel: data.name || id }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/pricing error:', error);
    return NextResponse.json({ error: 'Failed to update pricing rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromHeaders(request);
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await deletePricingRule(id);

    logActivity({ actor: session.user, role: session.role, action: 'pricing_rule_deleted', entityType: 'pricing', entityId: id }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/pricing error:', error);
    return NextResponse.json({ error: 'Failed to delete pricing rule' }, { status: 500 });
  }
}
