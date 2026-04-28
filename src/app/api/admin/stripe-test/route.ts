import { NextRequest, NextResponse } from 'next/server';
import { createBookingAtomic, getPaymentById, updatePaymentStripeId, updatePaymentHoldedStatus, getAllCampings, getAllCustomCaravans } from '@/lib/db';
import { findOrCreateHoldedContact, createHoldedInvoice } from '@/lib/holded';
import { getStripe } from '@/lib/stripe';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';

// POST /api/admin/stripe-test
// Volgt exact dezelfde flow als POST /api/bookings — gebruikt een echte caravan en camping,
// zelfde Holded-factuur opmaak, zelfde mails, zelfde Stripe Checkout — alleen het bedrag is
// €0,01 zodat we end-to-end kunnen verifiëren met minimaal geld.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const guestName: string = body.guestName || 'Test Boeking';
    const guestEmail: string = body.guestEmail || 'laurensbos@hotmail.com';
    const guestPhone: string = body.guestPhone || '+31600000000';

    // Pak de eerste actieve caravan en camping uit de data — zo ziet de flow er
    // identiek uit aan een gewone klantboeking.
    let caravanId: string | undefined = staticCaravans[0]?.id;
    let caravanName: string | undefined = staticCaravans[0]?.name;
    if (!caravanId) {
      try {
        const custom = await getAllCustomCaravans();
        caravanId = custom[0]?.id as string | undefined;
        caravanName = custom[0]?.name as string | undefined;
      } catch {}
    }
    let campingId: string | undefined = staticCampings[0]?.id;
    let campingName: string | undefined = staticCampings[0]?.name;
    try {
      const dbCampings = await getAllCampings();
      if (dbCampings.length > 0) {
        campingId = dbCampings[0].id as string;
        campingName = dbCampings[0].name as string;
      }
    } catch {}

    if (!caravanId || !campingId) {
      return NextResponse.json({ error: 'Geen caravan of camping beschikbaar voor test' }, { status: 500 });
    }

    // Boek ver in de toekomst zodat we geen echte boekingen blokkeren
    const checkIn = '2099-12-01';
    const checkOut = '2099-12-02';
    const nights = 1;
    const totalPrice = 0.01;
    const deposit25 = 0.01;

    const booking = await createBookingAtomic({
      guestName,
      guestEmail,
      guestPhone,
      adults: 1,
      children: 0,
      specialRequests: undefined,
      caravanId,
      campingId,
      checkIn,
      checkOut,
      nights,
      totalPrice,
      depositAmount: deposit25,
      remainingAmount: 0,
      borgAmount: 0,
    });

    if (!booking) {
      return NextResponse.json({ error: 'Failed to create test booking' }, { status: 500 });
    }

    // Holded factuur — exact dezelfde tekst als productie, met klein TEST-flagje in notes
    let holdedInvoiceId: string | undefined;
    try {
      const contactId = await findOrCreateHoldedContact({ name: guestName, email: guestEmail, phone: guestPhone });
      const checkInLabel = new Date(checkIn).toLocaleDateString('nl-NL');
      const checkOutLabel = new Date(checkOut).toLocaleDateString('nl-NL');
      const invoiceNotes = [
        `[TEST €0,01]`,
        `Boeking ${booking.reference}`,
        `Caravan: ${caravanName}`,
        `Camping: ${campingName}`,
        `Verblijf: ${checkInLabel} t/m ${checkOutLabel} (${nights} nachten)`,
        `Gasten: 1 volw.`,
        `Totale huurprijs: €${totalPrice.toFixed(2)} — Aanbetaling 25% (rest + borg op de camping)`,
      ].join('\n');

      const holded = await createHoldedInvoice({
        contactId,
        reference: `Aanbetaling boeking ${booking.reference}`,
        items: [{
          name: `Aanbetaling 25% — boeking ${booking.reference} (${caravanName})`,
          units: 1,
          subtotal: deposit25,
          tax: 0,
        }],
        notes: invoiceNotes,
      });
      holdedInvoiceId = holded.invoiceId;
      await updatePaymentHoldedStatus(booking.paymentId, 'IN_HOLDED', holded.invoiceId);
    } catch (holdedErr) {
      console.warn('Holded invoice creation failed (test continues):', holdedErr);
    }

    // Stripe Checkout — productie-tekst, alleen bedrag verschilt
    const stripe = getStripe();
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const payment = await getPaymentById(booking.paymentId);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['ideal', 'bancontact', 'card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Aanbetaling 25% — boeking ${booking.reference}`,
            description: `Caravanverhuur Spanje — ${caravanName}`,
          },
          unit_amount: Math.round(deposit25 * 100),
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
