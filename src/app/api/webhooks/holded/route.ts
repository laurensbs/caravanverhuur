import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getPaymentByHoldedInvoiceId,
  updatePaymentStatus,
  updateBookingStatus,
  getPaymentById,
  getBookingById,
  getCustomerByEmail,
} from '@/lib/db';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import { getHoldedInvoice } from '@/lib/holded';

// Verify Holded webhook signature when HOLDED_WEBHOOK_SECRET is configured.
// Holded posts X-Holded-Signature as HMAC-SHA256 of the raw body using the shared secret.
function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.HOLDED_WEBHOOK_SECRET;
  if (!secret) return true; // not configured → skip verification (dev/initial setup)
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-holded-signature');

  if (!verifySignature(rawBody, signature)) {
    console.warn('Holded webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Holded sends events with shape like { event: 'invoice.paid', invoiceId: '...', ... }
  // Field names vary slightly per Holded version; we look up the invoice id from a few likely keys.
  const invoiceId = (event.invoiceId || event.documentId || event.id ||
    (event.data as Record<string, unknown> | undefined)?.id) as string | undefined;
  const eventType = (event.event || event.type || '') as string;

  if (!invoiceId) {
    return NextResponse.json({ received: true, note: 'no invoice id in payload' });
  }

  try {
    const payment = await getPaymentByHoldedInvoiceId(invoiceId);
    if (!payment) {
      console.log('Holded webhook: no matching payment for invoice', invoiceId);
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if already paid
    if (payment.status === 'BETAALD') {
      return NextResponse.json({ received: true, note: 'already paid' });
    }

    // Confirm with Holded that the invoice is actually paid (defensive — don't trust payload alone)
    let isPaid = eventType.toLowerCase().includes('paid');
    try {
      const inv = await getHoldedInvoice(invoiceId);
      isPaid = isPaid || !!inv.paid;
    } catch (err) {
      console.warn('Failed to fetch Holded invoice for confirmation:', err);
    }

    if (!isPaid) {
      return NextResponse.json({ received: true, note: 'not paid yet' });
    }

    const paidAt = new Date().toISOString();
    await updatePaymentStatus(payment.id, 'BETAALD', paidAt);

    if (payment.type === 'AANBETALING') {
      await updateBookingStatus(payment.booking_id, 'AANBETAALD');
    }

    // Send confirmation email
    try {
      const fresh = await getPaymentById(payment.id);
      if (fresh) {
        const booking = await getBookingById(fresh.booking_id);
        if (booking) {
          const cust = await getCustomerByEmail(booking.guest_email).catch(() => null);
          await sendPaymentConfirmationEmail(booking.guest_email, {
            guestName: booking.guest_name,
            reference: booking.reference,
            type: fresh.type,
            amount: parseFloat(fresh.amount),
            paidAt,
            totalPrice: parseFloat(booking.total_price),
            remainingAmount: parseFloat(booking.remaining_amount),
            borgAmount: parseFloat(booking.borg_amount),
          }, cust?.locale);
        }
      }
    } catch (mailErr) {
      console.error('Holded webhook: failed to send confirmation email:', mailErr);
    }

    return NextResponse.json({ received: true, paymentId: payment.id });
  } catch (err) {
    console.error('Holded webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
