import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentById, updatePaymentStatus, getBookingById, logActivity, getCustomerByEmail, createPayment } from '@/lib/db';
import { getSessionFromHeaders, requireRole } from '@/lib/admin-auth';
import { parseJson } from '@/lib/validate';
import { sendRefundConfirmationEmail } from '@/lib/email';
import { computeRefundPolicy, computeRefundAmount } from '@/lib/refund-policy';

const RefundSchema = z.object({
  paymentId: z.string().min(1).max(64),
  // Optional admin-written note. Shown to the customer in the email.
  note: z.string().trim().max(500).optional(),
  // Default true — admin can untick to suppress mail (e.g. when refund
  // was already communicated otherwise).
  notifyCustomer: z.boolean().optional().default(true),
  // Partial refund: explicit amount in euro's. Omit for full refund.
  amount: z.coerce.number().positive().optional(),
  // Apply the algemene-voorwaarden policy server-side (overrides amount).
  applyPolicy: z.boolean().optional().default(false),
});

// POST /api/admin/refund — Mark a payment as refunded + optional klant-mail.
// Refunds zelf gebeuren handmatig in Holded/Stripe; deze endpoint update
// alleen onze DB-status en stuurt de bevestigingsmail.
export async function POST(request: NextRequest) {
  try {
    const denial = requireRole(request, ['admin']);
    if (denial) return denial;

    const parsed = await parseJson(request, RefundSchema);
    if (!parsed.ok) return parsed.response;
    const { paymentId, note, notifyCustomer, amount: requestedAmount, applyPolicy } = parsed.data;

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Betaling niet gevonden' }, { status: 404 });
    }

    if (payment.status !== 'BETAALD') {
      return NextResponse.json({ error: 'Alleen betaalde betalingen kunnen worden gemarkeerd als terugbetaald' }, { status: 400 });
    }

    const booking = payment.booking_id ? await getBookingById(payment.booking_id) : null;
    const originalAmount = parseFloat(payment.amount);

    // Bepaal het terug te boeken bedrag.
    // 1) applyPolicy → server berekent op basis van algemene voorwaarden
    // 2) requestedAmount → admin specificeert handmatig (partial)
    // 3) niets → full refund van het originele bedrag
    let refundAmount = originalAmount;
    let policyReason: string | undefined;

    if (applyPolicy && booking) {
      const checkIn = new Date(booking.check_in);
      const daysUntil = Math.ceil((checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const policy = computeRefundPolicy({ daysUntilCheckIn: daysUntil, hasPaid: true });
      refundAmount = computeRefundAmount(originalAmount, policy.percentage);
      policyReason = policy.reason;
      if (refundAmount === 0) {
        return NextResponse.json({
          error: 'Volgens de algemene voorwaarden is geen restitutie van toepassing.',
          policy: { percentage: 0, reason: policy.reason, daysUntilCheckIn: daysUntil },
        }, { status: 400 });
      }
    } else if (typeof requestedAmount === 'number') {
      if (requestedAmount > originalAmount + 0.001) {
        return NextResponse.json({ error: `Bedrag mag niet meer zijn dan het originele bedrag (€${originalAmount.toFixed(2)})` }, { status: 400 });
      }
      refundAmount = Math.round(requestedAmount * 100) / 100;
    }

    const isPartial = refundAmount < originalAmount - 0.001;

    if (isPartial) {
      // Partial: originele payment blijft BETAALD, we voegen een tegen-boeking
      // toe als REFUND-payment record. Beide samen tellen op tot het netto-saldo.
      await createPayment({
        bookingId: payment.booking_id,
        type: 'REFUND',
        amount: refundAmount,
        status: 'TERUGBETAALD',
        method: payment.method || 'bank',
      });
    } else {
      // Full refund: originele payment naar TERUGBETAALD-status (huidig gedrag).
      await updatePaymentStatus(paymentId, 'TERUGBETAALD');
    }

    const session = getSessionFromHeaders(request);

    // Audit-log met bedrag, type, eventuele policy-reden + note.
    logActivity({
      actor: session.user,
      role: session.role,
      action: 'payment_refund',
      entityType: 'payment',
      entityId: paymentId,
      entityLabel: booking?.reference || paymentId,
      details: `€${refundAmount.toFixed(2)} ${isPartial ? 'gedeeltelijk' : 'volledig'} terugbetaald${policyReason ? ` — policy: ${policyReason}` : ''}${note ? ` — reden: ${note}` : ''} (verwerk handmatig in Holded/Stripe)`,
    }).catch(() => {});

    // Klantmail (best effort).
    let mailSent = false;
    let mailError: string | undefined;
    if (notifyCustomer && booking?.guest_email) {
      try {
        const customer = await getCustomerByEmail(booking.guest_email).catch(() => null);
        const result = await sendRefundConfirmationEmail(booking.guest_email, {
          guestName: booking.guest_name,
          reference: booking.reference,
          amount: refundAmount,
          note: policyReason ? `${policyReason}${note ? ` — ${note}` : ''}` : note,
          partial: isPartial,
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
      message: isPartial
        ? `Gedeeltelijke terugbetaling van €${refundAmount.toFixed(2)} geregistreerd — verwerk in Holded/Stripe`
        : 'Volledige terugbetaling geregistreerd — verwerk in Holded/Stripe',
      partial: isPartial,
      refundAmount,
      policyReason,
      mailSent,
      mailError,
      payment: {
        id: paymentId,
        originalAmount,
        bookingRef: booking?.reference,
      },
    });
  } catch (error) {
    console.error('POST /api/admin/refund error:', error);
    return NextResponse.json({ error: 'Markeren als terugbetaald mislukt' }, { status: 500 });
  }
}
