import { NextResponse } from 'next/server';

// Cron job to refresh Instagram long-lived access token.
// Long-lived tokens expire after 60 days.
// This runs weekly to keep the token fresh.
// POST /api/cron/refresh-instagram

export async function POST(request: Request) {
  // Verify cron secret (Vercel sends Authorization header for cron jobs)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ message: 'No Instagram token to refresh' });
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Instagram token refresh failed:', err);
      return NextResponse.json({ error: 'Token refresh failed', details: err }, { status: 500 });
    }

    const data = await res.json();
    // Note: The refreshed token is the same token with an extended expiry.
    // On Vercel, you'd need to manually update the env var or use the Vercel API.
    // This endpoint logs success so you know the token is still valid.
    console.log('Instagram token refreshed successfully, expires in', data.expires_in, 'seconds');

    return NextResponse.json({
      message: 'Token refreshed',
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Instagram refresh error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
