import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// One-time cleanup: remove all DB caravan overrides so static data shows through
export async function POST() {
  try {
    const result = await sql`DELETE FROM custom_caravans`;
    return NextResponse.json({ success: true, deleted: result.rowCount });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
