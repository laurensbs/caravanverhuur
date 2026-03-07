import { NextResponse } from 'next/server';
import { sendCountdownEmail } from '@/lib/email';
import { createPool } from '@vercel/postgres';

// This route is meant to be called daily via Vercel Cron or external cron service.
// It sends countdown emails to guests with upcoming bookings at specific milestones.
// POST /api/cron/countdown-emails

const COUNTDOWN_DAYS = [30, 14, 7, 3, 1];

export async function POST(request: Request) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = createPool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    // Get all active bookings with future check-in dates
    const result = await pool.sql`
      SELECT id, reference, guest_name, guest_email, caravan_id, camping_id, check_in, check_out, status
      FROM bookings
      WHERE status NOT IN ('GEANNULEERD')
        AND check_in > NOW()
    `;

    const bookings = result.rows;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sentCount = 0;
    const errors: string[] = [];

    // Import static data for caravan/camping names
    const { caravans } = await import('@/data/caravans');
    const { campings } = await import('@/data/campings');

    // Also try to load custom caravans
    let customCaravans: { id: string; name: string }[] = [];
    try {
      const customResult = await pool.sql`SELECT id, name FROM custom_caravans`;
      customCaravans = customResult.rows as { id: string; name: string }[];
    } catch {
      // Table might not exist yet
    }

    // Also try to load DB campings
    let dbCampings: { id: string; name: string }[] = [];
    try {
      const campingResult = await pool.sql`SELECT id, name FROM campings WHERE active = true`;
      dbCampings = campingResult.rows as { id: string; name: string }[];
    } catch {
      // Table might not exist yet
    }

    const getCaravanName = (id: string) => {
      const s = caravans.find(c => c.id === id);
      if (s) return s.name;
      const cu = customCaravans.find(c => c.id === id);
      return cu?.name || 'Caravan';
    };

    const getCampingName = (id: string) => {
      // Try DB campings first
      const db = dbCampings.find(camp => camp.id === id);
      if (db) return db.name;
      const c = campings.find(camp => camp.id === id);
      return c?.name || 'Camping';
    };

    for (const booking of bookings) {
      const checkIn = new Date(booking.check_in);
      checkIn.setHours(0, 0, 0, 0);
      const daysUntil = Math.round((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (COUNTDOWN_DAYS.includes(daysUntil)) {
        try {
          const emailResult = await sendCountdownEmail({
            to: booking.guest_email,
            guestName: booking.guest_name,
            reference: booking.reference,
            caravanName: getCaravanName(booking.caravan_id),
            campingName: getCampingName(booking.camping_id),
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            daysUntil,
          });

          if (emailResult.success) {
            sentCount++;
          } else {
            errors.push(`${booking.reference} (${daysUntil}d): ${emailResult.error}`);
          }
        } catch (err) {
          errors.push(`${booking.reference} (${daysUntil}d): ${String(err)}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: bookings.length,
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Countdown cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for easy testing / Vercel Cron
export async function GET(request: Request) {
  return POST(request);
}
