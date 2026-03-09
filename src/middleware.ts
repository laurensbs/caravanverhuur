import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const isAdminSubdomain = hostname.startsWith('admin.');

  /* ── Protect /api/admin/* (except auth routes) ────────── */
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const cookie = request.cookies.get('admin_session')?.value;
    const authHeader = request.headers.get('authorization');
    const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (!token) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const session = await verifyAdminToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });
    }

    return NextResponse.next();
  }

  /* ── Admin subdomain ──────────────────────────────────── */
  if (isAdminSubdomain) {
    // Serve noindex robots.txt for admin subdomain
    if (pathname === '/robots.txt') {
      return new NextResponse(
        'User-agent: *\nDisallow: /\n',
        { status: 200, headers: { 'Content-Type': 'text/plain' } },
      );
    }

    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
      return NextResponse.next();
    }

    if (pathname.startsWith('/admin')) {
      const clean = pathname.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(new URL(clean, request.url));
    }

    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    // Add X-Robots-Tag header to prevent indexing
    const response = NextResponse.rewrite(url);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  /* ── Main domain: redirect /admin/* to admin subdomain ─ */
  if (
    pathname.startsWith('/admin') &&
    !hostname.includes('localhost') &&
    !hostname.includes('127.0.0.1')
  ) {
    const baseDomain = hostname.replace(/:\d+$/, '');
    const adminPath = pathname.replace(/^\/admin/, '') || '/';
    return NextResponse.redirect(
      new URL(`https://admin.${baseDomain}${adminPath}`),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
