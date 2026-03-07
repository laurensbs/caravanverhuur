import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampings,
  createCamping,
  updateCamping,
  deleteCamping,
  reorderCampings,
} from '@/lib/db';

// GET - List all campings
export async function GET() {
  try {
    const campings = await getAllCampings();
    return NextResponse.json({ campings });
  } catch (error) {
    console.error('Error fetching campings:', error);
    return NextResponse.json({ error: 'Fout bij ophalen campings' }, { status: 500 });
  }
}

// POST - Create new camping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location, description, website } = body;

    if (!name || !location) {
      return NextResponse.json({ error: 'Naam en locatie zijn verplicht' }, { status: 400 });
    }

    const result = await createCamping({ name, location, description, website });
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error creating camping:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken camping' }, { status: 500 });
  }
}

// PUT - Update camping or reorder
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Reorder mode
    if (body.reorder && Array.isArray(body.orderedIds)) {
      await reorderCampings(body.orderedIds);
      return NextResponse.json({ success: true });
    }

    // Update single camping
    const { id, name, location, description, website, active } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    await updateCamping(id, { name, location, description, website, active });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating camping:', error);
    return NextResponse.json({ error: 'Fout bij updaten camping' }, { status: 500 });
  }
}

// DELETE - Delete camping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    await deleteCamping(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting camping:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen camping' }, { status: 500 });
  }
}
