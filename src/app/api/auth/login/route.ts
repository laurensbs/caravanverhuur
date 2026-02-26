import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByEmail, createCustomerSession, updateCustomerLastLogin, setupDatabase } from '@/lib/db';

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split(':');
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const computedHash = await crypto.subtle.digest('SHA-256', data);
  const computedHex = Array.from(new Uint8Array(computedHash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHex === storedHash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 });
    }

    const customer = await getCustomerByEmail(email.toLowerCase().trim());
    if (!customer) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 });
    }

    const valid = await verifyPassword(password, customer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 });
    }

    await updateCustomerLastLogin(customer.id);
    const session = await createCustomerSession(customer.id);

    const response = NextResponse.json({
      success: true,
      customer: { id: customer.id, email: customer.email, name: customer.name },
    });
    response.cookies.set('customer_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('does not exist') || msg.includes('relation')) {
      try {
        await setupDatabase();
        return NextResponse.json({ error: 'Database was zojuist opgezet. Probeer het nogmaals.' }, { status: 503 });
      } catch (setupErr) {
        console.error('Auto-setup failed:', setupErr);
      }
    }
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
