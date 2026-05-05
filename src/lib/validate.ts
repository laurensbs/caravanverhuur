// Tiny request-body validation helper. Wraps Zod so endpoints get a
// consistent 400-response shape without each route re-implementing it.
//
// Usage:
//   const parsed = await parseJson(request, schema);
//   if (!parsed.ok) return parsed.response;
//   const body = parsed.data;

import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
// Re-export primitives so existing server callers (`@/lib/validate`)
// keep working unchanged.
export { Email, Phone, NonEmpty } from './validate-shared';

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

