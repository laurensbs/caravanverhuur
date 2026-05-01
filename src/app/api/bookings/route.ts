import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getAllBookings, updateBookingStatus, updateBookingNotes, updateBookingCaravan, createBorgChecklist, getAllCustomCaravans, deleteBookingById, incrementDiscountCodeUsage, validateDiscountCode, getCustomerByEmail, checkCaravanAvailability, createBookingAtomic, getActivePricingRules } from '@/lib/db';
import { sendAdminNewBookingNotification } from '@/lib/email';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import { getAllCampings } from '@/lib/db';
import { bookingLimiter, getClientIp } from '@/lib/rate-limit';
import { signBookingPaymentToken } from '@/lib/payment-link-token';

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
    const { guestName, guestEmail, guestPhone, adults, children, specialRequests, caravanId, campingId, checkIn, checkOut, spotNumber, discountCode, extraBedlinnen, extraFridge, extraAirco, extraBikes, extraMountainbikes } = body;

    if (!guestName || !guestEmail || !guestPhone || !caravanId || !campingId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Enforce minimum 7 nights
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const calcNights = Math.round(diffMs / 86400000);
    if (calcNights < 7) {
      return NextResponse.json({ error: 'Minimaal 7 nachten vereist.' }, { status: 400 });
    }

    // SERVER-SIDE PRICE CALCULATION — base rate €550/week, seasonal adjustments via pricing rules
    const serverNights = calcNights;
    const BASE_WEEKLY_RATE = 550;
    let basePrice = Math.round(serverNights * BASE_WEEKLY_RATE / 7);

    // Apply pricing rules (seizoen/vroegboek/lastminute)
    let adjustedPrice = basePrice;
    try {
      const rules = await getActivePricingRules();
      const now = new Date();
      const checkinDate = new Date(checkIn);
      const daysBeforeArrival = Math.ceil((checkinDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = [...rules].sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
      for (const rule of sorted) {
        const pct = parseFloat(rule.percentage);
        if (isNaN(pct) || pct === 0) continue;
        if ((rule.min_nights || 1) > serverNights) continue;

        let applies = false;
        if (rule.type === 'seizoen' && rule.start_date && rule.end_date) {
          applies = checkinDate >= new Date(rule.start_date) && checkinDate <= new Date(rule.end_date);
        } else if (rule.type === 'vroegboek' && rule.days_before_checkin != null) {
          applies = daysBeforeArrival >= rule.days_before_checkin;
        } else if (rule.type === 'lastminute' && rule.days_before_checkin != null) {
          applies = daysBeforeArrival <= rule.days_before_checkin;
        }
        if (applies) {
          adjustedPrice += Math.round(basePrice * pct / 100);
        }
      }
    } catch (err) {
      console.error('Failed to load pricing rules:', err);
    }
    adjustedPrice = Math.max(0, adjustedPrice);

    // Calculate extras server-side
    const weeks = Math.ceil(serverNights / 7);
    let serverExtrasCost = 0;
    const bikeCount = Math.max(0, Math.min(10, Number(extraBikes) || 0));
    const mtbCount = Math.max(0, Math.min(10, Number(extraMountainbikes) || 0));
    if (extraBedlinnen) serverExtrasCost += weeks * 70;
    if (extraFridge) serverExtrasCost += weeks * 40;
    if (extraAirco) serverExtrasCost += weeks * 50;
    serverExtrasCost += bikeCount * weeks * 50;
    serverExtrasCost += mtbCount * weeks * 50;

    // Apply discount — validate code server-side, never trust client amount
    let serverDiscount = 0;
    if (discountCode && typeof discountCode === 'string' && discountCode.trim()) {
      const validation = await validateDiscountCode(discountCode.trim(), adjustedPrice);
      if (validation.valid && validation.discountAmount) {
        serverDiscount = validation.discountAmount;
      }
    }

    const totalPrice = adjustedPrice - serverDiscount + serverExtrasCost;
    const serverBorgAmount = 400 + (bikeCount + mtbCount) * 200;

    // Calculate 25% deposit amount (server-calculated)
    const deposit25 = Math.round(totalPrice * 0.25);
    const remaining = totalPrice - deposit25;

    // Atomic availability check + booking creation (prevents race condition / double-bookings)
    const result = await createBookingAtomic({
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
      nights: serverNights,
      totalPrice,
      depositAmount: deposit25,
      remainingAmount: remaining,
      borgAmount: serverBorgAmount,
      spotNumber,
    });

    if (!result) {
      return NextResponse.json({ error: 'Deze caravan is al geboekt voor de geselecteerde periode. Kies andere data.' }, { status: 409 });
    }

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

    // Look up customer locale (account-creatie + welkomstmail gebeuren pas in de
    // Stripe webhook, ná succesvolle betaling — anders sturen we al inloggegevens
    // voordat we weten of de boeking betaald wordt).
    const normalizedEmail = guestEmail.toLowerCase().trim();
    const bookingCustomer = await getCustomerByEmail(normalizedEmail).catch(() => null);
    const customerLocale = bookingCustomer?.locale || 'nl';

    // Don't create the Holded invoice or Stripe Checkout here yet. The customer is redirected
    // to /betalen/[ref] where they fill in their billing address; that endpoint creates the
    // Holded contact (with address) + invoice + Stripe Checkout session in one go.
    const paymentToken = signBookingPaymentToken(result.reference);
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com';
    const paymentUrl = `${baseUrl}/betalen/${result.reference}?token=${paymentToken}`;

    // Geen bevestigingsmail naar klant op dit moment — die wordt pas via de Stripe
    // webhook verstuurd zodra de betaling is gelukt, of als 'betaling mislukt' bij
    // session.expired / payment_intent.payment_failed.

    // Notify admin of new booking (non-blocking)
    sendAdminNewBookingNotification({
      guestName,
      guestEmail,
      guestPhone,
      reference: result.reference,
      campingName,
      checkIn,
      checkOut,
      nights: serverNights,
      adults: adults || 2,
      children: children || 0,
      totalPrice,
      specialRequests,
    }).catch(err => console.error('Admin booking notification email failed:', err));

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
    const { id, status, adminNotes, caravanId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
    }

    if (status) {
      await updateBookingStatus(id, status);
    }
    if (adminNotes !== undefined) {
      await updateBookingNotes(id, adminNotes);
    }
    if (caravanId !== undefined) {
      await updateBookingCaravan(id, caravanId || null);
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
