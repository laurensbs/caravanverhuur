import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBySessionToken, updateCustomerPassword, clearCustomerMustChangePassword } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';

// POST /api/auth/change-password — verandert het wachtwoord van de ingelogde klant.
// Verifieert het huidige wachtwoord, slaat het nieuwe op, en wist must_change_password.
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('customer_session')?.value;
    if (!token) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const customer = await getCustomerBySessionToken(token);
    if (!customer) return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Huidig en nieuw wachtwoord zijn verplicht' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Nieuw wachtwoord moet minimaal 8 tekens zijn' }, { status: 400 });
    }

    const { valid } = await verifyPassword(currentPassword, customer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Huidig wachtwoord klopt niet' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    await updateCustomerPassword(customer.id, newHash);
    await clearCustomerMustChangePassword(customer.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('change-password error:', err);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
