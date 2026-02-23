import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getAllBookings, updateBookingStatus, updateBookingNotes } from '@/lib/db';

export async function GET() {
  try {
    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestName, guestEmail, guestPhone, adults, children, specialRequests, caravanId, campingId, checkIn, checkOut, nights, totalPrice, depositAmount, remainingAmount, borgAmount } = body;

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
    });

    return NextResponse.json(result, { status: 201 });
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
