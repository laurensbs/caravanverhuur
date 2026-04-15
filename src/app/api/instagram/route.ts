import { NextResponse } from 'next/server';

// Instagram Graph API — fetches recent posts from the connected Instagram account.
// Requires INSTAGRAM_ACCESS_TOKEN env var (long-lived user token from Facebook/Instagram Graph API).
// Token auto-refreshes via /api/cron/refresh-instagram cron job.
//
// GET /api/instagram?limit=6

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cachedPosts: InstagramPost[] | null = null;
let cacheTime = 0;

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '6', 10), 12);

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ posts: [], source: 'none', error: 'No Instagram token configured' });
  }

  // Return cache if fresh
  if (cachedPosts && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json({ posts: cachedPosts.slice(0, limit), source: 'cache' });
  }

  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${token}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Instagram API error:', err);
      return NextResponse.json({ posts: cachedPosts || [], source: 'stale-cache', error: 'API error' });
    }

    const data = await res.json();
    const posts: InstagramPost[] = (data.data || []).filter(
      (p: InstagramPost) => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM'
    );

    // Update cache
    cachedPosts = posts;
    cacheTime = Date.now();

    return NextResponse.json({ posts: posts.slice(0, limit), source: 'api' });
  } catch (error) {
    console.error('Instagram fetch error:', error);
    return NextResponse.json({ posts: cachedPosts || [], source: 'stale-cache', error: 'Fetch failed' });
  }
}
