import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  const isAdminSubdomain = hostname.startsWith('admin.');

  /* ── Admin subdomain ──────────────────────────────────── */
  if (isAdminSubdomain) {
    // Let API routes and Next.js internals pass through unchanged
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
      return NextResponse.next();
    }

    // /admin/… on the subdomain → strip prefix and redirect to clean URL
    if (pathname.startsWith('/admin')) {
      const clean = pathname.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(new URL(clean, request.url));
    }

    // Rewrite clean URLs to the /admin/* file-system routes
    // e.g.  /             → /admin
    //       /boekingen    → /admin/boekingen
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
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
