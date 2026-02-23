import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments, updatePaymentStatus, createPayment, getPaymentsByBookingId } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get('bookingId');

    if (bookingId) {
      const payments = await getPaymentsByBookingId(bookingId);
      return NextResponse.json(payments);
    }

    const payments = await getAllPayments();
    return NextResponse.json(payments);
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, type, amount, status, method } = body;

    if (!bookingId || !type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createPayment({ bookingId, type, amount, status, method });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, paidAt } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    await updatePaymentStatus(id, status, paidAt);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
