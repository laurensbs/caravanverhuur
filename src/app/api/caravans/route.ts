import { NextResponse } from 'next/server';
import { caravans as staticCaravans } from '@/data/caravans';
import { getAllCustomCaravans, getAvailableCaravanIds } from '@/lib/db';

// GET - Returns all caravans (static + custom, excluding unavailable)
export async function GET() {
  try {
    // Get custom caravans from DB
    let customCaravans: ReturnType<typeof formatCustomCaravan>[] = [];
    try {
      const dbCaravans = await getAllCustomCaravans();
      customCaravans = dbCaravans.map(formatCustomCaravan);
    } catch {
      // DB might not have the table yet — just use static
    }

    // Get unavailable caravan IDs (returns IDs with available=false)
    let unavailableIds: string[] = [];
    try {
      unavailableIds = await getAvailableCaravanIds(); // misleading name – returns UNavailable IDs
    } catch {
      // ignore
    }

    // Merge and filter
    const allCaravans = [
      ...staticCaravans.map(c => ({ ...c, isCustom: false })),
      ...customCaravans,
    ].filter(c => !unavailableIds.includes(c.id));

    return NextResponse.json({ caravans: allCaravans });
  } catch (error) {
    console.error('Error fetching caravans:', error);
    // Fallback to static caravans
    return NextResponse.json({ caravans: staticCaravans.map(c => ({ ...c, isCustom: false })) });
  }
}

function formatCustomCaravan(c: Record<string, unknown>) {
  return {
    id: c.id as string,
    reference: c.reference as string,
    name: c.name as string,
    type: c.type as string,
    maxPersons: c.max_persons as number,
    manufacturer: c.manufacturer as string,
    year: c.year as number,
    description: c.description as string,
    photos: typeof c.photos === 'string' ? JSON.parse(c.photos) : (c.photos || []),
    amenities: typeof c.amenities === 'string' ? JSON.parse(c.amenities) : (c.amenities || []),
    inventory: typeof c.inventory === 'string' ? JSON.parse(c.inventory) : (c.inventory || []),
    pricePerDay: Number(c.price_per_day),
    pricePerWeek: Number(c.price_per_week),
    deposit: Number(c.deposit),
    status: c.status as string,
    isCustom: true,
  };
}
