import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getAllBookings, updateBookingStatus, updateBookingNotes, createBorgChecklist, getAllCustomCaravans, deleteBookingById, incrementDiscountCodeUsage, getCustomerByEmail, checkCaravanAvailability, updatePaymentStripeId } from '@/lib/db';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { getStripe } from '@/lib/stripe';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import { getAllCampings } from '@/lib/db';
import { bookingLimiter, getClientIp } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Only allow admin-authenticated requests to list all bookings
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const bookings = await getAllBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = bookingLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Too many requests. Retry after ${rl.retryAfter} seconds.` },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { guestName, guestEmail, guestPhone, adults, children, specialRequests, caravanId, campingId, checkIn, checkOut, nights, totalPrice, borgAmount, spotNumber, discountCode, discountAmount, depositAmount } = body;

    if (!guestName || !guestEmail || !guestPhone || !caravanId || !campingId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check availability: prevent double-bookings for the same caravan
    const available = await checkCaravanAvailability(caravanId, checkIn, checkOut);
    if (!available) {
      return NextResponse.json({ error: 'Deze caravan is al geboekt voor de geselecteerde periode. Kies andere data.' }, { status: 409 });
    }

    // Calculate 25% deposit amount
    const deposit25 = depositAmount || Math.round(totalPrice * 0.25);
    const remaining = totalPrice - deposit25;

    const result = await createBooking({
      guestName,
      guestEmail,
      guestPhone,
      adults: adults || 2,
      children: children || 0,
      specialRequests: specialRequests || undefined,
      caravanId,
      campingId,
      checkIn,
      checkOut,
      nights,
      totalPrice,
      depositAmount: deposit25,
      remainingAmount: remaining,
      borgAmount: borgAmount || 400,
      spotNumber,
    });

    // Send booking confirmation email (non-blocking)
    let caravanName: string = staticCaravans.find(c => c.id === caravanId)?.name || '';
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
    // Payment: 25% deposit due at booking (always immediate)
    const immediatePayment = true;
    const paymentDeadline = 'nu';

    // Look up customer locale
    const bookingCustomer = await getCustomerByEmail(guestEmail.toLowerCase().trim()).catch(() => null);
    const customerLocale = bookingCustomer?.locale || 'nl';

    // Create Stripe checkout session for the 25% deposit
    let paymentUrl: string | undefined;
    try {
      const stripe = getStripe();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com';
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['ideal'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Aanbetaling — ${result.reference}`,
              description: `Caravanverhuur Spanje — ${guestName}`,
            },
            unit_amount: Math.round(deposit25 * 100),
          },
          quantity: 1,
        }],
        customer_email: guestEmail,
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
      await updatePaymentStripeId(result.paymentId, session.id);
    } catch (err) {
      console.error('Failed to create Stripe checkout session:', err);
    }

    sendBookingConfirmationEmail(guestEmail, {
      guestName,
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
      paymentUrl,
      borgAmount: borgAmount || 400,
    }, customerLocale).catch(err => console.error('Booking confirmation email failed:', err));

    // Auto-create borgchecklist for this booking (inchecken)
    createBorgChecklist({ bookingId: result.id, type: 'INCHECKEN' })
      .catch(err => console.error('Auto borg checklist creation failed:', err));

    // Increment discount code usage if used
    if (discountCode) {
      incrementDiscountCodeUsage(discountCode)
        .catch(err => console.error('Discount code usage increment failed:', err));
    }

    return NextResponse.json({ ...result, paymentId: result.paymentId, paymentUrl, immediatePayment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Require admin auth for status/notes changes
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
    }

    if (status) {
      await updateBookingStatus(id, status);
    }
    if (adminNotes !== undefined) {
      await updateBookingNotes(id, adminNotes);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Require admin auth
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    await deleteBookingById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
