import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db';

export async function GET() {
  try {
    await setupDatabase();
    return NextResponse.json({ success: true, message: 'Database tables created successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
