import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentHoldedStatus } from '@/lib/db';

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
