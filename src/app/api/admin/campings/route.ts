import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampings,
  createCamping,
  updateCamping,
  deleteCamping,
  reorderCampings,
  setupDatabase,
} from '@/lib/db';
import { campings as staticCampings } from '@/data/campings';

// GET - List all campings (auto-seeds from static data if DB is empty)
export async function GET() {
  try {
    let campings = await getAllCampings();

    // Auto-seed static campings into DB if empty
    if (campings.length === 0 && staticCampings.length > 0) {
      for (const sc of staticCampings) {
        await createCamping({
          name: sc.name,
          location: sc.location,
          description: sc.description,
          website: sc.website || '',
        });
      }
      campings = await getAllCampings();
    }

    return NextResponse.json({ campings });
  } catch (error) {
    // Auto-create tables if they don't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        await setupDatabase();
        // After setup, seed static campings
        for (const sc of staticCampings) {
          await createCamping({
            name: sc.name,
            location: sc.location,
            description: sc.description,
            website: sc.website || '',
          });
        }
        const campings = await getAllCampings();
        return NextResponse.json({ campings });
      } catch (setupError) {
        console.error('Error setting up database for campings:', setupError);
        return NextResponse.json({ error: 'Fout bij database setup' }, { status: 500 });
      }
    }
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
