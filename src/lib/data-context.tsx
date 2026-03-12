'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import type { Camping } from '@/data/campings';

interface DataContextValue {
  caravans: Caravan[];
  campings: (Camping & { active?: boolean })[];
}

const DataContext = createContext<DataContextValue>({
  caravans: staticCaravans,
  campings: staticCampings.map(c => ({ ...c, active: true })),
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [campings, setCampings] = useState<(Camping & { active?: boolean })[]>(
    staticCampings.map(c => ({ ...c, active: true }))
  );

  useEffect(() => {
    fetch('/api/admin/caravans')
      .then(res => res.json())
      .then(data => { if (data.caravans?.length) setCustomCaravans(data.caravans); })
      .catch(e => console.error('Fetch caravans error:', e));

    fetch('/api/campings')
      .then(res => res.json())
      .then(data => { if (data.campings?.length) setCampings(data.campings); })
      .catch(e => console.error('Fetch campings error:', e));
  }, []);

  const caravans = useMemo(() => [...staticCaravans, ...customCaravans], [customCaravans]);

  return (
    <DataContext.Provider value={{ caravans, campings }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
