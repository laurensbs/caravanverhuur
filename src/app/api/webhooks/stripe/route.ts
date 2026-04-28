import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { updatePaymentStatus, updatePaymentStripeId, getPaymentById, getBookingById, getPaymentByStripeId, getCustomerByEmail, updateBookingStatus, createCustomer, getAllCampings, getAllCustomCaravans } from '@/lib/db';
import { sendBookingConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email';
import { markHoldedInvoicePaid } from '@/lib/holded';
import { hashPassword, generateTemporaryPassword } from '@/lib/password';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';

async function resolveCaravanName(caravanId: string): Promise<string> {
  const fromStatic = staticCaravans.find(c => c.id === caravanId)?.name;
  if (fromStatic) return fromStatic;
  try {
    const custom = await getAllCustomCaravans();
    return (custom.find((c: Record<string, unknown>) => c.id === caravanId)?.name as string) || caravanId;
  } catch { return caravanId; }
}

async function resolveCampingName(campingId: string): Promise<string> {
  try {
    const dbCampings = await getAllCampings();
    const found = dbCampings.find((c: Record<string, unknown>) => c.id === campingId);
    if (found) return found.name as string;
  } catch {}
  return staticCampings.find(c => c.id === campingId)?.name || campingId;
}

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
          // Idempotency: skip if already processed
          const existingPayment = await getPaymentById(paymentId);
          if (existingPayment?.status === 'BETAALD') {
            console.log(`Payment ${paymentId} already BETAALD, skipping`);
            break;
          }

          const paidAt = new Date().toISOString();

          // Update payment status to BETAALD
          await updatePaymentStatus(paymentId, 'BETAALD', paidAt);

          // Store the Stripe payment intent ID
          if (session.payment_intent) {
            await updatePaymentStripeId(paymentId, String(session.payment_intent));
          }

          // Update booking status to AANBETAALD when deposit is paid
          const paidPayment = await getPaymentById(paymentId);
          if (paidPayment?.type === 'AANBETALING') {
            await updateBookingStatus(paidPayment.booking_id, 'AANBETAALD');
          }

          // Markeer de Holded-factuur als betaald (voor administratie).
          const holdedInvoiceId = session.metadata?.holdedInvoiceId;
          if (holdedInvoiceId) {
            try {
              await markHoldedInvoicePaid(holdedInvoiceId);
            } catch (holdedErr) {
              console.error('Failed to mark Holded invoice as paid:', holdedErr);
            }
          }

          // Welkomst- + bevestigingsmail (alleen ná betaling). Maakt account aan
          // voor de klant als nog niet bestaand, met tijdelijk wachtwoord.
          try {
            const payment = await getPaymentById(paymentId);
            if (payment) {
              const booking = await getBookingById(payment.booking_id);
              if (booking) {
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
                  } catch (createErr) {
                    console.error('Auto-create customer in webhook failed:', createErr);
                  }
                }

                const caravanName = await resolveCaravanName(booking.caravan_id);
                const campingName = await resolveCampingName(booking.camping_id);

                await sendBookingConfirmationEmail(booking.guest_email, {
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
              }
            }
          } catch (emailErr) {
            console.error('Failed to send booking confirmation email:', emailErr);
          }
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
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
