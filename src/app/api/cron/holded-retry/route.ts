import { NextResponse } from 'next/server';
import { drainHoldedOutbox } from '@/lib/holded-outbox';

// POST /api/cron/holded-retry
// Verwerkt mislukte Holded API-calls uit de outbox.
// Gepland: elk uur (zie vercel.json). Elk job dat zijn next_retry_at heeft
// bereikt wordt opnieuw geprobeerd. Bij succes → completed; bij falen →
// next_retry_at wordt verzet met exponential backoff (5min/30min/2u/6u/24u).
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await drainHoldedOutbox(50);
    console.log(`[cron:holded-retry] processed=${summary.processed} ok=${summary.succeeded} fail=${summary.failed}`);
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error('[cron:holded-retry] err:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'failed' }, { status: 500 });
  }
}
