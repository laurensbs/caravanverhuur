import { NextResponse } from 'next/server';
import { sendReviewRequestEmail } from '@/lib/email';
import { createPool } from '@vercel/postgres';

// This route sends review request emails 2 days after checkout.
// Called daily via Vercel Cron at 10:00.
// POST /api/cron/review-emails

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = createPool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    // Find bookings where checkout was exactly 2 days ago
    // Only completed/active bookings, not cancelled ones
    const result = await pool.sql`
      SELECT id, reference, guest_name, guest_email, caravan_id, camping_id, check_in, check_out, status
      FROM bookings
      WHERE status NOT IN ('GEANNULEERD')
        AND check_out::date = (CURRENT_DATE - INTERVAL '2 days')::date
        AND id NOT IN (
          SELECT COALESCE(booking_id, '') FROM review_emails_sent
        )
    `;

    const bookings = result.rows;

    // Ensure tracking table exists
    try {
      await pool.sql`
        CREATE TABLE IF NOT EXISTS review_emails_sent (
          id SERIAL PRIMARY KEY,
          booking_id TEXT NOT NULL UNIQUE,
          sent_at TIMESTAMP DEFAULT NOW()
        )
      `;
    } catch {
      // Table might already exist
    }

    // Import static data for caravan/camping names
    const { caravans } = await import('@/data/caravans');
    const { campings } = await import('@/data/campings');

    // Also try to load custom caravans
    let customCaravans: { id: string; name: string }[] = [];
    try {
      const customResult = await pool.sql`SELECT id, name FROM custom_caravans`;
      customCaravans = customResult.rows as { id: string; name: string }[];
    } catch { /* ignore */ }

    // Also try to load DB campings
    let dbCampings: { id: string; name: string }[] = [];
    try {
      const campingResult = await pool.sql`SELECT id, name FROM campings WHERE active = true`;
      dbCampings = campingResult.rows as { id: string; name: string }[];
    } catch { /* ignore */ }

    const getCaravanName = (id: string) => {
      const s = caravans.find(c => c.id === id);
      if (s) return s.name;
      const cu = customCaravans.find(c => c.id === id);
      return cu?.name || 'Caravan';
    };

    const getCampingName = (id: string) => {
      const db = dbCampings.find(camp => camp.id === id);
      if (db) return db.name;
      const c = campings.find(camp => camp.id === id);
      return c?.name || 'Camping';
    };

    let sentCount = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        const emailResult = await sendReviewRequestEmail({
          to: booking.guest_email,
          guestName: booking.guest_name,
          reference: booking.reference,
          caravanName: getCaravanName(booking.caravan_id),
          campingName: getCampingName(booking.camping_id),
          checkIn: booking.check_in,
          checkOut: booking.check_out,
        });

        if (emailResult.success) {
          // Track that we sent this review email
          await pool.sql`
            INSERT INTO review_emails_sent (booking_id) VALUES (${booking.id})
            ON CONFLICT (booking_id) DO NOTHING
          `;
          sentCount++;
        } else {
          errors.push(`${booking.reference}: ${emailResult.error}`);
        }
      } catch (err) {
        errors.push(`${booking.reference}: ${String(err)}`);
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
    console.error('Review emails cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: Request) {
  return POST(request);
}
