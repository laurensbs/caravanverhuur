import { NextRequest, NextResponse } from 'next/server';
import { type AdminRole } from '@/i18n/admin-translations';

/** Constant-time string comparison (edge-compatible replacement for crypto.timingSafeEqual) */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Get session info set by middleware via headers */
export function getSessionFromHeaders(request: NextRequest): { user: string; role: AdminRole } {
  return {
    user: request.headers.get('x-admin-user') || 'admin',
    role: (request.headers.get('x-admin-role') as AdminRole) || 'admin',
  };
}

/* ── Credentials (from environment) ──────────────── */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

if (!process.env.ADMIN_PASSWORD || !process.env.STAFF_PASSWORD || !process.env.ADMIN_SECRET) {
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn('[admin-auth] Missing env vars: ADMIN_PASSWORD / STAFF_PASSWORD / ADMIN_SECRET');
  }
}

const CREDENTIALS: Record<string, { password: string; role: AdminRole }> = {
  admin: { password: ADMIN_PASSWORD || '', role: 'admin' },
  staff: { password: STAFF_PASSWORD || '', role: 'staff' },
};

/* ── Token helpers (HMAC-signed JSON) ────────────── */
async function hmacSign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw', encoder.encode(ADMIN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(payload);
  return timingSafeEqual(expected, signature);
}

export async function createAdminToken(user: string, role: AdminRole): Promise<string> {
  const payload = JSON.stringify({ user, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = await hmacSign(encoded);
  return `${encoded}.${sig}`;
}

export async function verifyAdminToken(token: string): Promise<{ user: string; role: AdminRole } | null> {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const valid = await hmacVerify(encoded, sig);
    if (!valid) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return { user: payload.user, role: payload.role };
  } catch {
    return null;
  }
}

/* ── Login validation ────────────────────────────── */
export function validateCredentials(user: string, password: string): { role: AdminRole } | null {
  const cred = CREDENTIALS[user];
  if (!cred) return null;
  if (!timingSafeEqual(cred.password, password)) return null;
  return { role: cred.role };
}

/* ── Request auth check for API routes ───────────── */
export async function verifyAdminRequest(request: NextRequest): Promise<{ user: string; role: AdminRole } | null> {
  // Check cookie first
  const cookie = request.cookies.get('admin_session')?.value;
  if (cookie) {
    const result = await verifyAdminToken(cookie);
    if (result) return result;
  }

  // Check Authorization header as fallback
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const result = await verifyAdminToken(auth.slice(7));
    if (result) return result;
  }

  return null;
}

/* ── Unauthorized response ───────────────────────── */
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
}
