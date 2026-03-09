import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/admin-auth';

/* ── Locale helpers ─────────────────────────────────── */
type Locale = 'nl' | 'en' | 'es';
const SUPPORTED_LOCALES: Locale[] = ['nl', 'en', 'es'];
const DEFAULT_LOCALE: Locale = 'nl';

/** Map Vercel geo country codes to locales */
const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  NL: 'nl', BE: 'nl', SR: 'nl',  // Dutch-speaking
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', // Spanish-speaking
  GB: 'en', US: 'en', AU: 'en', CA: 'en', IE: 'en', NZ: 'en', // English-speaking
};

function detectLocale(request: NextRequest): Locale {
  // 1. Existing cookie preference
  const cookieLocale = request.cookies.get('locale')?.value as Locale | undefined;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) return cookieLocale;

  // 2. Vercel geo header (available on Vercel deployments)
  const country = request.headers.get('x-vercel-ip-country');
  if (country && COUNTRY_LOCALE_MAP[country]) return COUNTRY_LOCALE_MAP[country];

  // 3. Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  const preferred = acceptLang.split(',').map(l => l.split(';')[0].trim().slice(0, 2));
  for (const lang of preferred) {
    if (SUPPORTED_LOCALES.includes(lang as Locale)) return lang as Locale;
  }

  return DEFAULT_LOCALE;
}

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

  /* ── Locale detection & cookie ─────────────────────── */
  const locale = detectLocale(request);
  const response = NextResponse.next();

  // Set locale cookie if not already set (or if detected differs)
  const existingLocale = request.cookies.get('locale')?.value;
  if (existingLocale !== locale) {
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
    });
  }

  // Pass locale to server components via header
  response.headers.set('x-locale', locale);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
