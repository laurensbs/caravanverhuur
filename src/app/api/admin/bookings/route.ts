import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getCustomerByEmail, createCustomer, createBorgChecklist, getAllCustomCaravans, getAllCampings, logActivity } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { sendManualBookingEmail } from '@/lib/email';
import { hashPassword } from '@/lib/password';
import { getSessionFromHeaders } from '@/lib/admin-auth';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';

function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestName, guestEmail, guestPhone, adults, children, specialRequests, caravanId, campingId, checkIn, checkOut, nights, totalPrice, borgAmount, spotNumber } = body;

    if (!guestName || !guestEmail || !guestPhone || !caravanId || !campingId || !checkIn || !checkOut || !nights || !totalPrice) {
      return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
    }

    // Enforce minimum 7 nights
    if (nights < 7) {
      return NextResponse.json({ error: 'Minimaal 7 nachten vereist.' }, { status: 400 });
    }

    // 1. Check if customer account exists, otherwise create one
    let isNewAccount = false;
    let plainPassword = '';
    const email = guestEmail.toLowerCase().trim();
    const existing = await getCustomerByEmail(email);
    if (!existing) {
      plainPassword = generatePassword();
      const hash = await hashPassword(plainPassword);
      await createCustomer({ email, passwordHash: hash, name: guestName.trim(), phone: guestPhone?.trim() });
      isNewAccount = true;
    }

    // 2. Create booking (status BEVESTIGD since staff created it)
    const deposit25 = Math.round(totalPrice * 0.25);
    const remaining = totalPrice - deposit25;
    const result = await createBooking({
      guestName: guestName.trim(),
      guestEmail: email,
      guestPhone: guestPhone.trim(),
      adults: adults || 2,
      children: children || 0,
      specialRequests: specialRequests || '',
      caravanId,
      campingId,
      checkIn,
      checkOut,
      nights,
      totalPrice,
      depositAmount: deposit25,
      remainingAmount: remaining,
      borgAmount: borgAmount || 400,
      spotNumber: spotNumber || undefined,
    });

    // 3. Update status to BEVESTIGD
    const { sql } = await import('@vercel/postgres');
    await sql`UPDATE bookings SET status = 'BEVESTIGD' WHERE id = ${result.id}`;

    // 4. Generate Stripe payment link
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com';

    // Resolve caravan/camping names
    let caravanName = staticCaravans.find(c => c.id === caravanId)?.name || '';
    if (!caravanName) {
      try {
        const custom = await getAllCustomCaravans();
        caravanName = custom.find((c: Record<string, unknown>) => c.id === caravanId)?.name as string || caravanId;
      } catch { caravanName = caravanId; }
    }
    const campingName = await (async () => {
      try {
        const dbCampings = await getAllCampings();
        const found = dbCampings.find((c: Record<string, unknown>) => c.id === campingId);
        if (found) return found.name as string;
      } catch {}
      return staticCampings.find(c => c.id === campingId)?.name || campingId;
    })();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['ideal'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Aanbetaling (25%) — ${result.reference}`,
            description: `Caravanverhuur Spanje — ${guestName}`,
          },
          unit_amount: Math.round(deposit25 * 100),
        },
        quantity: 1,
      }],
      customer_email: email,
      metadata: {
        paymentId: result.paymentId,
        bookingId: result.id,
        bookingRef: result.reference,
        type: 'AANBETALING',
      },
      success_url: `${baseUrl}/betaling/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/betaling/geannuleerd?payment_id=${result.paymentId}`,
    });

    // Store stripe session ID on payment
    const { updatePaymentStripeId } = await import('@/lib/db');
    await updatePaymentStripeId(result.paymentId, session.id);

    // 5. Payment is always 25% deposit due now
    const immediatePayment = true;
    const paymentDeadline = 'nu';

    // 6. Send email to customer with booking details + payment link + (optional) account credentials
    const manualCustomer = existing || await getCustomerByEmail(email).catch(() => null);
    sendManualBookingEmail(email, {
      guestName: guestName.trim(),
      reference: result.reference,
      caravanName,
      campingName,
      checkIn,
      checkOut,
      nights,
      adults: adults || 2,
      children: children || 0,
      totalPrice,
      paymentDeadline,
      immediatePayment,
      spotNumber,
      paymentUrl: session.url || `${baseUrl}/mijn-account`,
      isNewAccount,
      password: isNewAccount ? plainPassword : undefined,
    }, manualCustomer?.locale).catch(err => console.error('Manual booking email failed:', err));

    // 7. Auto-create borgchecklist
    createBorgChecklist({ bookingId: result.id, type: 'INCHECKEN' })
      .catch(err => console.error('Auto borg checklist creation failed:', err));

    // Log activity
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'booking_created', entityType: 'booking', entityId: result.id, entityLabel: result.reference, details: `${guestName} — ${caravanName} → ${campingName}` }).catch(() => {});

    return NextResponse.json({
      success: true,
      id: result.id,
      reference: result.reference,
      paymentId: result.paymentId,
      paymentUrl: session.url,
      isNewAccount,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/bookings error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het aanmaken van de boeking' }, { status: 500 });
  }
}
