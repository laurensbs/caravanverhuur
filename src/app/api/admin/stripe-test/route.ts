import { NextRequest, NextResponse } from 'next/server';
import { createBookingAtomic, getPaymentById, updatePaymentStripeId, updatePaymentHoldedStatus } from '@/lib/db';
import { findOrCreateHoldedContact, createHoldedInvoice } from '@/lib/holded';
import { getStripe } from '@/lib/stripe';

// POST /api/admin/stripe-test
// Maakt een echte boeking van EUR 0,01 + Holded factuur + Stripe Checkout en
// retourneert de checkout-URL. Doorloopt exact dezelfde flow als een klantboeking
// (mails, webhook, Holded markeren als betaald), zodat we end-to-end kunnen testen
// met een minimaal bedrag. Refund daarna in Stripe als je wilt.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const guestName: string = body.guestName || 'Stripe Test';
    const guestEmail: string = body.guestEmail || 'laurensbos@hotmail.com';
    const guestPhone: string = body.guestPhone || '+31600000000';

    // Boek ver in de toekomst zodat we geen echte boekingen blokkeren
    const checkIn = '2099-12-01';
    const checkOut = '2099-12-02';

    const booking = await createBookingAtomic({
      guestName,
      guestEmail,
      guestPhone,
      adults: 1,
      children: 0,
      specialRequests: 'STRIPE TEST — €0,01 — refund daarna',
      caravanId: 'test',
      campingId: 'test',
      checkIn,
      checkOut,
      nights: 1,
      totalPrice: 0.01,
      depositAmount: 0.01,
      remainingAmount: 0,
      borgAmount: 0,
    });

    if (!booking) {
      return NextResponse.json({ error: 'Failed to create test booking' }, { status: 500 });
    }

    // Holded factuur (zelfde flow als productie)
    let holdedInvoiceId: string | undefined;
    try {
      const contactId = await findOrCreateHoldedContact({ name: guestName, email: guestEmail, phone: guestPhone });
      const holded = await createHoldedInvoice({
        contactId,
        reference: `TEST aanbetaling ${booking.reference}`,
        items: [{ name: `STRIPE TEST — boeking ${booking.reference}`, units: 1, subtotal: 0.01, tax: 0 }],
        notes: `STRIPE TEST flow — €0,01\nBoeking ${booking.reference}`,
      });
      holdedInvoiceId = holded.invoiceId;
      await updatePaymentHoldedStatus(booking.paymentId, 'IN_HOLDED', holded.invoiceId);
    } catch (holdedErr) {
      console.warn('Holded invoice creation failed (test continues):', holdedErr);
    }

    // Stripe Checkout — minimum bedrag is EUR 0,50 voor cards, dus we doen 1 cent voor iDEAL.
    // iDEAL accepteert kleinere bedragen.
    const stripe = getStripe();
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const payment = await getPaymentById(booking.paymentId);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['ideal', 'bancontact', 'card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `STRIPE TEST — boeking ${booking.reference}` },
          unit_amount: 1, // 1 cent
        },
        quantity: 1,
      }],
      customer_email: guestEmail,
      metadata: {
        paymentId: booking.paymentId,
        bookingId: booking.id,
        bookingRef: booking.reference,
        type: 'AANBETALING',
        holdedInvoiceId: payment?.holded_invoice_id || holdedInvoiceId || '',
        isTest: '1',
      },
      success_url: `${origin}/betaling/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/betaling/geannuleerd?payment_id=${booking.paymentId}`,
    });

    await updatePaymentStripeId(booking.paymentId, session.id);

    return NextResponse.json({
      success: true,
      url: session.url,
      bookingRef: booking.reference,
      paymentId: booking.paymentId,
      holdedInvoiceId,
    });
  } catch (err) {
    console.error('POST /api/admin/stripe-test error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
