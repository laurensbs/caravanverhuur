'use client';

// Persisteer filter/search state in de URL search-params zodat:
//   - refresh de filter behoudt
//   - bookmarks deelbaar zijn
//   - back-knop werkt natuurlijk (vorige filter-stand)
//
// Gedraagt zich als useState voor de caller. Onder water gebruikt 'ie
// useSearchParams + router.replace zodat de URL update zonder een
// volledige Next-navigation te triggeren (geen scroll-reset, geen
// remount van data-fetches).

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Setter<T> = (value: T | ((prev: T) => T)) => void;

export function useUrlState(key: string, defaultValue: string): [string, Setter<string>] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback<Setter<string>>(
    (next) => {
      const resolved = typeof next === 'function' ? next(value) : next;
      const params = new URLSearchParams(searchParams.toString());
      if (resolved === defaultValue || resolved === '') {
        params.delete(key);
      } else {
        params.set(key, resolved);
      }
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(url, { scroll: false });
    },
    [router, pathname, searchParams, key, defaultValue, value],
  );

  return [value, setValue];
}
