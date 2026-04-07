import { NextRequest, NextResponse } from 'next/server';
import { getLastActivityBatch } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const entityType = request.nextUrl.searchParams.get('type');
    const ids = request.nextUrl.searchParams.get('ids');
    if (!entityType || !ids) {
      return NextResponse.json({ error: 'type and ids are required' }, { status: 400 });
    }
    const entityIds = ids.split(',').filter(Boolean).slice(0, 100);
    const map = await getLastActivityBatch(entityType, entityIds);
    return NextResponse.json(map);
  } catch (error) {
    console.error('GET /api/admin/activity/last error:', error);
    return NextResponse.json({}, { status: 500 });
  }
}
