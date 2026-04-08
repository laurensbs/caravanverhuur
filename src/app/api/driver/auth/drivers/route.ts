import { NextResponse } from 'next/server';
import { getActiveDrivers, setupDatabase, seedDefaultDrivers } from '@/lib/db';

let dbReady = false;

export async function GET() {
  try {
    if (!dbReady) {
      await setupDatabase();
      await seedDefaultDrivers();
      dbReady = true;
    }
    const drivers = await getActiveDrivers();
    // Only return id, name, and whether password is set (no sensitive data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = drivers.map((d: any) => ({
      id: d.id,
      name: d.name,
      hasPassword: !!d.password_hash,
    }));
    return NextResponse.json({ drivers: list });
  } catch (error) {
    console.error('GET /api/driver/auth/drivers error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
