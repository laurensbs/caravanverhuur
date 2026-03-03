import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getAllBookings, updateBookingStatus, updateBookingNotes, createBorgChecklist, getAllCustomCaravans } from '@/lib/db';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings } from '@/data/campings';

export async function GET() {
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
    const body = await request.json();
    const { guestName, guestEmail, guestPhone, adults, children, specialRequests, caravanId, campingId, checkIn, checkOut, nights, totalPrice, depositAmount, remainingAmount, borgAmount, spotNumber } = body;

    if (!guestName || !guestEmail || !guestPhone || !caravanId || !campingId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createBooking({
      guestName,
      guestEmail,
      guestPhone,
      adults: adults || 2,
      children: children || 0,
      specialRequests,
      caravanId,
      campingId,
      checkIn,
      checkOut,
      nights,
      totalPrice,
      depositAmount,
      remainingAmount,
      borgAmount,
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
    const campingName = campings.find(c => c.id === campingId)?.name || campingId;
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
      depositAmount,
      remainingAmount,
      spotNumber,
    }).catch(err => console.error('Booking confirmation email failed:', err));

    // Auto-create borgchecklist for this booking (inchecken)
    createBorgChecklist({ bookingId: result.id, type: 'INCHECKEN' })
      .catch(err => console.error('Auto borg checklist creation failed:', err));

    return NextResponse.json({ ...result, depositPaymentId: result.depositPaymentId }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
