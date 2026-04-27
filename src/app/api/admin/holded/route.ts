import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentHoldedStatus, getPaymentById, getBookingById, getAllCustomCaravans, getAllCampings } from '@/lib/db';
import { findOrCreateHoldedContact, createHoldedInvoice, getHoldedInvoicePublicUrl, getHoldedInvoicePdf, getHoldedInvoice } from '@/lib/holded';
import { sendPaymentLinkEmail } from '@/lib/email';
import { caravans as staticCaravans } from '@/data/caravans';
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

    // Resolve caravan + camping name (mirrors logic in /api/bookings POST)
    let caravanName: string = staticCaravans.find(c => c.id === booking.caravan_id)?.name || '';
    if (!caravanName) {
      try {
        const custom = await getAllCustomCaravans();
        caravanName = (custom.find((c: Record<string, unknown>) => c.id === booking.caravan_id)?.name as string) || booking.caravan_id;
      } catch { caravanName = booking.caravan_id; }
    }
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
      `Caravan: ${caravanName}`,
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
        name: `Aanbetaling 25% — boeking ${booking.reference} (${caravanName})`,
        units: 1,
        subtotal: amount,
        tax: 0,
      }],
      notes: invoiceNotes,
    });

    await updatePaymentHoldedStatus(paymentId, 'IN_HOLDED', holded.invoiceId);

    // Check of de factuur (mogelijk al via een eerdere flow) reeds betaald is bij Holded.
    let alreadyPaid = false;
    try {
      const status = await getHoldedInvoice(holded.invoiceId);
      alreadyPaid = !!status.paid;
    } catch (statusErr) {
      console.warn('Could not fetch Holded invoice status:', statusErr);
    }

    const directPublicUrl = holded.publicUrl || (await getHoldedInvoicePublicUrl(holded.invoiceId));
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://caravanverhuurspanje.com';
    const paymentUrlForEmail = alreadyPaid ? undefined : (directPublicUrl || `${siteUrl}/api/holded-invoice/${holded.invoiceId}`);

    let invoicePdfBase64: string | undefined;
    try {
      const pdf = await getHoldedInvoicePdf(holded.invoiceId);
      invoicePdfBase64 = pdf.toString('base64');
      console.log(`[holded] PDF size: ${(pdf.length / 1024).toFixed(1)} KB for invoice ${holded.invoiceId}`);
    } catch (pdfErr) {
      console.warn('Could not fetch Holded PDF for attachment:', pdfErr);
    }

    let mailSent = false;
    try {
      const result = await sendPaymentLinkEmail(booking.guest_email, {
        guestName: booking.guest_name,
        reference: booking.reference,
        depositAmount: amount,
        paymentUrl: paymentUrlForEmail,
        invoicePdfBase64,
        invoiceNumber: holded.number,
        alreadyPaid,
      });
      mailSent = result.success;
      console.log(`[holded] Payment link email send → success=${mailSent}, hasPublicUrl=${!!directPublicUrl}, hasPdf=${!!invoicePdfBase64}`);
    } catch (sendErr) {
      console.error('Failed to send payment link email:', sendErr);
    }

    return NextResponse.json({ success: true, holdedInvoiceId: holded.invoiceId, mailSent, publicUrl: directPublicUrl });
  } catch (error) {
    console.error('POST /api/admin/holded error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create Holded invoice' }, { status: 500 });
  }
}
