import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { updatePaymentStatus, updatePaymentStripeId, getPaymentById, getBookingById, getAllPayments, getCustomerByEmail } from '@/lib/db';
import { sendPaymentConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const paymentId = session.metadata?.paymentId;

        if (paymentId) {
          const paidAt = new Date().toISOString();

          // Update payment status to BETAALD
          await updatePaymentStatus(paymentId, 'BETAALD', paidAt);

          // Store the Stripe payment intent ID
          if (session.payment_intent) {
            await updatePaymentStripeId(paymentId, String(session.payment_intent));
          }

          // Send confirmation email
          try {
            const payment = await getPaymentById(paymentId);
            if (payment) {
              const booking = await getBookingById(payment.booking_id);
              if (booking) {
                const whCustomer = await getCustomerByEmail(booking.guest_email).catch(() => null);
                await sendPaymentConfirmationEmail(booking.guest_email, {
                  guestName: booking.guest_name,
                  reference: booking.reference,
                  type: payment.type,
                  amount: parseFloat(payment.amount),
                  paidAt,
                }, whCustomer?.locale);
              }
            }
          } catch (emailErr) {
            console.error('Failed to send payment confirmation email:', emailErr);
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        // Session expired before payment — no action needed, payment stays OPENSTAAND
        console.warn('Checkout session expired:', event.data.object.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        // Try to find the associated payment
        const payments = await getAllPayments();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const match = payments.find((p: any) => p.stripe_id === paymentIntent.id);
        if (match) {
          await updatePaymentStatus(match.id, 'MISLUKT');
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
