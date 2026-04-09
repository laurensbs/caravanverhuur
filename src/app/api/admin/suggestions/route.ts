import { NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

function getPool() {
  return createPool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });
}

export async function GET() {
  try {
    const pool = getPool();
    const sql = pool.sql.bind(pool);
    const now = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const sevenDaysAhead = new Date(Date.now() + 7 * 86400000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      newBookings,
      overduePayments,
      upcomingCheckins,
      upcomingCheckouts,
      pendingBorg,
      unansweredContacts,
      activeChats,
      recentBookingsCount,
      monthlyRevenue,
      totalOpen,
      overdueRemaining,
      borgDisputes,
    ] = await Promise.all([
      // New unprocessed bookings
      sql`SELECT COUNT(*) as count, 
           json_agg(json_build_object('ref', reference, 'guest', guest_name, 'date', check_in) ORDER BY created_at DESC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status = 'NIEUW'`,

      // Overdue payments (open > 3 days)
      sql`SELECT COUNT(*) as count,
           COALESCE(SUM(amount), 0) as total_amount,
           json_agg(json_build_object('ref', b.reference, 'guest', b.guest_name, 'amount', p.amount, 'type', p.type, 'days', EXTRACT(DAY FROM NOW() - p.created_at)::int) ORDER BY p.created_at ASC) FILTER (WHERE b.reference IS NOT NULL) as items
           FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id
           WHERE p.status = 'OPENSTAAND' AND p.created_at < ${threeDaysAgo}`,

      // Check-ins in the next 7 days
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('ref', reference, 'guest', guest_name, 'date', check_in, 'caravan', caravan_id, 'camping', camping_id) ORDER BY check_in ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status NOT IN ('GEANNULEERD', 'AFGEROND') AND check_in >= ${now} AND check_in <= ${sevenDaysAhead}`,

      // Check-outs in the next 7 days
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('ref', reference, 'guest', guest_name, 'date', check_out) ORDER BY check_out ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status NOT IN ('GEANNULEERD', 'AFGEROND') AND check_out >= ${now} AND check_out <= ${sevenDaysAhead}`,

      // Pending borg inspections
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('booking_ref', b.reference, 'guest', b.guest_name, 'type', bc.type, 'status', bc.status) ORDER BY bc.created_at DESC) FILTER (WHERE b.reference IS NOT NULL) as items
           FROM borg_checklists bc LEFT JOIN bookings b ON bc.booking_id = b.id
           WHERE bc.status IN ('OPEN', 'IN_BEHANDELING')`,

      // Unanswered contacts (> 24 hours)
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('name', name, 'subject', subject, 'email', email, 'age_hours', EXTRACT(EPOCH FROM NOW() - created_at)::int / 3600) ORDER BY created_at ASC) FILTER (WHERE name IS NOT NULL) as items
           FROM contacts WHERE status = 'NIEUW' AND created_at < ${twentyFourHoursAgo}`,

      // Active chats needing attention
      sql`SELECT COUNT(*) as count FROM chat_conversations 
           WHERE (status IN ('ACTIVE', 'active', 'waiting') OR needs_human = true) AND status != 'CLOSED'`.catch(() => ({ rows: [{ count: 0 }] })),

      // Bookings created this month
      sql`SELECT COUNT(*) as count FROM bookings WHERE created_at >= ${monthStart}`,

      // Revenue this month
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'BETAALD' AND paid_at >= ${monthStart}`,

      // Total open payment amount
      sql`SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE status = 'OPENSTAAND'`,

      // Bookings with remaining payment due within 7 days of check-in
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('ref', reference, 'guest', guest_name, 'remaining', remaining_amount, 'check_in', check_in) ORDER BY check_in ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE remaining_amount > 0 AND status NOT IN ('GEANNULEERD', 'AFGEROND', 'VOLLEDIG_BETAALD') AND check_in <= ${sevenDaysAhead} AND check_in >= ${now}`,

      // Borg disputes
      sql`SELECT COUNT(*) as count FROM borg_checklists WHERE status = 'KLANT_BEZWAAR'`.catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    return NextResponse.json({
      newBookings: { count: parseInt(newBookings.rows[0].count as string) || 0, items: newBookings.rows[0].items || [] },
      overduePayments: { count: parseInt(overduePayments.rows[0].count as string) || 0, totalAmount: parseFloat(overduePayments.rows[0].total_amount as string) || 0, items: overduePayments.rows[0].items || [] },
      upcomingCheckins: { count: parseInt(upcomingCheckins.rows[0].count as string) || 0, items: upcomingCheckins.rows[0].items || [] },
      upcomingCheckouts: { count: parseInt(upcomingCheckouts.rows[0].count as string) || 0, items: upcomingCheckouts.rows[0].items || [] },
      pendingBorg: { count: parseInt(pendingBorg.rows[0].count as string) || 0, items: pendingBorg.rows[0].items || [] },
      unansweredContacts: { count: parseInt(unansweredContacts.rows[0].count as string) || 0, items: unansweredContacts.rows[0].items || [] },
      activeChats: { count: parseInt(activeChats.rows[0].count as string) || 0 },
      monthlyBookings: parseInt(recentBookingsCount.rows[0].count as string) || 0,
      monthlyRevenue: parseFloat(monthlyRevenue.rows[0].total as string) || 0,
      openPayments: { count: parseInt(totalOpen.rows[0].count as string) || 0, total: parseFloat(totalOpen.rows[0].total as string) || 0 },
      overdueRemaining: { count: parseInt(overdueRemaining.rows[0].count as string) || 0, items: overdueRemaining.rows[0].items || [] },
      borgDisputes: parseInt(borgDisputes.rows[0].count as string) || 0,
    });
  } catch (error) {
    console.error('GET /api/admin/suggestions error:', error);
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 });
  }
}
