import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';
import { getPaymentById, updatePaymentStripeId, getBookingById } from '@/lib/db';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';
import { parseJson } from '@/lib/validate';

const CheckoutSchema = z.object({
  paymentId: z.string().min(1).max(64),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkoutLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Too many requests. Retry after ${rl.retryAfter} seconds.` },
        { status: 429 },
      );
    }

    const parsed = await parseJson(request, CheckoutSchema);
    if (!parsed.ok) return parsed.response;
    const { paymentId } = parsed.data;

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'BETAALD') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 400 });
    }

    const booking = await getBookingById(payment.booking_id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    const typeLabel =
      payment.type === 'AANBETALING' ? 'Aanbetaling' :
      payment.type === 'RESTBETALING' ? 'Restbetaling' :
      payment.type === 'HUUR' ? 'Huurbedrag' :
      payment.type === 'BORG' ? 'Borgsom' :
      payment.type;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${typeLabel} — ${booking.reference}`,
              description: `Caravanverhuur Spanje — ${booking.guest_name}`,
            },
            unit_amount: Math.round(parseFloat(payment.amount) * 100), // cents
          },
          quantity: 1,
        },
      ],
      customer_email: booking.guest_email,
      metadata: {
        paymentId: payment.id,
        bookingId: booking.id,
        bookingRef: booking.reference,
        type: payment.type,
      },
      success_url: `${baseUrl}/betaling/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/betaling/geannuleerd?payment_id=${payment.id}`,
    });

    // Store the Stripe session ID on the payment record
    await updatePaymentStripeId(payment.id, session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('POST /api/checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
