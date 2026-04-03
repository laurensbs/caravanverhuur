import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCustomCaravans,
  createCustomCaravan,
  updateCustomCaravan,
  deleteCustomCaravan,
  upsertCaravan,
  logActivity,
} from '@/lib/db';
import { caravans as staticCaravans } from '@/data/caravans';
import { getSessionFromHeaders } from '@/lib/admin-auth';

// GET - List ALL caravans (static with DB overrides + custom)
export async function GET() {
  try {
    const dbCaravans = await getAllCustomCaravans();
    const dbMap = new Map(dbCaravans.map(c => [c.id, c]));

    // Build unified list: static caravans (with DB overrides) + pure custom caravans
    const formatted = [];

    // 1. Static caravans — use DB override if exists, otherwise use static data
    for (const sc of staticCaravans) {
      const override = dbMap.get(sc.id);
      if (override) {
        formatted.push({
          id: override.id,
          reference: override.reference,
          name: override.name,
          type: override.type,
          maxPersons: override.max_persons,
          manufacturer: override.manufacturer,
          year: override.year,
          description: override.description,
          photos: typeof override.photos === 'string' ? JSON.parse(override.photos) : (override.photos || []),
          videoUrl: override.video_url || null,
          amenities: typeof override.amenities === 'string' ? JSON.parse(override.amenities) : (override.amenities || []),
          inventory: typeof override.inventory === 'string' ? JSON.parse(override.inventory) : (override.inventory || []),
          pricePerDay: Number(override.price_per_day),
          pricePerWeek: Number(override.price_per_week),
          deposit: Number(override.deposit),
          status: override.status,
          isCustom: false,
          isStaticOverride: true,
          createdAt: override.created_at,
        });
        dbMap.delete(sc.id); // remove from map so it's not added again
      } else {
        formatted.push({
          ...sc,
          videoUrl: sc.videoUrl || null,
          isCustom: false,
          isStaticOverride: false,
        });
      }
    }

    // 2. Pure custom caravans (not static overrides)
    for (const [, c] of dbMap) {
      if (c.is_static_override) continue; // shouldn't happen but safety check
      formatted.push({
        id: c.id,
        reference: c.reference,
        name: c.name,
        type: c.type,
        maxPersons: c.max_persons,
        manufacturer: c.manufacturer,
        year: c.year,
        description: c.description,
        photos: typeof c.photos === 'string' ? JSON.parse(c.photos) : (c.photos || []),
        videoUrl: c.video_url || null,
        amenities: typeof c.amenities === 'string' ? JSON.parse(c.amenities) : (c.amenities || []),
        inventory: typeof c.inventory === 'string' ? JSON.parse(c.inventory) : (c.inventory || []),
        pricePerDay: Number(c.price_per_day),
        pricePerWeek: Number(c.price_per_week),
        deposit: Number(c.deposit),
        status: c.status,
        isCustom: true,
        isStaticOverride: false,
        createdAt: c.created_at,
      });
    }

    return NextResponse.json({ caravans: formatted });
  } catch (error) {
    console.error('Error fetching caravans:', error);
    // Fallback to static caravans
    return NextResponse.json({
      caravans: staticCaravans.map(c => ({ ...c, isCustom: false, isStaticOverride: false })),
    });
  }
}

// POST - Create new caravan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, maxPersons, manufacturer, year, description, photos, videoUrl, amenities, inventory, pricePerDay, pricePerWeek, deposit } = body;

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
      videoUrl: videoUrl || undefined,
      amenities: amenities || [],
      inventory: inventory || [],
      pricePerDay: parseFloat(pricePerDay) || 0,
      pricePerWeek: parseFloat(pricePerWeek) || 0,
      deposit: parseFloat(deposit) || 0,
    });

    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'caravan_created', entityType: 'caravan', entityId: result.id, entityLabel: name, details: `Ref: ${result.reference}` }).catch(() => {});

    return NextResponse.json({ success: true, id: result.id, reference: result.reference });
  } catch (error) {
    console.error('Error creating caravan:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken caravan' }, { status: 500 });
  }
}

// PATCH - Update any caravan (custom or static override)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isStaticOverride, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Caravan-ID is verplicht' }, { status: 400 });
    }

    // If this is a static caravan being edited, use upsert to create/update the override
    if (isStaticOverride) {
      const staticCaravan = staticCaravans.find(c => c.id === id);
      if (!staticCaravan) {
        return NextResponse.json({ error: 'Statische caravan niet gevonden' }, { status: 404 });
      }

      await upsertCaravan(id, staticCaravan.reference, {
        name: data.name ?? staticCaravan.name,
        maxPersons: data.maxPersons ?? staticCaravan.maxPersons,
        manufacturer: data.manufacturer ?? staticCaravan.manufacturer,
        year: data.year ?? staticCaravan.year,
        description: data.description ?? staticCaravan.description,
        photos: data.photos ?? staticCaravan.photos,
        videoUrl: data.videoUrl ?? staticCaravan.videoUrl,
        amenities: data.amenities ?? staticCaravan.amenities,
        inventory: data.inventory ?? staticCaravan.inventory,
        pricePerDay: data.pricePerDay ?? staticCaravan.pricePerDay,
        pricePerWeek: data.pricePerWeek ?? staticCaravan.pricePerWeek,
        deposit: data.deposit ?? staticCaravan.deposit,
        status: data.status ?? staticCaravan.status,
        isStaticOverride: true,
      });

      logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'caravan_updated', entityType: 'caravan', entityId: id, entityLabel: data.name ?? staticCaravan.name }).catch(() => {});

      return NextResponse.json({ success: true });
    }

    // Standard custom caravan update
    const result = await updateCustomCaravan(id, data);
    if (!result) {
      return NextResponse.json({ error: 'Caravan niet gevonden' }, { status: 404 });
    }

    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'caravan_updated', entityType: 'caravan', entityId: id, entityLabel: data.name || `#${id}` }).catch(() => {});

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
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'caravan_deleted', entityType: 'caravan', entityId: id, entityLabel: `Caravan #${id}` }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting caravan:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen caravan' }, { status: 500 });
  }
}
