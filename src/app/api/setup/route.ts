import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Only allow in development or with secret key
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const secret = process.env.SETUP_SECRET || 'local-dev-only';

  if (process.env.NODE_ENV === 'production' && key !== secret) {
    return NextResponse.json({ error: 'Niet toegestaan' }, { status: 403 });
  }

  try {
    await setupDatabase();
    return NextResponse.json({ success: true, message: 'Database tables created successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
