import { NextRequest, NextResponse } from 'next/server';
import { getHoldedInvoicePdf } from '@/lib/holded';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoiceId = request.nextUrl.searchParams.get('invoiceId');
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });

  try {
    const pdf = await getHoldedInvoicePdf(invoiceId);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factuur-${invoiceId}.pdf"`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err) {
    console.error('GET /api/admin/holded/pdf error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch PDF' }, { status: 500 });
  }
}
