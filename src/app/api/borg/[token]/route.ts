import { NextRequest, NextResponse } from 'next/server';
import { getBorgChecklistByToken, customerAgreeBorgChecklist, createPayment, getBookingById, getCustomerByEmail } from '@/lib/db';
import { sendBorgConfirmationEmail } from '@/lib/email';
import { borgLimiter, getClientIp } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rl = borgLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { token } = await params;
    const checklist = await getBorgChecklistByToken(token);

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('GET /api/borg/[token] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { agreed, notes, borgReturnMethod, signature } = body;

    const checklist = await getBorgChecklistByToken(token);
    if (!checklist) {
      return NextResponse.json({ error: 'Checklist niet gevonden' }, { status: 404 });
    }

    if (checklist.status !== 'AFGEROND') {
      return NextResponse.json({ error: 'Checklist is nog niet afgerond door staff' }, { status: 400 });
    }

    // Validate borgReturnMethod if provided
    if (borgReturnMethod && !['contant', 'bank'].includes(borgReturnMethod)) {
      return NextResponse.json({ error: 'Ongeldige borg terugbetaling methode' }, { status: 400 });
    }

    await customerAgreeBorgChecklist(token, agreed, notes, borgReturnMethod, signature);

    // Auto-create BORG_RETOUR payment when customer agrees
    if (agreed && checklist.booking_id) {
      const booking = await getBookingById(checklist.booking_id).catch(() => null);

      try {
        if (booking && booking.borg_amount) {
          const borgAmount = parseFloat(booking.borg_amount);
          const totalDeduction = checklist.total_deduction ? parseFloat(checklist.total_deduction) : 0;
          const refundAmount = Math.max(0, borgAmount - totalDeduction);
          if (refundAmount > 0) {
            await createPayment({
              bookingId: booking.id,
              type: 'BORG_RETOUR',
              amount: refundAmount,
              status: 'BETAALD',
              method: borgReturnMethod === 'contant' ? 'cash' : 'bank',
            });
          }
        }
      } catch (refundErr) {
        console.error('Auto borg refund creation failed (non-fatal):', refundErr);
      }

      // Send confirmation email to customer
      try {
        const borgAmount = booking?.borg_amount ? parseFloat(booking.borg_amount) : 0;
        const totalDeduction = checklist.total_deduction ? parseFloat(checklist.total_deduction) : 0;
        const refundAmount = Math.max(0, borgAmount - totalDeduction);
        const borgCustomer = await getCustomerByEmail(checklist.guest_email).catch(() => null);
        await sendBorgConfirmationEmail({
          to: checklist.guest_email,
          guestName: checklist.guest_name || 'Klant',
          reference: checklist.booking_ref || '',
          borgReturnMethod: (borgReturnMethod as 'contant' | 'bank') || 'bank',
          refundAmount,
        }, borgCustomer?.locale);
      } catch (emailErr) {
        console.error('Borg confirmation email failed (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/borg/[token] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
