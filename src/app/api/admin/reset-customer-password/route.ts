import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByEmail, updateCustomerPassword } from '@/lib/db';
import { hashPassword, generateTemporaryPassword } from '@/lib/password';
import { sql } from '@vercel/postgres';

// POST /api/admin/reset-customer-password { email }
// Genereert een nieuw tijdelijk wachtwoord, slaat de hash op, zet must_change_password=true,
// en retourneert het plaintext wachtwoord zodat de admin het aan de klant kan doorgeven.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const customer = await getCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer niet gevonden' }, { status: 404 });

    const newPassword = generateTemporaryPassword();
    const hash = await hashPassword(newPassword);
    await updateCustomerPassword(customer.id, hash);
    await sql`UPDATE customers SET must_change_password = TRUE, email_verified = TRUE WHERE id = ${customer.id}`;

    return NextResponse.json({
      success: true,
      email,
      temporaryPassword: newPassword,
      mustChangePassword: true,
    });
  } catch (err) {
    console.error('reset-customer-password error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
