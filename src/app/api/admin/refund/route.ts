import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getPaymentById, updatePaymentStatus, getBookingById } from '@/lib/db';

// POST /api/admin/refund — Process a Stripe refund for a payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is verplicht' }, { status: 400 });
    }

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Betaling niet gevonden' }, { status: 404 });
    }

    if (payment.status !== 'BETAALD') {
      return NextResponse.json({ error: 'Alleen betaalde betalingen kunnen worden terugbetaald' }, { status: 400 });
    }

    const stripe = getStripe();

    // Find the Stripe payment intent / session
    if (payment.stripe_id) {
      try {
        // Try to refund via payment intent
        if (payment.stripe_id.startsWith('pi_')) {
          await stripe.refunds.create({
            payment_intent: payment.stripe_id,
          });
        } else if (payment.stripe_id.startsWith('cs_')) {
          // It's a checkout session — retrieve the payment intent from it
          const session = await stripe.checkout.sessions.retrieve(payment.stripe_id);
          if (session.payment_intent) {
            await stripe.refunds.create({
              payment_intent: session.payment_intent as string,
            });
          } else {
            return NextResponse.json({ error: 'Geen payment intent gevonden voor deze sessie' }, { status: 400 });
          }
        } else {
          // Try as payment intent anyway
          await stripe.refunds.create({
            payment_intent: payment.stripe_id,
          });
        }
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr);
        return NextResponse.json({ error: `Stripe fout: ${(stripeErr as Error).message}` }, { status: 500 });
      }
    }

    // Mark payment as refunded in DB
    await updatePaymentStatus(paymentId, 'TERUGBETAALD');

    // Get booking info for response
    const booking = payment.booking_id ? await getBookingById(payment.booking_id) : null;

    return NextResponse.json({
      success: true,
      message: 'Betaling succesvol terugbetaald',
      payment: {
        id: paymentId,
        amount: payment.amount,
        bookingRef: booking?.reference,
      },
    });
  } catch (error) {
    console.error('POST /api/admin/refund error:', error);
    return NextResponse.json({ error: 'Terugbetaling mislukt' }, { status: 500 });
  }
}
