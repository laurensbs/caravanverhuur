import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCustomCaravans,
  createCustomCaravan,
  updateCustomCaravan,
  deleteCustomCaravan,
} from '@/lib/db';

// GET - List all custom (admin-added) caravans
export async function GET() {
  try {
    const caravans = await getAllCustomCaravans();
    // Transform DB rows to match the Caravan interface
    const formatted = caravans.map(c => ({
      id: c.id,
      reference: c.reference,
      name: c.name,
      type: c.type,
      maxPersons: c.max_persons,
      manufacturer: c.manufacturer,
      year: c.year,
      description: c.description,
      photos: typeof c.photos === 'string' ? JSON.parse(c.photos) : (c.photos || []),
      amenities: typeof c.amenities === 'string' ? JSON.parse(c.amenities) : (c.amenities || []),
      inventory: typeof c.inventory === 'string' ? JSON.parse(c.inventory) : (c.inventory || []),
      pricePerDay: Number(c.price_per_day),
      pricePerWeek: Number(c.price_per_week),
      deposit: Number(c.deposit),
      status: c.status,
      isCustom: true,
      createdAt: c.created_at,
    }));
    return NextResponse.json({ caravans: formatted });
  } catch (error) {
    console.error('Error fetching custom caravans:', error);
    return NextResponse.json({ error: 'Fout bij ophalen caravans' }, { status: 500 });
  }
}

// POST - Create new caravan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, maxPersons, manufacturer, year, description, photos, amenities, inventory, pricePerDay, pricePerWeek, deposit } = body;

    if (!name || !manufacturer || !year) {
      return NextResponse.json({ error: 'Naam, fabrikant en bouwjaar zijn verplicht' }, { status: 400 });
    }

    const result = await createCustomCaravan({
      name,
      type: type || 'FAMILIE',
      maxPersons: maxPersons || 4,
      manufacturer,
      year: parseInt(year),
      description: description || '',
      photos: photos || [],
      amenities: amenities || [],
      inventory: inventory || [],
      pricePerDay: parseFloat(pricePerDay) || 0,
      pricePerWeek: parseFloat(pricePerWeek) || 0,
      deposit: parseFloat(deposit) || 0,
    });

    return NextResponse.json({ success: true, id: result.id, reference: result.reference });
  } catch (error) {
    console.error('Error creating caravan:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken caravan' }, { status: 500 });
  }
}

// PATCH - Update caravan
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Caravan-ID is verplicht' }, { status: 400 });
    }

    const result = await updateCustomCaravan(id, data);
    if (!result) {
      return NextResponse.json({ error: 'Caravan niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating caravan:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken caravan' }, { status: 500 });
  }
}

// DELETE - Delete caravan
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Caravan-ID is verplicht' }, { status: 400 });
    }

    await deleteCustomCaravan(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting caravan:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen caravan' }, { status: 500 });
  }
}
