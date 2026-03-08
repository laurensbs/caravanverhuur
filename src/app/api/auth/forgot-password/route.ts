import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByEmail, createPasswordResetToken } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { passwordResetLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rl = passwordResetLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Te veel verzoeken. Probeer het over ${rl.retryAfter} seconden opnieuw.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 });
    }

    const customer = await getCustomerByEmail(email.toLowerCase().trim());

    // Always return success to prevent email enumeration
    if (!customer) {
      return NextResponse.json({ success: true });
    }

    const token = await createPasswordResetToken(customer.id);
    const resetUrl = `https://caravanverhuurspanje.com/account?reset=${token}`;

    await sendPasswordResetEmail(customer.email, customer.name, resetUrl, customer.locale);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
