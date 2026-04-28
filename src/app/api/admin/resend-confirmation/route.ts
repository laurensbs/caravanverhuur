import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getPaymentById, getBookingById, getCustomerByEmail, getAllCampings, getAllCustomCaravans, updatePaymentStatus, updateBookingStatus, createCustomer, updatePaymentStripeId } from '@/lib/db';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { markHoldedInvoicePaid } from '@/lib/holded';
import { hashPassword, generateTemporaryPassword } from '@/lib/password';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';

// POST /api/admin/resend-confirmation { sessionId } OR { bookingRef }
// Forceer het hele post-payment flow opnieuw: payment op BETAALD, Holded mark paid,
// account aanmaken indien nodig, bevestigingsmail sturen.
// Bedoeld als handmatige fallback wanneer de Stripe webhook niet (correct) is doorgekomen.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const sessionId: string | undefined = body.sessionId;
    const bookingRef: string | undefined = body.bookingRef;

    let paymentId: string | undefined;
    let holdedInvoiceId: string | undefined;

    if (sessionId) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid' && session.payment_status !== 'processing') {
        return NextResponse.json({ error: `Stripe sessie status: ${session.payment_status} — geen betaalde betaling om te bevestigen` }, { status: 400 });
      }
      paymentId = session.metadata?.paymentId;
      holdedInvoiceId = session.metadata?.holdedInvoiceId;
      if (session.payment_intent && paymentId) {
        await updatePaymentStripeId(paymentId, String(session.payment_intent));
      }
    } else if (bookingRef) {
      // Zoek booking via reference, vind de AANBETALING payment
      const { sql } = await import('@vercel/postgres');
      const r = await sql`SELECT p.id, p.holded_invoice_id FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.reference = ${bookingRef} AND p.type = 'AANBETALING' LIMIT 1`;
      if (r.rows.length === 0) return NextResponse.json({ error: 'Booking of payment niet gevonden' }, { status: 404 });
      paymentId = r.rows[0].id as string;
      holdedInvoiceId = (r.rows[0].holded_invoice_id as string) || undefined;
    } else {
      return NextResponse.json({ error: 'Geef sessionId of bookingRef' }, { status: 400 });
    }

    if (!paymentId) return NextResponse.json({ error: 'paymentId niet gevonden' }, { status: 400 });

    const payment = await getPaymentById(paymentId);
    if (!payment) return NextResponse.json({ error: 'Payment niet gevonden' }, { status: 404 });
    const booking = await getBookingById(payment.booking_id);
    if (!booking) return NextResponse.json({ error: 'Booking niet gevonden' }, { status: 404 });

    // 1) Status updates (idempotent)
    if (payment.status !== 'BETAALD') {
      const paidAt = new Date().toISOString();
      await updatePaymentStatus(paymentId, 'BETAALD', paidAt);
    }
    if (payment.type === 'AANBETALING') {
      await updateBookingStatus(payment.booking_id, 'AANBETAALD');
    }

    // 2) Holded factuur op betaald
    if (holdedInvoiceId || payment.holded_invoice_id) {
      try {
        await markHoldedInvoicePaid(holdedInvoiceId || payment.holded_invoice_id);
      } catch (e) {
        console.error('Holded mark paid (resend) failed:', e);
      }
    }

    // 3) Account ensure + bevestigingsmail
    const normalizedEmail = booking.guest_email.toLowerCase().trim();
    let whCustomer = await getCustomerByEmail(normalizedEmail).catch(() => null);
    let temporaryPasswordPlain: string | undefined;
    if (!whCustomer) {
      try {
        temporaryPasswordPlain = generateTemporaryPassword();
        const hash = await hashPassword(temporaryPasswordPlain);
        await createCustomer({
          email: normalizedEmail,
          passwordHash: hash,
          name: booking.guest_name,
          phone: booking.guest_phone,
          locale: 'nl',
          mustChangePassword: true,
          emailVerified: true,
        });
        whCustomer = await getCustomerByEmail(normalizedEmail).catch(() => null);
      } catch (e) {
        console.error('Auto-create customer (resend) failed:', e);
      }
    }

    // Resolve namen
    let caravanName = staticCaravans.find(c => c.id === booking.caravan_id)?.name || '';
    if (!caravanName) {
      try {
        const custom = await getAllCustomCaravans();
        caravanName = (custom.find((c: Record<string, unknown>) => c.id === booking.caravan_id)?.name as string) || booking.caravan_id;
      } catch { caravanName = booking.caravan_id; }
    }
    let campingName: string = booking.camping_id;
    try {
      const dbCampings = await getAllCampings();
      const found = dbCampings.find((c: Record<string, unknown>) => c.id === booking.camping_id);
      if (found) campingName = found.name as string;
      else campingName = staticCampings.find(c => c.id === booking.camping_id)?.name || booking.camping_id;
    } catch {
      campingName = staticCampings.find(c => c.id === booking.camping_id)?.name || booking.camping_id;
    }

    const result = await sendBookingConfirmationEmail(booking.guest_email, {
      guestName: booking.guest_name,
      reference: booking.reference,
      caravanName,
      campingName,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      nights: booking.nights,
      adults: booking.adults,
      children: booking.children,
      totalPrice: parseFloat(booking.total_price),
      paymentDeadline: 'nu',
      immediatePayment: true,
      spotNumber: booking.spot_number || undefined,
      borgAmount: parseFloat(booking.borg_amount),
      hasBedlinnen: !!booking.special_requests && /bedlinnen/i.test(booking.special_requests),
      alreadyPaid: true,
      temporaryPassword: temporaryPasswordPlain,
    }, whCustomer?.locale || 'nl');

    return NextResponse.json({
      success: result.success,
      mailError: result.error,
      bookingRef: booking.reference,
      guestEmail: booking.guest_email,
      newAccountCreated: !!temporaryPasswordPlain,
    });
  } catch (err) {
    console.error('resend-confirmation error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
