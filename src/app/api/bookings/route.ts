import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getAllBookings, updateBookingStatus, updateBookingNotes, createBorgChecklist, getAllCustomCaravans, deleteBookingById, incrementDiscountCodeUsage } from '@/lib/db';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import { getAllCampings } from '@/lib/db';

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
    const body = await request.json();
    const { guestName, guestEmail, guestPhone, adults, children, specialRequests, caravanId, campingId, checkIn, checkOut, nights, totalPrice, borgAmount, spotNumber, discountCode, discountAmount } = body;

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
      depositAmount: 0,
      remainingAmount: totalPrice,
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
    const campingName = await (async () => {
      try {
        const dbCampings = await getAllCampings();
        const found = dbCampings.find((c: Record<string, unknown>) => c.id === campingId);
        if (found) return found.name as string;
      } catch {}
      return staticCampings.find(c => c.id === campingId)?.name || campingId;
    })();
    // Determine payment deadline: 30 days before check-in, or now if < 30 days
    const checkInDate = new Date(checkIn);
    const now = new Date();
    const daysUntil = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const paymentDeadline = daysUntil > 30
      ? new Date(checkInDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : 'nu';
    const immediatePayment = daysUntil <= 30;

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
    }).catch(err => console.error('Booking confirmation email failed:', err));

    // Auto-create borgchecklist for this booking (inchecken)
    createBorgChecklist({ bookingId: result.id, type: 'INCHECKEN' })
      .catch(err => console.error('Auto borg checklist creation failed:', err));

    // Increment discount code usage if used
    if (discountCode) {
      incrementDiscountCodeUsage(discountCode)
        .catch(err => console.error('Discount code usage increment failed:', err));
    }

    return NextResponse.json({ ...result, paymentId: result.paymentId, immediatePayment }, { status: 201 });
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
