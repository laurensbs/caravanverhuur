import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByEmail, createEmailVerificationToken } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { loginLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (reuse login limiter)
    const ip = getClientIp(request);
    const rl = loginLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Te veel pogingen. Probeer het over ${rl.retryAfter} seconden opnieuw.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 });
    }

    const customer = await getCustomerByEmail(email.toLowerCase().trim());

    // Always return success to prevent email enumeration
    if (!customer || customer.email_verified) {
      return NextResponse.json({ success: true });
    }

    const token = await createEmailVerificationToken(customer.id);
    const verifyUrl = `https://caravanverhuurspanje.com/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(
      customer.email,
      customer.name,
      verifyUrl,
      customer.locale || 'nl',
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
