import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordResetToken, markPasswordResetTokenUsed, updateCustomerPassword, createCustomerSession } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { passwordResetLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = passwordResetLimiter.check(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Te veel pogingen. Probeer het later opnieuw.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token en wachtwoord zijn verplicht' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 6 tekens bevatten' }, { status: 400 });
    }

    const resetToken = await verifyPasswordResetToken(token);
    if (!resetToken) {
      return NextResponse.json({ error: 'Ongeldige of verlopen link. Vraag een nieuwe aan.' }, { status: 400 });
    }

    const newHash = await hashPassword(password);
    await updateCustomerPassword(resetToken.customer_id, newHash);
    await markPasswordResetTokenUsed(token);

    // Auto-login after reset
    const session = await createCustomerSession(resetToken.customer_id);

    const response = NextResponse.json({ success: true });
    response.cookies.set('customer_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
