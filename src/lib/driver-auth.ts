import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

async function hmacSign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw', encoder.encode(ADMIN_SECRET + '_driver'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(payload);
  return timingSafeEqual(expected, signature);
}

export async function createDriverToken(driverId: string, driverName: string): Promise<string> {
  const payload = JSON.stringify({ id: driverId, name: driverName, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = await hmacSign(encoded);
  return `${encoded}.${sig}`;
}

export async function verifyDriverToken(token: string): Promise<{ id: string; name: string } | null> {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const valid = await hmacVerify(encoded, sig);
    if (!valid) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return { id: payload.id, name: payload.name };
  } catch {
    return null;
  }
}

export async function verifyDriverRequest(request: NextRequest): Promise<{ id: string; name: string } | null> {
  const cookie = request.cookies.get('driver_session')?.value;
  if (cookie) {
    return verifyDriverToken(cookie);
  }
  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
