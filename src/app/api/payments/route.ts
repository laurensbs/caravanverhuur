import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments, updatePaymentStatus, createPayment, getPaymentsByBookingId, getBookingById, getCustomerByEmail } from '@/lib/db';
import { sendPaymentConfirmationEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get('bookingId');

    if (bookingId) {
      // Require customer session or admin auth for per-booking lookup
      const cookie = request.cookies.get('admin_session')?.value;
      const customerSession = request.cookies.get('customer_session')?.value;
      if (!cookie && !customerSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const payments = await getPaymentsByBookingId(bookingId);
      return NextResponse.json({ payments });
    }

    // Listing ALL payments requires admin auth
    const cookie = request.cookies.get('admin_session')?.value;
    const authHeader = request.headers.get('authorization');
    const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payments = await getAllPayments();
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Require admin auth to create payments
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  // Require admin auth to update payments
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, status, paidAt } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    await updatePaymentStatus(id, status, paidAt);

    // Send confirmation email when payment is marked as paid
    if (status === 'BETAALD') {
      try {
        // Find the payment to get booking details
        const payments = await getAllPayments();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payment = payments.find((p: any) => p.id === id);
        if (payment) {
          const booking = await getBookingById(payment.booking_id);
          if (booking) {
            const payCustomer = await getCustomerByEmail(booking.guest_email).catch(() => null);
            sendPaymentConfirmationEmail(booking.guest_email, {
              guestName: booking.guest_name,
              reference: booking.reference,
              type: payment.type,
              amount: parseFloat(payment.amount),
              paidAt: paidAt || new Date().toISOString(),
            }, payCustomer?.locale).catch(err => console.error('Payment confirmation email failed:', err));
          }
        }
      } catch (emailErr) {
        console.error('Failed to send payment email:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
