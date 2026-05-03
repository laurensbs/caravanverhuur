import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getStripe } from '@/lib/stripe';
import { updatePaymentStripeId, updateBookingAddress, getAllCampings } from '@/lib/db';
import { findOrCreateHoldedContact, createHoldedInvoice } from '@/lib/holded';
import { campings as staticCampings } from '@/data/campings';
import { verifyBookingPaymentToken } from '@/lib/payment-link-token';
import { parseJson } from '@/lib/validate';

const AddressSchema = z.object({
  street: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(2).max(20),
  city: z.string().trim().min(1).max(80),
  // ISO-3166-1 alpha-2 (e.g. NL, BE, ES). Loose check: 2 letters.
  country: z.string().trim().length(2).regex(/^[A-Za-z]{2}$/).transform(s => s.toUpperCase()),
});

async function resolveCampingName(campingId: string): Promise<string> {
  try {
    const dbCampings = await getAllCampings();
    const found = dbCampings.find((c: Record<string, unknown>) => c.id === campingId);
    if (found) return found.name as string;
  } catch {}
  return staticCampings.find(c => c.id === campingId)?.name || campingId;
}

interface BookingRow {
  id: string;
  reference: string;
  status: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  caravan_id: string;
  camping_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  total_price: string;
  deposit_amount: string;
  spot_number: string | null;
}

async function loadBookingByRef(ref: string): Promise<BookingRow | null> {
  const r = await sql<BookingRow>`SELECT * FROM bookings WHERE reference = ${ref} LIMIT 1`;
  return r.rows[0] || null;
}

// GET /api/betalen/[ref]?token=...  → returns booking summary so the page can render it
export async function GET(request: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!verifyBookingPaymentToken(ref, token)) {
    return NextResponse.json({ error: 'Ongeldige of verlopen link' }, { status: 401 });
  }
  const b = await loadBookingByRef(ref);
  if (!b) return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 });

  const p = await sql`SELECT id, status, amount FROM payments WHERE booking_id = ${b.id} AND type = 'AANBETALING' LIMIT 1`;
  const payment = p.rows[0];

  const campingName = await resolveCampingName(b.camping_id);

  return NextResponse.json({
    reference: b.reference,
    guestName: b.guest_name,
    guestEmail: b.guest_email,
    guestPhone: b.guest_phone,
    campingName,
    spotNumber: b.spot_number,
    checkIn: b.check_in,
    checkOut: b.check_out,
    nights: b.nights,
    adults: b.adults,
    children: b.children,
    totalPrice: parseFloat(b.total_price),
    depositAmount: parseFloat(b.deposit_amount),
    paymentStatus: payment?.status || null,
  });
}

// POST /api/betalen/[ref]?token=...  body: { street, postalCode, city, country }
// Saves address to booking + Holded contact, creates Stripe Checkout session, returns URL.
export async function POST(request: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!verifyBookingPaymentToken(ref, token)) {
    return NextResponse.json({ error: 'Ongeldige of verlopen link' }, { status: 401 });
  }

  const parsed = await parseJson(request, AddressSchema);
  if (!parsed.ok) return parsed.response;
  const { street, postalCode, city, country } = parsed.data;

  const b = await loadBookingByRef(ref);
  if (!b) return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 });

  const p = await sql<{ id: string; status: string; amount: string; holded_invoice_id: string | null }>`
    SELECT id, status, amount, holded_invoice_id FROM payments WHERE booking_id = ${b.id} AND type = 'AANBETALING' LIMIT 1
  `;
  const payment = p.rows[0];
  if (!payment) return NextResponse.json({ error: 'Geen aanbetaling gevonden' }, { status: 400 });
  if (payment.status === 'BETAALD') {
    return NextResponse.json({ error: 'Aanbetaling is al voldaan' }, { status: 400 });
  }

  // 1. Save address to booking
  await updateBookingAddress(b.id, { street, postalCode, city, country });

  // 2. Create or update Holded contact + invoice (best-effort, must not block payment)
  let holdedInvoiceId = payment.holded_invoice_id || '';
  try {
    const contactId = await findOrCreateHoldedContact({
      name: b.guest_name,
      email: b.guest_email,
      phone: b.guest_phone,
      address: { street, postalCode, city, country },
    });

    // If no invoice yet, create one. If one exists, leave it — we don't recreate to avoid duplicate Holded entries.
    if (!holdedInvoiceId) {
      const campingName = await resolveCampingName(b.camping_id);
      const checkInLabel = new Date(b.check_in).toLocaleDateString('nl-NL');
      const checkOutLabel = new Date(b.check_out).toLocaleDateString('nl-NL');
      const notes = [
        `Boeking ${b.reference}`,
        `Camping: ${campingName}${b.spot_number ? ` (plek ${b.spot_number})` : ''}`,
        `Verblijf: ${checkInLabel} t/m ${checkOutLabel} (${b.nights} nachten)`,
        `Gasten: ${b.adults} volw.${b.children > 0 ? ` + ${b.children} kind.` : ''}`,
        `Totale huurprijs: €${parseFloat(b.total_price).toFixed(2)} — Aanbetaling 25% (rest + borg op de camping)`,
      ].join('\n');
      const inv = await createHoldedInvoice({
        contactId,
        reference: `Aanbetaling boeking ${b.reference}`,
        items: [{ name: `Aanbetaling 25% — boeking ${b.reference}`, units: 1, subtotal: parseFloat(payment.amount), tax: 0 }],
        notes,
      });
      holdedInvoiceId = inv.invoiceId;
      await sql`UPDATE payments SET holded_status = 'IN_HOLDED', holded_invoice_id = ${holdedInvoiceId}, holded_marked_at = NOW() WHERE id = ${payment.id}`;
    }
  } catch (err) {
    console.error('[betalen] Holded sync failed (continuing to Stripe):', err);
  }

  // 3. Create Stripe Checkout Session
  try {
    const stripe = getStripe();
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://caravanverhuurspanje.com';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal', 'bancontact'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Aanbetaling 25% — boeking ${b.reference}`,
            description: `Caravanverhuur Spanje — ${b.guest_name}`,
          },
          unit_amount: Math.round(parseFloat(payment.amount) * 100),
        },
        quantity: 1,
      }],
      customer_email: b.guest_email,
      metadata: {
        paymentId: payment.id,
        bookingId: b.id,
        bookingRef: b.reference,
        type: 'AANBETALING',
        holdedInvoiceId,
      },
      success_url: `${baseUrl}/betaling/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/betalen/${b.reference}?token=${token}`,
    });
    await updatePaymentStripeId(payment.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[betalen] Stripe checkout creation failed:', err);
    return NextResponse.json({ error: 'Kon betaalpagina niet openen, probeer opnieuw of neem contact op' }, { status: 500 });
  }
}
