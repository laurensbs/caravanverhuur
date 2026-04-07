'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/i18n/admin-context';

const DISPLAY_NAMES: Record<string, string> = {
  jake: 'Jake', johan: 'Johan', helen: 'Helen', dominique: 'Dominique', laurens: 'Laurens', staff: 'Staff',
};

function timeAgo(date: string, locale: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === 'nl' ? 'zojuist' : 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// Cache activity data per session to avoid re-fetching
const cache: Record<string, Record<string, { actor: string; action: string; created_at: string }>> = {};

export function useLastActivity(entityType: string, entityIds: string[]) {
  const [data, setData] = useState<Record<string, { actor: string; action: string; created_at: string }>>({});

  useEffect(() => {
    if (!entityIds.length) return;
    const cacheKey = entityType;
    const missing = entityIds.filter(id => !cache[cacheKey]?.[id]);

    // Return cached immediately
    if (cache[cacheKey]) {
      const cached: typeof data = {};
      for (const id of entityIds) {
        if (cache[cacheKey][id]) cached[id] = cache[cacheKey][id];
      }
      if (Object.keys(cached).length > 0) setData(prev => ({ ...prev, ...cached }));
    }

    if (!missing.length) return;

    fetch(`/api/admin/activity/last?type=${entityType}&ids=${missing.join(',')}`)
      .then(r => r.json())
      .then(map => {
        if (!cache[cacheKey]) cache[cacheKey] = {};
        Object.assign(cache[cacheKey], map);
        setData(prev => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, [entityType, entityIds.join(',')]);

  return data;
}

export function LastEditedBadge({ actor, createdAt }: { actor: string; createdAt: string }) {
  const { locale } = useAdmin();
  const name = DISPLAY_NAMES[actor] || actor;
  const ago = timeAgo(createdAt, locale);

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted/60 font-normal">
      <span className="w-3.5 h-3.5 rounded-full bg-foreground/8 flex items-center justify-center text-[8px] font-bold text-foreground/40">
        {name.charAt(0)}
      </span>
      {name} · {ago}
    </span>
  );
}
