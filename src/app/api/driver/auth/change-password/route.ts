import { NextRequest, NextResponse } from 'next/server';
import { getDriverById, updateDriver } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { verifyDriverRequest, unauthorizedResponse } from '@/lib/driver-auth';

export async function POST(request: NextRequest) {
  const session = await verifyDriverRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'Current and new password required (min 4 chars)' }, { status: 400 });
    }

    const driver = await getDriverById(session.id);
    if (!driver || !driver.active || !driver.password_hash) {
      return unauthorizedResponse();
    }

    const { valid } = await verifyPassword(currentPassword, driver.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 403 });
    }

    const hash = await hashPassword(newPassword);
    await updateDriver(session.id, { password_hash: hash, password_plain: newPassword });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Driver change-password error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
