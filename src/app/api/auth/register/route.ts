import { NextRequest, NextResponse } from 'next/server';
import { createCustomer, getCustomerByEmail, setupDatabase } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import { hashPassword } from '@/lib/password';
import { registerLimiter, getClientIp } from '@/lib/rate-limit';
import { createEmailVerificationToken } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rl = await registerLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Te veel registratiepogingen. Probeer het over ${rl.retryAfter} seconden opnieuw.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    const { email, password, name, phone, locale } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, wachtwoord en naam zijn verplicht' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 6 tekens bevatten' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await getCustomerByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: 'Er bestaat al een account met dit e-mailadres' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const customerLocale = ['nl', 'en', 'es'].includes(locale) ? locale : 'nl';
    const { id } = await createCustomer({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim(),
      locale: customerLocale,
    });

    // Send combined welcome + verification email (non-blocking) — NO auto-login
    createEmailVerificationToken(id).then(token => {
      const verifyUrl = `https://caravanverhuurspanje.com/api/auth/verify-email?token=${token}`;
      return sendWelcomeEmail(email.toLowerCase().trim(), name.trim(), customerLocale, verifyUrl);
    }).catch(err => console.error('Welcome email failed:', err));

    return NextResponse.json({ success: true, needsVerification: true, customerId: id });
  } catch (error: unknown) {
    console.error('Register error:', error);
    // Auto-setup database tables if they don't exist
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
