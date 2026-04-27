import { NextRequest, NextResponse } from 'next/server';
import { getHoldedInvoicePublicUrl } from '@/lib/holded';

// GET /api/admin/holded/url?invoiceId=... → 302 redirect naar de Holded publieke factuur-URL.
// We laten de Holded API zelf de juiste URL teruggeven; gokken op /invoices/{id} of
// /invoicing/invoices/{id} werkt niet betrouwbaar.
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoiceId = request.nextUrl.searchParams.get('invoiceId');
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });

  try {
    const url = await getHoldedInvoicePublicUrl(invoiceId);
    // Fallback naar de invoices-overzichtspagina als Holded geen publieke URL teruggeeft;
    // dan komt de admin nog ergens nuttigs uit.
    return NextResponse.redirect(url || 'https://app.holded.com/invoicing/invoices', 302);
  } catch (err) {
    console.error('GET /api/admin/holded/url error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch URL' }, { status: 500 });
  }
}
