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
    const twoDaysAhead = new Date(Date.now() + 2 * 86400000).toISOString();
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
      incompleteBkgs,
      pendingTasks,
      noBorgSent,
      activeBookings,
      todayCheckins,
      todayCheckouts,
    ] = await Promise.all([
      // New unprocessed bookings
      sql`SELECT COUNT(*) as count, 
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'date', check_in, 'caravan', caravan_id, 'total', total_price) ORDER BY created_at DESC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status = 'NIEUW'`,

      // Overdue payments (open > 3 days)
      sql`SELECT COUNT(*) as count,
           COALESCE(SUM(amount), 0) as total_amount,
           json_agg(json_build_object('id', b.id, 'ref', b.reference, 'guest', b.guest_name, 'amount', p.amount, 'type', p.type, 'days', EXTRACT(DAY FROM NOW() - p.created_at)::int) ORDER BY p.created_at ASC) FILTER (WHERE b.reference IS NOT NULL) as items
           FROM payments p LEFT JOIN bookings b ON p.booking_id = b.id
           WHERE p.status = 'OPENSTAAND' AND p.created_at < ${threeDaysAgo}`,

      // Check-ins in the next 7 days
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'date', check_in, 'caravan', caravan_id, 'camping', camping_id, 'status', status) ORDER BY check_in ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status NOT IN ('GEANNULEERD', 'AFGEROND') AND check_in >= ${now} AND check_in <= ${sevenDaysAhead}`,

      // Check-outs in the next 7 days
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'date', check_out, 'status', status) ORDER BY check_out ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status NOT IN ('GEANNULEERD', 'AFGEROND') AND check_out >= ${now} AND check_out <= ${sevenDaysAhead}`,

      // Pending borg inspections
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', bc.id, 'booking_id', bc.booking_id, 'booking_ref', b.reference, 'guest', b.guest_name, 'type', bc.type, 'status', bc.status) ORDER BY bc.created_at DESC) FILTER (WHERE b.reference IS NOT NULL) as items
           FROM borg_checklists bc LEFT JOIN bookings b ON bc.booking_id = b.id
           WHERE bc.status IN ('OPEN', 'IN_BEHANDELING')`,

      // Unanswered contacts (> 24 hours)
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'name', name, 'subject', subject, 'email', email, 'age_hours', EXTRACT(EPOCH FROM NOW() - created_at)::int / 3600) ORDER BY created_at ASC) FILTER (WHERE name IS NOT NULL) as items
           FROM contacts WHERE status = 'NIEUW' AND created_at < ${twentyFourHoursAgo}`,

      // Active chats needing attention
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'visitor', COALESCE(visitor_name, 'Bezoeker'), 'needs_human', needs_human) ORDER BY updated_at DESC) FILTER (WHERE id IS NOT NULL) as items
           FROM chat_conversations 
           WHERE (status IN ('ACTIVE', 'active', 'waiting') OR needs_human = true) AND status != 'CLOSED'`.catch(() => ({ rows: [{ count: 0, items: null }] })),

      // Bookings created this month
      sql`SELECT COUNT(*) as count FROM bookings WHERE created_at >= ${monthStart}`,

      // Revenue this month  
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'BETAALD' AND paid_at >= ${monthStart}`,

      // Total open payment amount
      sql`SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE status = 'OPENSTAAND'`,

      // Bookings with remaining payment due within 7 days of check-in
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'remaining', remaining_amount, 'check_in', check_in) ORDER BY check_in ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE remaining_amount > 0 AND status NOT IN ('GEANNULEERD', 'AFGEROND', 'VOLLEDIG_BETAALD') AND check_in <= ${sevenDaysAhead} AND check_in >= ${now}`,

      // Borg disputes
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', bc.id, 'booking_id', bc.booking_id, 'booking_ref', b.reference, 'guest', b.guest_name, 'notes', bc.customer_notes) ORDER BY bc.created_at DESC) FILTER (WHERE b.reference IS NOT NULL) as items
           FROM borg_checklists bc LEFT JOIN bookings b ON bc.booking_id = b.id
           WHERE bc.status = 'KLANT_BEZWAAR'`.catch(() => ({ rows: [{ count: 0, items: null }] })),

      // Incomplete bookings (confirmed but missing key details)
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'missing', 
             CASE 
               WHEN caravan_id IS NULL OR caravan_id = '' THEN 'caravan'
               WHEN camping_id IS NULL OR camping_id = '' THEN 'camping'
               WHEN guest_email IS NULL OR guest_email = '' THEN 'email'
               WHEN total_price IS NULL OR total_price = 0 THEN 'prijs'
               ELSE 'onbekend'
             END
           ) ORDER BY created_at DESC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings 
           WHERE status NOT IN ('GEANNULEERD', 'AFGEROND') 
             AND (caravan_id IS NULL OR caravan_id = '' OR camping_id IS NULL OR camping_id = '' OR guest_email IS NULL OR guest_email = '' OR total_price IS NULL OR total_price = 0)`,

      // Pending tasks (not done, due soon)
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', t.id, 'booking_id', t.booking_id, 'type', t.task_type, 'due', t.due_date, 'assigned', t.assigned_to, 'ref', b.reference, 'guest', b.guest_name) ORDER BY t.due_date ASC NULLS LAST) FILTER (WHERE b.reference IS NOT NULL) as items
           FROM booking_tasks t LEFT JOIN bookings b ON t.booking_id = b.id
           WHERE t.status IN ('TODO', 'todo') AND (t.due_date IS NULL OR t.due_date <= ${twoDaysAhead})`.catch(() => ({ rows: [{ count: 0, items: null }] })),

      // Bookings arriving soon without borg checklist  
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', b.id, 'ref', b.reference, 'guest', b.guest_name, 'date', b.check_in) ORDER BY b.check_in ASC) FILTER (WHERE b.reference IS NOT NULL) as items
           FROM bookings b
           WHERE b.status NOT IN ('GEANNULEERD', 'AFGEROND')
             AND b.check_in >= ${now} AND b.check_in <= ${sevenDaysAhead}
             AND NOT EXISTS (SELECT 1 FROM borg_checklists bc WHERE bc.booking_id = b.id AND bc.type = 'INCHECKEN')`.catch(() => ({ rows: [{ count: 0, items: null }] })),

      // Active bookings (currently staying)
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'caravan', caravan_id, 'checkout', check_out) ORDER BY check_out ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status = 'ACTIEF' AND check_in <= ${now} AND check_out >= ${now}`.catch(() => ({ rows: [{ count: 0, items: null }] })),

      // Today's check-ins
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'caravan', caravan_id, 'status', status) ORDER BY check_in ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status NOT IN ('GEANNULEERD', 'AFGEROND') AND check_in::date = CURRENT_DATE`.catch(() => ({ rows: [{ count: 0, items: null }] })),

      // Today's check-outs
      sql`SELECT COUNT(*) as count,
           json_agg(json_build_object('id', id, 'ref', reference, 'guest', guest_name, 'status', status) ORDER BY check_out ASC) FILTER (WHERE reference IS NOT NULL) as items
           FROM bookings WHERE status NOT IN ('GEANNULEERD', 'AFGEROND') AND check_out::date = CURRENT_DATE`.catch(() => ({ rows: [{ count: 0, items: null }] })),
    ]);

    const parse = (row: Record<string, unknown>) => ({
      count: parseInt(row.count as string) || 0,
      items: (row.items as Array<Record<string, unknown>>) || [],
    });
    const parseNum = (row: Record<string, unknown>, key: string) => parseFloat(row[key] as string) || 0;

    return NextResponse.json({
      newBookings: parse(newBookings.rows[0]),
      overduePayments: { ...parse(overduePayments.rows[0]), totalAmount: parseNum(overduePayments.rows[0], 'total_amount') },
      upcomingCheckins: parse(upcomingCheckins.rows[0]),
      upcomingCheckouts: parse(upcomingCheckouts.rows[0]),
      pendingBorg: parse(pendingBorg.rows[0]),
      unansweredContacts: parse(unansweredContacts.rows[0]),
      activeChats: parse(activeChats.rows[0]),
      monthlyBookings: parseInt(recentBookingsCount.rows[0].count as string) || 0,
      monthlyRevenue: parseNum(monthlyRevenue.rows[0], 'total'),
      openPayments: { count: parseInt(totalOpen.rows[0].count as string) || 0, total: parseNum(totalOpen.rows[0], 'total') },
      overdueRemaining: parse(overdueRemaining.rows[0]),
      borgDisputes: parse(borgDisputes.rows[0]),
      incompleteBookings: parse(incompleteBkgs.rows[0]),
      pendingTasks: parse(pendingTasks.rows[0]),
      noBorgSent: parse(noBorgSent.rows[0]),
      activeBookings: parse(activeBookings.rows[0]),
      todayCheckins: parse(todayCheckins.rows[0]),
      todayCheckouts: parse(todayCheckouts.rows[0]),
    });
  } catch (error) {
    console.error('GET /api/admin/suggestions error:', error);
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 });
  }
}
