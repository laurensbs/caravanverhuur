import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentHoldedStatus, getPaymentById, getBookingById, getAllCampings } from '@/lib/db';
import { findOrCreateHoldedContact, createHoldedInvoice, sendHoldedInvoice } from '@/lib/holded';
import { campings as staticCampings } from '@/data/campings';

export async function PATCH(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { paymentId, holdedStatus, holdedInvoiceId } = body;

    if (!paymentId || !holdedStatus) {
      return NextResponse.json({ error: 'Missing paymentId or holdedStatus' }, { status: 400 });
    }

    const validStatuses = ['NIET_AANGEMAAKT', 'HANDMATIG', 'IN_HOLDED'];
    if (!validStatuses.includes(holdedStatus)) {
      return NextResponse.json({ error: 'Invalid holdedStatus' }, { status: 400 });
    }

    await updatePaymentHoldedStatus(paymentId, holdedStatus, holdedInvoiceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/holded error:', error);
    return NextResponse.json({ error: 'Failed to update Holded status' }, { status: 500 });
  }
}

// POST: create + send a Holded invoice for an existing payment (admin-triggered).
// Used for bookings made before the auto-flow existed, or to resend a failed invoice.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { paymentId } = body;
    if (!paymentId) return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });

    const payment = await getPaymentById(paymentId);
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    const booking = await getBookingById(payment.booking_id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Resolve camping name. Caravan name is intentionally left out of customer-visible
    // proforma fields (we assign caravans server-side, the customer doesn't see it).
    let campingName: string = booking.camping_id;
    try {
      const dbCampings = await getAllCampings();
      const found = dbCampings.find((c: Record<string, unknown>) => c.id === booking.camping_id);
      if (found) campingName = found.name as string;
      else campingName = staticCampings.find(c => c.id === booking.camping_id)?.name || booking.camping_id;
    } catch {
      campingName = staticCampings.find(c => c.id === booking.camping_id)?.name || booking.camping_id;
    }

    const contactId = await findOrCreateHoldedContact({
      name: booking.guest_name,
      email: booking.guest_email,
      phone: booking.guest_phone,
    });

    const checkInLabel = new Date(booking.check_in).toLocaleDateString('nl-NL');
    const checkOutLabel = new Date(booking.check_out).toLocaleDateString('nl-NL');
    const invoiceNotes = [
      `Boeking ${booking.reference}`,
      `Camping: ${campingName}${booking.spot_number ? ` (plek ${booking.spot_number})` : ''}`,
      `Verblijf: ${checkInLabel} t/m ${checkOutLabel} (${booking.nights} nachten)`,
      `Gasten: ${booking.adults} volw.${booking.children > 0 ? ` + ${booking.children} kind.` : ''}`,
      `Totale huurprijs: €${parseFloat(booking.total_price).toFixed(2)} — Aanbetaling 25% (rest + borg op de camping)`,
    ].join('\n');

    const amount = parseFloat(payment.amount);
    const holded = await createHoldedInvoice({
      contactId,
      reference: `Aanbetaling boeking ${booking.reference}`,
      items: [{
        name: `Aanbetaling 25% — boeking ${booking.reference}`,
        units: 1,
        subtotal: amount,
        tax: 0,
      }],
      notes: invoiceNotes,
    });

    await updatePaymentHoldedStatus(paymentId, 'IN_HOLDED', holded.invoiceId);

    let mailSent = false;
    try {
      await sendHoldedInvoice(
        holded.invoiceId,
        booking.guest_email,
        `Factuur aanbetaling boeking ${booking.reference} — Caravanverhuur Spanje`,
        `Beste ${booking.guest_name.split(' ')[0]},\n\nHierbij de factuur voor de aanbetaling (25%) van je boeking ${booking.reference}. Je kunt direct online betalen via de link in deze e-mail.\n\nMet vriendelijke groet,\nCaravanverhuur Spanje`,
      );
      mailSent = true;
    } catch (sendErr) {
      console.error('Failed to send Holded invoice email:', sendErr);
    }

    return NextResponse.json({ success: true, holdedInvoiceId: holded.invoiceId, mailSent });
  } catch (error) {
    console.error('POST /api/admin/holded error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create Holded invoice' }, { status: 500 });
  }
}
