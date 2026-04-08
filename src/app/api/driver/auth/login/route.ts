import { NextRequest, NextResponse } from 'next/server';
import { getDriverByPin, setupDatabase } from '@/lib/db';
import { createDriverToken } from '@/lib/driver-auth';

let dbReady = false;

export async function POST(request: NextRequest) {
  try {
    if (!dbReady) {
      await setupDatabase();
      dbReady = true;
    }

    const { pin } = await request.json();
    if (!pin || typeof pin !== 'string' || pin.length < 4) {
      return NextResponse.json({ error: 'PIN is required (min 4 digits)' }, { status: 400 });
    }

    const driver = await getDriverByPin(pin);
    if (!driver) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = await createDriverToken(driver.id, driver.name);

    const response = NextResponse.json({
      success: true,
      driver: { id: driver.id, name: driver.name, locale: driver.locale || 'nl' },
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
    console.error('Driver login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
