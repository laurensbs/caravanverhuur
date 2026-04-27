import { NextRequest, NextResponse } from 'next/server';
import { getHoldedInvoicePublicUrl } from '@/lib/holded';

// Publieke redirect: /holded-invoice/{id} → echte Holded publieke factuur-URL.
// Veilig publiek omdat Holded zelf bepaalt welke URL hij teruggeeft (alleen invoices
// waarvoor public sharing aanstaat); zonder geldige id krijg je niets bruikbaars.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 });

  try {
    const url = await getHoldedInvoicePublicUrl(id);
    if (url) return NextResponse.redirect(url, 302);
    return NextResponse.json({
      error: 'Geen publieke betaal-URL beschikbaar voor deze factuur. Neem contact met ons op.',
    }, { status: 404 });
  } catch (err) {
    console.error('GET /api/holded-invoice/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch invoice URL' }, { status: 500 });
  }
}
