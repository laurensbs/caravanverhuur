import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const session = await verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // For DB-based users, fetch extra info
  let displayName = session.user;
  let locale: string | null = null;
  let mustChangePassword = false;
  if (session.user !== 'staff') {
    try {
      const { getAdminUserByUsername } = await import('@/lib/db');
      const dbUser = await getAdminUserByUsername(session.user);
      if (dbUser) {
        displayName = dbUser.display_name;
        locale = dbUser.locale;
        mustChangePassword = dbUser.must_change_password;
      }
    } catch {}
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    role: session.role,
    displayName,
    locale,
    mustChangePassword,
  });
}
