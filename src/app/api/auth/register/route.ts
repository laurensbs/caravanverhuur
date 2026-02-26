import { NextRequest, NextResponse } from 'next/server';
import { createCustomer, getCustomerByEmail, createCustomerSession, setupDatabase } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

// Simple password hashing (SHA-256 with salt)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hashHex}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

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
    const { id } = await createCustomer({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim(),
    });

    // Auto-login: create session
    const session = await createCustomerSession(id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email.toLowerCase().trim(), name.trim()).catch(err => 
      console.error('Welcome email failed:', err)
    );

    const response = NextResponse.json({ success: true, customerId: id });
    response.cookies.set('customer_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Register error:', error);
    // Auto-setup database tables if they don't exist
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('does not exist') || msg.includes('relation')) {
      try {
        await setupDatabase();
        // Retry not needed - user can try again
        return NextResponse.json({ error: 'Database was zojuist opgezet. Probeer het nogmaals.' }, { status: 503 });
      } catch (setupErr) {
        console.error('Auto-setup failed:', setupErr);
      }
    }
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
