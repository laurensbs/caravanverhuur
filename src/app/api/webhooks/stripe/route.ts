import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { getPaymentById, getBookingById, getPaymentByStripeId, getCustomerByEmail, updatePaymentStatus } from '@/lib/db';
import { sendPaymentFailedEmail } from '@/lib/email';
import { markPaymentPaid } from '@/lib/payment-flow';

export async function POST(request: NextRequest) {
  // Boot-time env-var checks must NOT throw — Stripe will retry forever on
  // 5xx and we lose visibility. Return a structured error instead.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    Sentry.captureMessage('STRIPE_WEBHOOK_SECRET missing', { level: 'error', tags: { integration: 'stripe' } });
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[webhook] STRIPE_SECRET_KEY is not set');
    Sentry.captureMessage('STRIPE_SECRET_KEY missing', { level: 'error', tags: { integration: 'stripe' } });
    return NextResponse.json({ error: 'Stripe key not configured' }, { status: 500 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error('[webhook] getStripe failed:', err);
    Sentry.captureException(err, { tags: { integration: 'stripe', stage: 'init' } });
    return NextResponse.json({ error: 'Stripe init failed' }, { status: 500 });
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
    Sentry.captureException(err, { tags: { integration: 'stripe', stage: 'signature_verify' } });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Acknowledge synthetic test events from Stripe Dashboard FAST.
  // These have empty metadata; further processing has nothing to do anyway,
  // and Stripe Dashboard's tester gives up if we take too long or returns
  // the response body in a confusing way.
  console.log(`[webhook] event ${event.id} type=${event.type} livemode=${event.livemode}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const paymentId = session.metadata?.paymentId;
        console.log(`[webhook] checkout.session.completed paymentId=${paymentId} session=${session.id}`);

        if (!paymentId) {
          console.warn('[webhook] No paymentId in metadata, skipping');
          break;
        }

        try {
          const result = await markPaymentPaid({
            paymentId,
            source: 'stripe',
            stripePaymentIntent: session.payment_intent ? String(session.payment_intent) : undefined,
            holdedInvoiceId: session.metadata?.holdedInvoiceId,
          });
          console.log(`[webhook] markPaymentPaid → alreadyPaid=${result.alreadyPaid}, emailSent=${result.emailSent}, err=${result.emailError || 'none'}`);
        } catch (err) {
          console.error('[webhook] markPaymentPaid err:', err);
          Sentry.captureException(err, { tags: { integration: 'stripe', stage: 'mark-paid' }, extra: { paymentId } });
        }
        break;
      }

      case 'checkout.session.expired': {
        // Session expired voor betaling — payment blijft OPENSTAAND, klant kan
        // opnieuw betalen via /mijn-account. Stuur mail om dit te vertellen.
        try {
          const session = event.data.object;
          const paymentId = session.metadata?.paymentId;
          if (paymentId) {
            const payment = await getPaymentById(paymentId);
            if (payment && payment.status !== 'BETAALD') {
              const booking = await getBookingById(payment.booking_id);
              if (booking) {
                const whCustomer = await getCustomerByEmail(booking.guest_email).catch(() => null);
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com';
                await sendPaymentFailedEmail(booking.guest_email, {
                  guestName: booking.guest_name,
                  reference: booking.reference,
                  depositAmount: parseFloat(payment.amount),
                  retryUrl: `${baseUrl}/mijn-account`,
                }, whCustomer?.locale || 'nl');
              }
            }
          }
        } catch (err) {
          console.error('Failed to send payment-failed mail (expired):', err);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const match = await getPaymentByStripeId(paymentIntent.id);
        if (match) {
          await updatePaymentStatus(match.id, 'MISLUKT');
          try {
            const booking = await getBookingById(match.booking_id);
            if (booking) {
              const whCustomer = await getCustomerByEmail(booking.guest_email).catch(() => null);
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com';
              await sendPaymentFailedEmail(booking.guest_email, {
                guestName: booking.guest_name,
                reference: booking.reference,
                depositAmount: parseFloat(match.amount),
                retryUrl: `${baseUrl}/mijn-account`,
              }, whCustomer?.locale || 'nl');
            }
          } catch (err) {
            console.error('Failed to send payment-failed mail (intent_failed):', err);
          }
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    Sentry.captureException(err, {
      tags: { integration: 'stripe', stage: 'handler', event_type: event.type },
      extra: { event_id: event.id },
    });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
