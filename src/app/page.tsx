import { getAllCustomCaravans } from '@/lib/db';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import HomeContent from './HomeContent';

async function getCaravans(): Promise<Caravan[]> {
  try {
    const dbCaravans = await getAllCustomCaravans();
    const dbMap = new Map(dbCaravans.map((c: Record<string, unknown>) => [c.id as string, c]));

    const merged: Caravan[] = [];

    for (const sc of staticCaravans) {
      const override = dbMap.get(sc.id);
      if (override) {
        merged.push({
          id: override.id as string,
          reference: override.reference as string,
          name: override.name as string,
          type: override.type as Caravan['type'],
          maxPersons: override.max_persons as number,
          manufacturer: override.manufacturer as string,
          year: override.year as number,
          description: override.description as string,
          photos: typeof override.photos === 'string' ? JSON.parse(override.photos) : (override.photos as string[] || []),
          amenities: typeof override.amenities === 'string' ? JSON.parse(override.amenities) : (override.amenities as string[] || []),
          inventory: typeof override.inventory === 'string' ? JSON.parse(override.inventory) : (override.inventory as string[] || []),
          pricePerDay: Number(override.price_per_day),
          pricePerWeek: Number(override.price_per_week),
          deposit: Number(override.deposit),
          status: override.status as Caravan['status'],
          videoUrl: (override.video_url as string) || undefined,
        });
        dbMap.delete(sc.id);
      } else {
        merged.push(sc);
      }
    }

    for (const [, c] of dbMap) {
      const cc = c as Record<string, unknown>;
      if (cc.is_static_override) continue;
      merged.push({
        id: cc.id as string,
        reference: cc.reference as string,
        name: cc.name as string,
        type: cc.type as Caravan['type'],
        maxPersons: cc.max_persons as number,
        manufacturer: cc.manufacturer as string,
        year: cc.year as number,
        description: cc.description as string,
        photos: typeof cc.photos === 'string' ? JSON.parse(cc.photos) : (cc.photos as string[] || []),
        amenities: typeof cc.amenities === 'string' ? JSON.parse(cc.amenities) : (cc.amenities as string[] || []),
        inventory: typeof cc.inventory === 'string' ? JSON.parse(cc.inventory) : (cc.inventory as string[] || []),
        pricePerDay: Number(cc.price_per_day),
        pricePerWeek: Number(cc.price_per_week),
        deposit: Number(cc.deposit),
        status: cc.status as Caravan['status'],
        videoUrl: (cc.video_url as string) || undefined,
      });
    }

    return merged;
  } catch {
    return staticCaravans;
  }
}

export default async function HomePage() {
  const caravans = await getCaravans();
  return <HomeContent caravans={caravans} />;
}
