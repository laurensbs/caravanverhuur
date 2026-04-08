import { NextRequest, NextResponse } from 'next/server';
import {
  createBorgChecklist,
  getAllBorgChecklists,
  getBorgChecklistById,
  getBorgChecklistsByBooking,
  updateBorgChecklist,
  getCustomerByEmail,
  customerAgreeBorgChecklist,
  createPayment,
  getBookingById,
} from '@/lib/db';
import { sendBorgChecklistEmail, sendBorgConfirmationEmail } from '@/lib/email';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');
    const id = searchParams.get('id');

    // All borg lookups require admin auth
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    if (id) {
      const checklist = await getBorgChecklistById(id);
      if (!checklist) {
        return NextResponse.json({ error: 'Checklist niet gevonden' }, { status: 404 });
      }
      return NextResponse.json(checklist);
    }

    if (bookingId) {
      const checklists = await getBorgChecklistsByBooking(bookingId);
      return NextResponse.json(checklists);
    }

    const all = await getAllBorgChecklists();
    return NextResponse.json(all);
  } catch (error) {
    console.error('GET /api/borg error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { bookingId, type, staffName } = body;

    if (!bookingId || !type) {
      return NextResponse.json({ error: 'bookingId en type zijn verplicht' }, { status: 400 });
    }

    const result = await createBorgChecklist({ bookingId, type, staffName });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/borg error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { id, items, status, generalNotes, staffName, completedAt, extraDamages, cleaningDeduction, totalDeduction, customerConfirm } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is verplicht' }, { status: 400 });
    }

    await updateBorgChecklist(id, {
      items: items ? JSON.stringify(items) : undefined,
      status,
      generalNotes,
      staffName,
      completedAt,
      extraDamages: extraDamages ? JSON.stringify(extraDamages) : undefined,
      cleaningDeduction,
      totalDeduction,
    });

    // Admin takeover: customer confirm on admin's device
    if (customerConfirm) {
      const checklist = await getBorgChecklistById(id);
      if (checklist && checklist.token) {
        const { borgReturnMethod, customerSignature } = customerConfirm;
        await customerAgreeBorgChecklist(checklist.token, true, undefined, borgReturnMethod, customerSignature);

        const isCheckInType = checklist.type === 'INCHECKEN';

        // Auto-create BORG_RETOUR payment (only for checkout, not check-in)
        if (!isCheckInType && checklist.booking_id) {
          const booking = await getBookingById(checklist.booking_id).catch(() => null);

          try {
            if (booking && booking.borg_amount) {
              const borgAmount = parseFloat(booking.borg_amount);
              const totalDed = checklist.total_deduction ? parseFloat(checklist.total_deduction) : (totalDeduction || 0);
              const refundAmount = Math.max(0, borgAmount - totalDed);
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

          // Send confirmation email (only for checkout)
          try {
            if (checklist.guest_email) {
              const borgAmount = booking?.borg_amount ? parseFloat(booking.borg_amount) : 0;
              const totalDed = checklist.total_deduction ? parseFloat(checklist.total_deduction) : (totalDeduction || 0);
              const refundAmt = Math.max(0, borgAmount - totalDed);
              const borgCustomer = await getCustomerByEmail(checklist.guest_email).catch(() => null);
              await sendBorgConfirmationEmail({
                to: checklist.guest_email,
                guestName: checklist.guest_name || 'Klant',
                reference: checklist.booking_ref || '',
                borgReturnMethod: borgReturnMethod as 'contant' | 'bank',
                refundAmount: refundAmt,
              }, borgCustomer?.locale);
            }
          } catch (emailErr) {
            console.error('Borg confirmation email failed (non-fatal):', emailErr);
          }
        }
      }
    }

    // Send email notification to customer when checklist is completed
    // Skip if customer already confirmed on admin's device (customerConfirm present)
    if (status === 'AFGEROND' && !customerConfirm) {
      try {
        const checklist = await getBorgChecklistById(id);
        if (checklist && checklist.guest_email) {
          const borgCustomer = await getCustomerByEmail(checklist.guest_email).catch(() => null);
          await sendBorgChecklistEmail({
            to: checklist.guest_email,
            guestName: checklist.guest_name || 'Klant',
            reference: checklist.booking_ref || '',
            type: checklist.type as 'INCHECKEN' | 'UITCHECKEN',
            token: checklist.token,
            caravanName: checklist.caravan_id,
            checkIn: checklist.check_in ? new Date(checklist.check_in).toLocaleDateString('nl-NL') : undefined,
            checkOut: checklist.check_out ? new Date(checklist.check_out).toLocaleDateString('nl-NL') : undefined,
          }, borgCustomer?.locale);
        }
      } catch (emailErr) {
        console.error('Borg email error (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/borg error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
