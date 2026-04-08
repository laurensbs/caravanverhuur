import { NextRequest, NextResponse } from 'next/server';
import { getDriverById, updateDriver, setupDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createDriverToken } from '@/lib/driver-auth';

let dbReady = false;

export async function POST(request: NextRequest) {
  try {
    if (!dbReady) {
      await setupDatabase();
      dbReady = true;
    }

    const { driverId, password, locale } = await request.json();
    if (!driverId || !password || password.length < 4) {
      return NextResponse.json({ error: 'Driver ID and password (min 4 chars) required' }, { status: 400 });
    }

    const driver = await getDriverById(driverId);
    if (!driver || !driver.active) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 401 });
    }

    // Only allow setup if no password exists yet
    if (driver.password_hash) {
      return NextResponse.json({ error: 'Password already set' }, { status: 409 });
    }

    const hash = await hashPassword(password);
    await updateDriver(driverId, { password_hash: hash, locale: locale || 'nl' });

    const token = await createDriverToken(driver.id, driver.name);

    const response = NextResponse.json({
      success: true,
      driver: { id: driver.id, name: driver.name, locale: locale || 'nl' },
    });
    response.cookies.set('driver_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Driver setup error:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}
