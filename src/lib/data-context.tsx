'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import type { Camping } from '@/data/campings';
import { destinations as staticDestinations } from '@/data/destinations';
import type { Destination } from '@/data/destinations';

interface DataContextValue {
  caravans: Caravan[];
  campings: (Camping & { active?: boolean })[];
  destinations: Destination[];
}

const DataContext = createContext<DataContextValue>({
  caravans: staticCaravans,
  campings: staticCampings.map(c => ({ ...c, active: true })),
  destinations: staticDestinations,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [campings, setCampings] = useState<(Camping & { active?: boolean })[]>(
    staticCampings.map(c => ({ ...c, active: true }))
  );
  const [destinations, setDestinations] = useState<Destination[]>(staticDestinations);

  useEffect(() => {
    fetch('/api/caravans?all=true')
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => { if (data.caravans?.length) setCustomCaravans(data.caravans); })
      .catch(() => { /* Not authenticated or unavailable — use static data */ });

    fetch('/api/campings')
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => { if (data.campings?.length) setCampings(data.campings); })
      .catch(() => { /* Unavailable — use static data */ });

    fetch('/api/destinations')
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => { if (data.destinations?.length) setDestinations(data.destinations); })
      .catch(() => { /* Unavailable — use static data */ });
  }, []);

  // API already returns the full merged list (static + overrides + custom)
  const caravans = useMemo(() => customCaravans.length > 0 ? customCaravans : staticCaravans, [customCaravans]);

  return (
    <DataContext.Provider value={{ caravans, campings, destinations }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
