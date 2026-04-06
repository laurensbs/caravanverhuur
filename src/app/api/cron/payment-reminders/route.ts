import { NextResponse } from 'next/server';
import { sendPaymentReminderEmail } from '@/lib/email';
import { createPool } from '@vercel/postgres';

// Sends payment reminders for outstanding payments (AANBETALING, HUUR, or legacy RESTBETALING)
// Triggers at: 30 days, 14 days, and 7 days before check-in
// POST /api/cron/payment-reminders

const REMINDER_DAYS = [30, 14, 7];

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = createPool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    // Find all bookings with outstanding HUUR or RESTBETALING and future check-in
    const result = await pool.sql`
      SELECT b.id, b.reference, b.guest_name, b.guest_email, b.caravan_id, b.camping_id,
             b.check_in, b.check_out, b.total_price, b.remaining_amount,
             p.id as payment_id, p.amount as payment_amount,
             c.locale
      FROM bookings b
      JOIN payments p ON p.booking_id = b.id
      LEFT JOIN customers c ON LOWER(c.email) = LOWER(b.guest_email)
      WHERE b.status NOT IN ('GEANNULEERD')
        AND b.check_in > NOW()
        AND p.type IN ('AANBETALING', 'HUUR', 'RESTBETALING')
        AND p.status = 'OPENSTAAND'
    `;

    const rows = result.rows;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sentCount = 0;
    const errors: string[] = [];

    const { caravans } = await import('@/data/caravans');
    const { campings } = await import('@/data/campings');

    let customCaravans: { id: string; name: string }[] = [];
    try {
      const cr = await pool.sql`SELECT id, name FROM custom_caravans`;
      customCaravans = cr.rows as { id: string; name: string }[];
    } catch { /* table might not exist */ }

    let dbCampings: { id: string; name: string }[] = [];
    try {
      const cr = await pool.sql`SELECT id, name FROM campings WHERE active = true`;
      dbCampings = cr.rows as { id: string; name: string }[];
    } catch { /* table might not exist */ }

    const getCaravanName = (id: string) =>
      caravans.find(c => c.id === id)?.name || customCaravans.find(c => c.id === id)?.name || 'Caravan';

    const getCampingName = (id: string) =>
      dbCampings.find(c => c.id === id)?.name || campings.find(c => c.id === id)?.name || 'Camping';

    for (const row of rows) {
      const checkIn = new Date(row.check_in);
      checkIn.setHours(0, 0, 0, 0);
      const daysUntil = Math.round((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (REMINDER_DAYS.includes(daysUntil)) {
        try {
          const emailResult = await sendPaymentReminderEmail({
            to: row.guest_email,
            guestName: row.guest_name,
            reference: row.reference,
            caravanName: getCaravanName(row.caravan_id),
            campingName: getCampingName(row.camping_id),
            checkIn: row.check_in,
            amount: parseFloat(row.payment_amount),
            daysUntil,
          }, row.locale);

          if (emailResult.success) {
            sentCount++;
          } else {
            errors.push(`${row.reference}: ${emailResult.error}`);
          }
        } catch (err) {
          errors.push(`${row.reference}: ${String(err)}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: rows.length,
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Payment reminder cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
