import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByEmail } from '@/lib/db';

// GET /api/admin/debug-customer?email=...
// Diagnose: bestaat de customer, hoe is het account opgezet?
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = (request.nextUrl.searchParams.get('email') || '').toLowerCase().trim();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  try {
    const c = await getCustomerByEmail(email);
    if (!c) return NextResponse.json({ exists: false, email });
    return NextResponse.json({
      exists: true,
      email: c.email,
      id: c.id,
      name: c.name,
      hasPasswordHash: !!c.password_hash,
      passwordHashPrefix: c.password_hash ? String(c.password_hash).slice(0, 7) : null,
      emailVerified: !!c.email_verified,
      mustChangePassword: !!c.must_change_password,
      createdAt: c.created_at,
      lastLogin: c.last_login,
    });
  } catch (err) {
    console.error('debug-customer error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
