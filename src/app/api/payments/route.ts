import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments, updatePaymentStatus, createPayment, getPaymentsByBookingId, getBookingById, getCustomerByEmail, getCustomerBySessionToken, updatePaymentLink, updatePaymentReminderSent, getPaymentById, logActivity, updateBookingStatus } from '@/lib/db';
import { sendPaymentConfirmationEmail, sendPaymentReminderEmail } from '@/lib/email';
import { markPaymentPaid } from '@/lib/payment-flow';
import { getSessionFromHeaders } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get('bookingId');

    if (bookingId) {
      // Require customer session or admin auth for per-booking lookup
      const cookie = request.cookies.get('admin_session')?.value;
      const customerSession = request.cookies.get('customer_session')?.value;
      if (!cookie && !customerSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // If customer (not admin), verify the booking belongs to them
      if (!cookie && customerSession) {
        const customer = await getCustomerBySessionToken(customerSession);
        if (!customer) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const booking = await getBookingById(bookingId);
        if (!booking || booking.guest_email.toLowerCase() !== customer.email.toLowerCase()) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const payments = await getPaymentsByBookingId(bookingId);
      return NextResponse.json({ payments });
    }

    // Listing ALL payments requires admin auth
    const cookie = request.cookies.get('admin_session')?.value;
    const authHeader = request.headers.get('authorization');
    const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payments = await getAllPayments();
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Require admin auth to create payments
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { bookingId, type, amount, status, method } = body;

    if (!bookingId || !type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createPayment({ bookingId, type, amount, status, method });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Require admin auth to update payments
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, status, paidAt } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    await updatePaymentStatus(id, status, paidAt);

    // Send confirmation email when payment is marked as paid
    if (status === 'BETAALD') {
      try {
        // Find the payment to get booking details
        const payments = await getAllPayments();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payment = payments.find((p: any) => p.id === id);
        if (payment) {
          const booking = await getBookingById(payment.booking_id);
          if (booking) {
            const payCustomer = await getCustomerByEmail(booking.guest_email).catch(() => null);
            sendPaymentConfirmationEmail(booking.guest_email, {
              guestName: booking.guest_name,
              reference: booking.reference,
              type: payment.type,
              amount: parseFloat(payment.amount),
              paidAt: paidAt || new Date().toISOString(),
            }, payCustomer?.locale).catch(err => console.error('Payment confirmation email failed:', err));
          }
        }
      } catch (emailErr) {
        console.error('Failed to send payment email:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, action, paymentLink, bookingId } = body;

    // Booking-level actions take bookingId; payment-level actions take id.
    const isBookingAction = action === 'mark-deposit' || action === 'mark-fully-paid'
      || action === 'mark-borg-paid' || action === 'mark-borg-returned';

    if (!isBookingAction && !id) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }
    if (isBookingAction && !bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    if (action === 'update-link') {
      await updatePaymentLink(id, paymentLink || '');
      return NextResponse.json({ success: true });
    }

    if (action === 'mark-paid') {
      // Admin marks an OPENSTAAND payment as BETAALD without going through
      // Stripe. Used when payment came in offline (bank transfer, manual
      // tikkie) or when a Stripe webhook silently dropped.
      const skipEmail = body?.skipEmail === true;
      try {
        const result = await markPaymentPaid({
          paymentId: id,
          source: 'admin',
          skipEmail,
        });
        try {
          const session = getSessionFromHeaders(request);
          await logActivity({
            actor: session.user,
            role: session.role,
            action: 'payment.mark-paid',
            entityType: 'payment',
            entityId: id,
            details: result.alreadyPaid
              ? 'no-op (already BETAALD)'
              : `email=${result.emailSent ? 'sent' : (skipEmail ? 'skipped' : 'failed')}`,
          });
        } catch (logErr) { console.error('[mark-paid] activity log err:', logErr); }
        return NextResponse.json({ success: true, ...result });
      } catch (err) {
        console.error('[mark-paid] err:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'mark-paid failed' }, { status: 500 });
      }
    }

    if (action === 'send-reminder') {
      const payment = await getPaymentById(id);
      if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

      const booking = await getBookingById(payment.booking_id);
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      const customer = await getCustomerByEmail(booking.guest_email).catch(() => null);
      const daysUntil = Math.max(0, Math.ceil((new Date(booking.check_in).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      await sendPaymentReminderEmail({
        to: booking.guest_email,
        guestName: booking.guest_name,
        reference: booking.reference,
        caravanName: '',
        campingName: '',
        checkIn: booking.check_in,
        amount: parseFloat(payment.amount),
        daysUntil,
      }, customer?.locale);

      await updatePaymentReminderSent(id);
      return NextResponse.json({ success: true, reminderSentAt: new Date().toISOString() });
    }

    // ── Booking-level mark actions ─────────────────────────────────────
    // Operate on a booking and its payments collectively. Each is
    // idempotent: re-running won't cause double-mailing or double-marks.

    if (isBookingAction) {
      const booking = await getBookingById(bookingId);
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      const allPayments = await getPaymentsByBookingId(bookingId);
      const session = getSessionFromHeaders(request);
      const skipEmail = body?.skipEmail === true;

      // Helper: ensure a payment of given type exists, return id.
      const ensurePayment = async (type: string, amount: number): Promise<string> => {
        const existing = allPayments.find((p: Record<string, unknown>) => p.type === type);
        if (existing) return existing.id as string;
        const created = await createPayment({ bookingId, type, amount, status: 'OPENSTAAND', method: 'bank' });
        return created.id;
      };

      try {
        if (action === 'mark-deposit') {
          const depositId = await ensurePayment('AANBETALING', Number(booking.deposit_amount || booking.total_price * 0.25));
          const result = await markPaymentPaid({ paymentId: depositId, source: 'admin', skipEmail });
          await logActivity({ actor: session.user, role: session.role, action: 'booking.mark-deposit', entityType: 'booking', entityId: bookingId, entityLabel: booking.reference, details: result.alreadyPaid ? 'already paid' : `email=${result.emailSent ? 'sent' : 'skipped/failed'}` });
          return NextResponse.json({ success: true, ...result });
        }

        if (action === 'mark-fully-paid') {
          // Mark deposit + remaining as paid. Booking → VOLLEDIG_BETAALD.
          const depositId = await ensurePayment('AANBETALING', Number(booking.deposit_amount || booking.total_price * 0.25));
          const remainingAmount = Number(booking.remaining_amount || (booking.total_price - (booking.deposit_amount || booking.total_price * 0.25)));
          const remainingId = await ensurePayment('RESTBETALING', remainingAmount);

          // Deposit through the full mark-paid flow (Holded + email + auto-account).
          // Remaining: just status update — typically paid offline at the camping,
          // no separate Holded proforma, no email needed.
          const depositResult = await markPaymentPaid({ paymentId: depositId, source: 'admin', skipEmail });
          const remainingPayment = await getPaymentById(remainingId);
          if (remainingPayment && remainingPayment.status !== 'BETAALD') {
            await updatePaymentStatus(remainingId, 'BETAALD', new Date().toISOString());
          }
          await updateBookingStatus(bookingId, 'VOLLEDIG_BETAALD');

          await logActivity({ actor: session.user, role: session.role, action: 'booking.mark-fully-paid', entityType: 'booking', entityId: bookingId, entityLabel: booking.reference });
          return NextResponse.json({ success: true, depositResult });
        }

        if (action === 'mark-borg-paid') {
          const borgId = await ensurePayment('BORG', Number(booking.borg_amount || 300));
          const borgPayment = await getPaymentById(borgId);
          if (borgPayment && borgPayment.status !== 'BETAALD') {
            await updatePaymentStatus(borgId, 'BETAALD', new Date().toISOString());
          }
          await logActivity({ actor: session.user, role: session.role, action: 'booking.mark-borg-paid', entityType: 'booking', entityId: bookingId, entityLabel: booking.reference });
          return NextResponse.json({ success: true });
        }

        if (action === 'mark-borg-returned') {
          // Add a BORG_RETOUR record (negative entry) marking refund completed.
          await createPayment({
            bookingId,
            type: 'BORG_RETOUR',
            amount: Number(booking.borg_amount || 300),
            status: 'BETAALD',
            method: 'bank',
          });
          await logActivity({ actor: session.user, role: session.role, action: 'booking.mark-borg-returned', entityType: 'booking', entityId: bookingId, entityLabel: booking.reference });
          return NextResponse.json({ success: true });
        }
      } catch (err) {
        console.error(`[booking-action:${action}] err:`, err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Action failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/payments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
