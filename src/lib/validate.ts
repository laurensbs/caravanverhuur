// Tiny request-body validation helper. Wraps Zod so endpoints get a
// consistent 400-response shape without each route re-implementing it.
//
// Usage:
//   const parsed = await parseJson(request, schema);
//   if (!parsed.ok) return parsed.response;
//   const body = parsed.data;

import { NextResponse } from 'next/server';
import { z, ZodError, type ZodSchema } from 'zod';

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseJson<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Validation failed',
          issues: formatIssues(result.error),
        },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: result.data };
}

function formatIssues(err: ZodError): Array<{ path: string; message: string }> {
  return err.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
  }));
}

// Common reusable primitives. Kept narrow on purpose — endpoints can
// extend with route-specific schemas.
export const Email = z.string().trim().toLowerCase().email().max(254);
// Loose phone: digits, spaces, +, -, (). Real validation happens client-side
// or via a downstream service. Server only blocks obvious garbage.
export const Phone = z.string().trim().min(6).max(32).regex(/^[+0-9 ()\-./]+$/);
export const NonEmpty = (max = 500) => z.string().trim().min(1).max(max);
