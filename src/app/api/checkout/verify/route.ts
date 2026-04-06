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

    return NextResponse.json({
      paid: session.payment_status === 'paid',
      status: session.payment_status,
    });
  } catch {
    return NextResponse.json({ paid: false, status: 'unknown' });
  }
}
