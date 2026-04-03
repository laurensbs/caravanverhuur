import { NextRequest, NextResponse } from 'next/server';
import {
  createBorgChecklist,
  getAllBorgChecklists,
  getBorgChecklistById,
  getBorgChecklistsByBooking,
  updateBorgChecklist,
  getCustomerByEmail,
} from '@/lib/db';
import { sendBorgChecklistEmail } from '@/lib/email';
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
    const { id, items, status, generalNotes, staffName, completedAt, extraDamages, cleaningDeduction, totalDeduction } = body;

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

    // Send email notification to customer when checklist is completed
    if (status === 'AFGEROND') {
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
