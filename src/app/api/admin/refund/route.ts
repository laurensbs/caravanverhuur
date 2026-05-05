import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentById, updatePaymentStatus, getBookingById, logActivity, getCustomerByEmail } from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';
import { parseJson } from '@/lib/validate';
import { sendRefundConfirmationEmail } from '@/lib/email';

const RefundSchema = z.object({
  paymentId: z.string().min(1).max(64),
  // Optional admin-written note. Shown to the customer in the email.
  note: z.string().trim().max(500).optional(),
  // Default true — admin can untick to suppress mail (e.g. when refund
  // was already communicated otherwise).
  notifyCustomer: z.boolean().optional().default(true),
});

// POST /api/admin/refund — Mark a payment as refunded + optional klant-mail.
// Refunds zelf gebeuren handmatig in Holded/Stripe; deze endpoint update
// alleen onze DB-status en stuurt de bevestigingsmail.
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson(request, RefundSchema);
    if (!parsed.ok) return parsed.response;
    const { paymentId, note, notifyCustomer } = parsed.data;

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Betaling niet gevonden' }, { status: 404 });
    }

    if (payment.status !== 'BETAALD') {
      return NextResponse.json({ error: 'Alleen betaalde betalingen kunnen worden gemarkeerd als terugbetaald' }, { status: 400 });
    }

    await updatePaymentStatus(paymentId, 'TERUGBETAALD');

    const booking = payment.booking_id ? await getBookingById(payment.booking_id) : null;
    const session = getSessionFromHeaders(request);

    // Audit-log met note voor traceability — wie, hoeveel, waarom.
    logActivity({
      actor: session.user,
      role: session.role,
      action: 'payment_refund',
      entityType: 'payment',
      entityId: paymentId,
      entityLabel: booking?.reference || paymentId,
      details: `€${payment.amount} gemarkeerd als terugbetaald${note ? ` — reden: ${note}` : ''} (verwerk handmatig in Holded/Stripe)`,
    }).catch(() => {});

    // Klantmail (best effort — falen niet de hele actie).
    let mailSent = false;
    let mailError: string | undefined;
    if (notifyCustomer && booking?.guest_email) {
      try {
        const customer = await getCustomerByEmail(booking.guest_email).catch(() => null);
        const result = await sendRefundConfirmationEmail(booking.guest_email, {
          guestName: booking.guest_name,
          reference: booking.reference,
          amount: parseFloat(payment.amount),
          note,
          partial: false,
        }, customer?.locale || 'nl');
        mailSent = !!result.success;
        mailError = result.error;
      } catch (err) {
        console.error('[refund] mail err:', err);
        mailError = String(err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Betaling gemarkeerd als terugbetaald — verwerk de daadwerkelijke refund in Holded/Stripe',
      mailSent,
      mailError,
      payment: {
        id: paymentId,
        amount: payment.amount,
        bookingRef: booking?.reference,
      },
    });
  } catch (error) {
    console.error('POST /api/admin/refund error:', error);
    return NextResponse.json({ error: 'Markeren als terugbetaald mislukt' }, { status: 500 });
  }
}
