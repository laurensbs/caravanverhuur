import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createAdminToken } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { user, password } = await request.json();
    if (!user || !password) {
      return NextResponse.json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' }, { status: 400 });
    }

    const result = validateCredentials(user, password);
    if (!result) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }

    const token = await createAdminToken(user, result.role);

    const response = NextResponse.json({ success: true, role: result.role, user });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Inlogfout' }, { status: 500 });
  }
}
