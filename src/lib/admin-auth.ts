import { NextRequest, NextResponse } from 'next/server';
import { type AdminRole } from '@/i18n/admin-translations';

/* ── Credentials (hardcoded) ─────────────────────── */
const ADMIN_PASSWORD = 'CostaAdmin2026!';
const STAFF_PASSWORD = 'CostaStaff2026!';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'cvs-admin-secret-2026-hmac-key';

const CREDENTIALS: Record<string, { password: string; role: AdminRole }> = {
  admin: { password: ADMIN_PASSWORD, role: 'admin' },
  staff: { password: STAFF_PASSWORD, role: 'staff' },
};

/* ── Token helpers (HMAC-signed JSON) ────────────── */
async function hmacSign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(ADMIN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(payload);
  return expected === signature;
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
  if (cred.password !== password) return null;
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
