import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getBookingByReference } from '@/lib/db';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import { getAllCampings, getAllCustomCaravans } from '@/lib/db';

// GET /api/checkout/verify?session_id=cs_xxx
// Verifies that a Stripe checkout session was actually paid
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // iDEAL en Bancontact zijn async — direct na redirect kan de status nog
    // 'unpaid' of 'processing' zijn terwijl de betaling onderweg is. We vertrouwen
    // dan op de bestaande sessie + redirect. De webhook is alsnog source of truth.
    const status = String(session.payment_status);
    const isPaidOrPending = status === 'paid' || status === 'processing';
    const bookingRef = session.metadata?.bookingRef || null;

    let booking: {
      reference: string; caravanName: string; campingName: string; checkIn: string; checkOut: string;
      nights: number; totalPrice: number; depositAmount: number; guestEmail: string;
    } | null = null;
    if (bookingRef) {
      try {
        const b = await getBookingByReference(bookingRef);
        if (b) {
          // Resolve caravan + camping name
          let caravanName: string = staticCaravans.find(c => c.id === b.caravan_id)?.name || '';
          if (!caravanName) {
            try {
              const custom = await getAllCustomCaravans();
              caravanName = (custom.find((c: Record<string, unknown>) => c.id === b.caravan_id)?.name as string) || b.caravan_id;
            } catch { caravanName = b.caravan_id; }
          }
          let campingName: string = b.camping_id;
          try {
            const dbCampings = await getAllCampings();
            const found = dbCampings.find((c: Record<string, unknown>) => c.id === b.camping_id);
            if (found) campingName = found.name as string;
            else campingName = staticCampings.find(c => c.id === b.camping_id)?.name || b.camping_id;
          } catch {
            campingName = staticCampings.find(c => c.id === b.camping_id)?.name || b.camping_id;
          }
          booking = {
            reference: b.reference,
            caravanName,
            campingName,
            checkIn: b.check_in,
            checkOut: b.check_out,
            nights: b.nights,
            totalPrice: parseFloat(b.total_price),
            depositAmount: parseFloat(b.deposit_amount),
            guestEmail: b.guest_email,
          };
        }
      } catch (err) {
        console.warn('Failed to load booking for success page:', err);
      }
    }

    return NextResponse.json({
      paid: isPaidOrPending,
      status,
      bookingRef,
      booking,
      amount: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
    });
  } catch (err) {
    console.error('checkout/verify error:', err);
    // Bij netwerk- of config-fout: vertrouw op de webhook en toon succespagina.
    return NextResponse.json({ paid: true, status: 'webhook-fallback' });
  }
}
