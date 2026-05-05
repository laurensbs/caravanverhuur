// Shared "payment received" flow. Used by:
//   • the Stripe webhook handler (source: 'stripe')
//   • the admin "markeer als betaald" button (source: 'admin')
//
// One implementation so both paths stay in sync: status updates, Holded
// mark-paid, optional auto-account creation, and the booking-confirmation
// email. Each step is wrapped in its own try/catch so a Holded outage or
// Resend hiccup never blocks the rest.

import * as Sentry from '@sentry/nextjs';
import {
  getPaymentById,
  getBookingById,
  getCustomerByEmail,
  updatePaymentStatus,
  updatePaymentStripeId,
  updateBookingStatus,
  createCustomer,
  getAllCampings,
  getAllCustomCaravans,
} from '@/lib/db';
import { sendBookingConfirmationEmail } from '@/lib/email';
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

export interface MarkPaidOptions {
  paymentId: string;
  source: 'stripe' | 'admin';
  // Stripe-only: payment_intent + holdedInvoiceId from session metadata.
  stripePaymentIntent?: string;
  holdedInvoiceId?: string;
  // Admin-only: skip the customer email (admin may want to confirm offline).
  skipEmail?: boolean;
}

export interface MarkPaidResult {
  alreadyPaid: boolean;
  emailSent: boolean;
  emailError?: string;
}

export async function markPaymentPaid(opts: MarkPaidOptions): Promise<MarkPaidResult> {
  const { paymentId, source } = opts;
  const tag = `[mark-paid:${source}]`;

  const existingPayment = await getPaymentById(paymentId).catch((e) => {
    console.error(`${tag} getPaymentById err:`, e);
    Sentry.captureException(e, { tags: { flow: 'mark-paid', source } });
    return null;
  });

  if (!existingPayment) {
    throw new Error('Payment not found');
  }

  const wasAlreadyPaid = existingPayment.status === 'BETAALD';

  // 1) DB status updates
  if (!wasAlreadyPaid) {
    const paidAt = new Date().toISOString();
    try {
      await updatePaymentStatus(paymentId, 'BETAALD', paidAt);
    } catch (e) { console.error(`${tag} updatePaymentStatus err:`, e); Sentry.captureException(e, { tags: { flow: 'mark-paid', source, step: 'updatePaymentStatus' } }); }

    if (opts.stripePaymentIntent) {
      try { await updatePaymentStripeId(paymentId, opts.stripePaymentIntent); }
      catch (e) { console.error(`${tag} updatePaymentStripeId err:`, e); }
    }

    if (existingPayment.type === 'AANBETALING') {
      try {
        // Only bump to AANBETAALD if the booking is currently in a lower
        // state. We don't want to *down*grade a booking that was manually
        // set to VOLLEDIG_BETAALD/ACTIEF/AFGEROND (e.g. when admin already
        // confirmed both deposit + rest).
        const booking = await getBookingById(existingPayment.booking_id);
        const lowerStates: ReadonlyArray<string> = ['NIEUW', 'BEVESTIGD'];
        if (booking && lowerStates.includes(booking.status)) {
          await updateBookingStatus(existingPayment.booking_id, 'AANBETAALD');
        }
      } catch (e) { console.error(`${tag} updateBookingStatus err:`, e); Sentry.captureException(e, { tags: { flow: 'mark-paid', source, step: 'updateBookingStatus' } }); }
    }
  }

  // 2) Holded mark-paid (best effort). If we already paid this earlier, skip.
  const holdedInvoiceId = opts.holdedInvoiceId || existingPayment.holded_invoice_id;
  if (holdedInvoiceId && !wasAlreadyPaid) {
    try { await markHoldedInvoicePaid(holdedInvoiceId); }
    catch (e) { console.error(`${tag} markHoldedInvoicePaid err:`, e); /* Sentry capture happens inside holded.ts */ }
  }

  // 3) Confirmation email — only if THIS call did the transition (idempotent
  // against retries). Admin can also opt out via skipEmail.
  if (wasAlreadyPaid) {
    return { alreadyPaid: true, emailSent: false };
  }
  if (opts.skipEmail) {
    return { alreadyPaid: false, emailSent: false };
  }

  try {
    const booking = await getBookingById(existingPayment.booking_id);
    if (!booking) throw new Error('Booking not found for confirmation mail');

    const normalizedEmail = booking.guest_email.toLowerCase().trim();
    let customer = await getCustomerByEmail(normalizedEmail).catch(() => null);
    let temporaryPasswordPlain: string | undefined;

    if (!customer) {
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
        customer = await getCustomerByEmail(normalizedEmail).catch(() => null);
      } catch (createErr) {
        console.error(`${tag} createCustomer err:`, createErr);
        Sentry.captureException(createErr, { tags: { flow: 'mark-paid', source, step: 'createCustomer' } });
      }
    }

    const caravanName = await resolveCaravanName(booking.caravan_id).catch(() => booking.caravan_id);
    const campingName = await resolveCampingName(booking.camping_id).catch(() => booking.camping_id);

    const mailRes = await sendBookingConfirmationEmail(booking.guest_email, {
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
    }, customer?.locale || 'nl');

    return { alreadyPaid: false, emailSent: !!mailRes.success, emailError: mailRes.error };
  } catch (emailErr) {
    console.error(`${tag} confirmation mail block err:`, emailErr);
    Sentry.captureException(emailErr, { tags: { flow: 'mark-paid', source, step: 'confirmation_email' } });
    return { alreadyPaid: false, emailSent: false, emailError: String(emailErr) };
  }
}
