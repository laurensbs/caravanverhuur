import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBySessionToken, getBookingById, updateBookingStatus, getPaymentsByBookingId } from '@/lib/db';
import { sendCancellationEmail } from '@/lib/email';
import { caravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import { getAllCampings } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('customer_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const customer = await getCustomerBySessionToken(token);
    if (!customer) {
      return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is verplicht' }, { status: 400 });
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 });
    }

    // Verify the booking belongs to this customer
    if (booking.guest_email?.toLowerCase() !== customer.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    // Check booking is not already cancelled or completed
    if (booking.status === 'GEANNULEERD') {
      return NextResponse.json({ error: 'Deze boeking is al geannuleerd' }, { status: 400 });
    }

    // Calculate refund based on cancellation policy
    const checkIn = new Date(booking.check_in);
    const now = new Date();
    const daysUntil = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check if any payments have been made
    const bookingPayments = await getPaymentsByBookingId(bookingId);
    const hasPaid = bookingPayments.some((p: Record<string, unknown>) => p.status === 'BETAALD');

    let refundPercentage = 0;
    let refundMessage = '';

    if (!hasPaid) {
      // No payment made yet — free cancellation
      refundPercentage = 0;
      refundMessage = 'Er is nog geen betaling ontvangen. De boeking wordt kosteloos geannuleerd.';
    } else if (daysUntil > 30) {
      refundPercentage = 100;
      refundMessage = 'Volledige restitutie (meer dan 30 dagen voor aankomst). Je ontvangt het bedrag binnen 7 werkdagen terug.';
    } else if (daysUntil >= 14) {
      refundPercentage = 50;
      refundMessage = '50% restitutie (14-30 dagen voor aankomst). Je ontvangt het bedrag binnen 7 werkdagen terug.';
    } else {
      refundPercentage = 0;
      refundMessage = 'Geen restitutie mogelijk (minder dan 14 dagen voor aankomst).';
    }

    // Update booking status to GEANNULEERD
    await updateBookingStatus(bookingId, 'GEANNULEERD');

    // Send cancellation confirmation email (non-blocking)
    const caravanName = caravans.find(c => c.id === booking.caravan_id)?.name || `Caravan ${booking.caravan_id}`;
    const campingName = await (async () => {
      try {
        const dbCampings = await getAllCampings();
        const found = dbCampings.find((c: Record<string, unknown>) => c.id === booking.camping_id);
        if (found) return found.name as string;
      } catch {}
      return staticCampings.find(c => c.id === booking.camping_id)?.name || `Camping ${booking.camping_id}`;
    })();
    sendCancellationEmail({
      to: booking.guest_email,
      guestName: booking.guest_name,
      reference: booking.reference,
      caravanName,
      campingName,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      refundPercentage,
      refundMessage,
    }).catch(err => console.error('Cancellation email failed:', err));

    return NextResponse.json({
      success: true,
      daysUntil,
      refundPercentage,
      refundMessage,
    });
  } catch (error) {
    console.error('POST /api/bookings/cancel error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
