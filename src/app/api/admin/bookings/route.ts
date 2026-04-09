import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getCustomerByEmail, createCustomer, createBorgChecklist, getAllCustomCaravans, getAllCampings, logActivity, getBookingById, getPaymentById, updatePaymentStripeId, updatePaymentLink, updateBookingExtras } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { sendManualBookingEmail, sendPaymentLinkEmail, sendExtrasAddedEmail } from '@/lib/email';
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

    if (!guestName || !guestEmail || !guestPhone || !caravanId || !campingId || !checkIn || !checkOut || !nights || totalPrice == null) {
      return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
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

    // 4. Generate Stripe payment link (if Stripe is available)
    let paymentUrl: string | undefined;
    try {
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

      paymentUrl = session.url ?? undefined;

      // Store stripe session ID on payment
      await updatePaymentStripeId(result.paymentId, session.id);
    } catch (err) {
      console.error('Failed to create Stripe checkout session for manual booking:', err);
    }

    // Resolve names for email (if not resolved in Stripe block)
    let caravanNameForEmail = staticCaravans.find(c => c.id === caravanId)?.name || '';
    if (!caravanNameForEmail) {
      try {
        const custom = await getAllCustomCaravans();
        caravanNameForEmail = custom.find((c: Record<string, unknown>) => c.id === caravanId)?.name as string || caravanId;
      } catch { caravanNameForEmail = caravanId; }
    }
    const campingNameForEmail = await (async () => {
      try {
        const dbCampings = await getAllCampings();
        const found = dbCampings.find((c: Record<string, unknown>) => c.id === campingId);
        if (found) return found.name as string;
      } catch {}
      return staticCampings.find(c => c.id === campingId)?.name || campingId;
    })();

    // 5. Payment is always 25% deposit due now
    const immediatePayment = true;
    const paymentDeadline = 'nu';

    // 6. Send email to customer with booking details + payment link + (optional) account credentials
    const manualCustomer = existing || await getCustomerByEmail(email).catch(() => null);
    sendManualBookingEmail(email, {
      guestName: guestName.trim(),
      reference: result.reference,
      caravanName: caravanNameForEmail,
      campingName: campingNameForEmail,
      checkIn,
      checkOut,
      nights,
      adults: adults || 2,
      children: children || 0,
      totalPrice,
      paymentDeadline,
      immediatePayment,
      spotNumber,
      paymentUrl: paymentUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com'}/mijn-account`,
      isNewAccount,
      password: isNewAccount ? plainPassword : undefined,
    }, manualCustomer?.locale).catch(err => console.error('Manual booking email failed:', err));

    // 7. Auto-create borgchecklist
    createBorgChecklist({ bookingId: result.id, type: 'INCHECKEN' })
      .catch(err => console.error('Auto borg checklist creation failed:', err));

    // Log activity
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'booking_created', entityType: 'booking', entityId: result.id, entityLabel: result.reference, details: `${guestName} — ${caravanNameForEmail} → ${campingNameForEmail}` }).catch(() => {});

    return NextResponse.json({
      success: true,
      id: result.id,
      reference: result.reference,
      paymentId: result.paymentId,
      paymentUrl: paymentUrl,
      isNewAccount,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/bookings error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het aanmaken van de boeking' }, { status: 500 });
  }
}

// PUT: Send payment link for an existing booking
export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromHeaders(request);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, bookingId } = body;

    if (!bookingId || !['send-payment-link', 'save-payment-link', 'add-extras'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action or missing bookingId' }, { status: 400 });
    }

    // Get booking
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 });
    }

    // ── Add extras to booking ──
    if (action === 'add-extras') {
      const { extras, totalPrice, depositAmount, remainingAmount, borgAmount } = body;
      if (!extras || typeof totalPrice !== 'number') {
        return NextResponse.json({ error: 'Missing extras or totalPrice' }, { status: 400 });
      }

      // Build new special_requests string (append to existing)
      const existingExtras = booking.special_requests || '';
      const newExtras = extras as string; // pipe-separated string of new extras
      const combined = existingExtras
        ? `${existingExtras} | ${newExtras}`
        : newExtras;

      await updateBookingExtras(
        bookingId,
        combined,
        totalPrice,
        depositAmount ?? Number(booking.deposit_amount),
        remainingAmount ?? Number(booking.remaining_amount),
        borgAmount ?? Number(booking.borg_amount),
      );

      // Send email notification to customer
      const customer = await getCustomerByEmail(booking.guest_email).catch(() => null);
      sendExtrasAddedEmail(booking.guest_email, {
        guestName: booking.guest_name,
        reference: booking.reference,
        addedExtras: newExtras,
        newTotalPrice: totalPrice,
      }, customer?.locale).catch(err => console.error('Extras email failed:', err));

      // Log activity
      logActivity({
        actor: session.user,
        role: session.role,
        action: 'extras_added',
        entityType: 'booking',
        entityId: booking.id,
        entityLabel: booking.reference,
        details: `Extra's toegevoegd: ${newExtras}`,
      }).catch(() => {});

      return NextResponse.json({ success: true, specialRequests: combined });
    }

    // ── Save manual payment link & send email ──
    if (action === 'save-payment-link') {
      const { paymentLink } = body;
      if (!paymentLink) {
        return NextResponse.json({ error: 'Missing paymentLink' }, { status: 400 });
      }

      // Find AANBETALING payment (any status)
      const { sql } = await import('@vercel/postgres');
      const paymentsResult = await sql`
        SELECT * FROM payments WHERE booking_id = ${bookingId} AND type = 'AANBETALING' LIMIT 1
      `;
      const payment = paymentsResult.rows[0];
      if (!payment) {
        return NextResponse.json({ error: 'Geen aanbetaling gevonden' }, { status: 400 });
      }

      // Save the link on the payment record
      await updatePaymentLink(payment.id, paymentLink);

      // Send payment link email to customer
      const customer = await getCustomerByEmail(booking.guest_email).catch(() => null);
      await sendPaymentLinkEmail(booking.guest_email, {
        guestName: booking.guest_name,
        reference: booking.reference,
        depositAmount: Number(payment.amount),
        paymentUrl: paymentLink,
      }, customer?.locale);

      // Log activity
      logActivity({
        actor: session.user,
        role: session.role,
        action: 'payment_link_sent',
        entityType: 'booking',
        entityId: booking.id,
        entityLabel: booking.reference,
        details: `Betaallink handmatig ingesteld en verstuurd naar ${booking.guest_email}`,
      }).catch(() => {});

      return NextResponse.json({ success: true });
    }

    // ── Auto-generate Stripe checkout session ──

    // Find OPENSTAAND deposit payment
    const { sql } = await import('@vercel/postgres');
    const paymentsResult = await sql`
      SELECT * FROM payments WHERE booking_id = ${bookingId} AND type = 'AANBETALING' AND status = 'OPENSTAAND' LIMIT 1
    `;
    const payment = paymentsResult.rows[0];
    if (!payment) {
      return NextResponse.json({ error: 'Geen openstaande aanbetaling gevonden' }, { status: 400 });
    }

    // Create Stripe checkout session
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com';
    const deposit25 = Number(payment.amount);

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Aanbetaling (25%) — ${booking.reference}`,
            description: `Caravanverhuur Spanje — ${booking.guest_name}`,
          },
          unit_amount: Math.round(deposit25 * 100),
        },
        quantity: 1,
      }],
      customer_email: booking.guest_email,
      metadata: {
        paymentId: payment.id,
        bookingId: booking.id,
        bookingRef: booking.reference,
        type: 'AANBETALING',
      },
      success_url: `${baseUrl}/betaling/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/betaling/geannuleerd?payment_id=${payment.id}`,
    });

    // Store stripe session ID on payment
    await updatePaymentStripeId(payment.id, stripeSession.id);

    const paymentUrl = stripeSession.url;

    // Look up customer locale
    const customer = await getCustomerByEmail(booking.guest_email).catch(() => null);

    // Send payment link email to customer
    await sendPaymentLinkEmail(booking.guest_email, {
      guestName: booking.guest_name,
      reference: booking.reference,
      depositAmount: deposit25,
      paymentUrl: paymentUrl!,
    }, customer?.locale);

    // Log activity
    logActivity({
      actor: session.user,
      role: session.role,
      action: 'payment_link_sent',
      entityType: 'booking',
      entityId: booking.id,
      entityLabel: booking.reference,
      details: `Betaallink verstuurd naar ${booking.guest_email}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      paymentUrl,
    });
  } catch (error) {
    console.error('PUT /api/admin/bookings error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het aanmaken van de betaallink' }, { status: 500 });
  }
}
