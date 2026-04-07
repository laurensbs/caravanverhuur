import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, createAdminToken } from '@/lib/admin-auth';
import { getAdminUserByUsername, updateAdminUserPassword } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminRequest(request);
    if (!session || session.user === 'staff') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' }, { status: 400 });
    }

    const dbUser = await getAdminUserByUsername(session.user);
    if (!dbUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // If not first-login, verify current password
    if (!dbUser.must_change_password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Huidig wachtwoord is verplicht' }, { status: 400 });
      }
      const { valid } = await verifyPassword(currentPassword, dbUser.password_hash);
      if (!valid) {
        return NextResponse.json({ error: 'Huidig wachtwoord is onjuist' }, { status: 401 });
      }
    }

    const newHash = await hashPassword(newPassword);
    await updateAdminUserPassword(session.user, newHash);

    // Refresh the token
    const token = await createAdminToken(session.user, dbUser.role);
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Fout bij wachtwoord wijzigen' }, { status: 500 });
  }
}
