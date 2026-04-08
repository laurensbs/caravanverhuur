import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByEmail, createCustomerSession, updateCustomerLastLogin, setupDatabase, updateCustomerPassword } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/password';
import { loginLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rl = loginLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Te veel inlogpogingen. Probeer het over ${rl.retryAfter} seconden opnieuw.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 });
    }

    const customer = await getCustomerByEmail(email.toLowerCase().trim());
    if (!customer) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 });
    }

    const { valid, needsRehash } = await verifyPassword(password, customer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 });
    }

    // Check email verification
    if (!customer.email_verified) {
      return NextResponse.json({
        error: 'Verifieer eerst je e-mailadres. Controleer je inbox (en spam) voor de bevestigingsmail.',
        needsVerification: true,
        email: customer.email,
      }, { status: 403 });
    }

    // Transparently upgrade legacy SHA-256 hash to bcrypt
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await updateCustomerPassword(customer.id, newHash);
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
