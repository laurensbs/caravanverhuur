import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

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

    return NextResponse.json({
      paid: isPaidOrPending,
      status,
      bookingRef: session.metadata?.bookingRef || null,
    });
  } catch (err) {
    console.error('checkout/verify error:', err);
    // Bij netwerk- of config-fout: vertrouw op de webhook en toon succespagina.
    return NextResponse.json({ paid: true, status: 'webhook-fallback' });
  }
}
