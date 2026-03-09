import { NextRequest, NextResponse } from 'next/server';
import { getActivityLog, getActivityLogCount, logActivity } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    const [log, total] = await Promise.all([
      getActivityLog(limit, offset),
      getActivityLogCount(),
    ]);
    return NextResponse.json({ log, total });
  } catch (error) {
    console.error('GET /api/admin/activity error:', error);
    return NextResponse.json({ log: [], total: 0, error: 'Failed to load activity log' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actor, role, action, entityType, entityId, entityLabel, details } = body;
    if (!actor || !action) {
      return NextResponse.json({ error: 'actor and action are required' }, { status: 400 });
    }
    const id = await logActivity({ actor, role: role || 'admin', action, entityType, entityId, entityLabel, details });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('POST /api/admin/activity error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
