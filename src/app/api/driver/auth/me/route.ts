import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverRequest } from '@/lib/driver-auth';
import { getDriverById } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await verifyDriverRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const driver = await getDriverById(session.id);
  if (!driver || !driver.active) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    driver: { id: driver.id, name: driver.name, locale: driver.locale || 'nl' },
  });
}
