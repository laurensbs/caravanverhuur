import { NextRequest, NextResponse } from 'next/server';
import {
  createBorgChecklist,
  getAllBorgChecklists,
  getBorgChecklistById,
  getBorgChecklistsByBooking,
  updateBorgChecklist,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');
    const id = searchParams.get('id');

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
  try {
    const body = await request.json();
    const { id, items, status, generalNotes, staffName, completedAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is verplicht' }, { status: 400 });
    }

    await updateBorgChecklist(id, {
      items: items ? JSON.stringify(items) : undefined,
      status,
      generalNotes,
      staffName,
      completedAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/borg error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
