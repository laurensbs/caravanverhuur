import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentById, updatePaymentStatus, getBookingById, logActivity } from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';
import { parseJson } from '@/lib/validate';

const RefundSchema = z.object({
  paymentId: z.string().min(1).max(64),
});

// POST /api/admin/refund — Mark a payment as refunded.
// Refunds zelf gebeuren handmatig in Holded; deze endpoint update alleen de status in onze DB.
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson(request, RefundSchema);
    if (!parsed.ok) return parsed.response;
    const { paymentId } = parsed.data;

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Betaling niet gevonden' }, { status: 404 });
    }

    if (payment.status !== 'BETAALD') {
      return NextResponse.json({ error: 'Alleen betaalde betalingen kunnen worden gemarkeerd als terugbetaald' }, { status: 400 });
    }

    await updatePaymentStatus(paymentId, 'TERUGBETAALD');

    const booking = payment.booking_id ? await getBookingById(payment.booking_id) : null;

    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'payment_refund', entityType: 'payment', entityId: paymentId, entityLabel: booking?.reference || paymentId, details: `€${payment.amount} gemarkeerd als terugbetaald (handmatig in Holded)` }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Betaling gemarkeerd als terugbetaald — verwerk de daadwerkelijke refund in Holded',
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
