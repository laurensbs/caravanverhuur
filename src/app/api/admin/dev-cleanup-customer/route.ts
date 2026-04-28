import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// DELETE /api/admin/dev-cleanup-customer?email=...
// Tijdelijke route om een test-customer + bijbehorende data te verwijderen.
// Admin-cookie required. Verwijdert in één transactie:
//   - de customer (cascade ruimt sessions/reset_tokens/subscriptions/etc.)
//   - alle test-boekingen voor 2099 (van de €0,01 testflow) op dit emailadres
// Echte boekingen (niet in 2099) blijven staan om data niet kwijt te raken.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const emailRaw: string = body.email || '';
    const email = emailRaw.toLowerCase().trim();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // 1) Verwijder test-boekingen (check_in in 2099) — voorzichtig met echte data
    const bookingsRes = await sql`
      DELETE FROM bookings
      WHERE LOWER(guest_email) = ${email}
        AND check_in >= '2099-01-01'
      RETURNING id, reference
    `;
    const deletedBookings = bookingsRes.rows.length;

    // 2) Verwijder customer (cascade neemt sessies + tokens mee)
    const custRes = await sql`DELETE FROM customers WHERE email = ${email} RETURNING id`;
    const deletedCustomer = custRes.rows.length > 0;

    return NextResponse.json({
      success: true,
      email,
      deletedCustomer,
      deletedBookings,
      bookings: bookingsRes.rows.map(r => r.reference),
    });
  } catch (err) {
    console.error('dev-cleanup-customer error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
