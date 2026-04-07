import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments, updatePaymentStatus, createPayment, getPaymentsByBookingId, getBookingById, getCustomerByEmail, getCustomerBySessionToken, updatePaymentLink, updatePaymentReminderSent, getPaymentById } from '@/lib/db';
import { sendPaymentConfirmationEmail, sendPaymentReminderEmail } from '@/lib/email';

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

      // If customer (not admin), verify the booking belongs to them
      if (!cookie && customerSession) {
        const customer = await getCustomerBySessionToken(customerSession);
        if (!customer) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const booking = await getBookingById(bookingId);
        if (!booking || booking.guest_email.toLowerCase() !== customer.email.toLowerCase()) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
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

export async function PUT(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, action, paymentLink } = body;

    if (!id) return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });

    if (action === 'update-link') {
      await updatePaymentLink(id, paymentLink || '');
      return NextResponse.json({ success: true });
    }

    if (action === 'send-reminder') {
      const payment = await getPaymentById(id);
      if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

      const booking = await getBookingById(payment.booking_id);
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      const customer = await getCustomerByEmail(booking.guest_email).catch(() => null);
      const daysUntil = Math.max(0, Math.ceil((new Date(booking.check_in).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      await sendPaymentReminderEmail({
        to: booking.guest_email,
        guestName: booking.guest_name,
        reference: booking.reference,
        caravanName: '',
        campingName: '',
        checkIn: booking.check_in,
        amount: parseFloat(payment.amount),
        daysUntil,
      }, customer?.locale);

      await updatePaymentReminderSent(id);
      return NextResponse.json({ success: true, reminderSentAt: new Date().toISOString() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/payments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
