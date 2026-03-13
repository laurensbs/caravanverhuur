import { NextRequest, NextResponse } from 'next/server';
import { validateDiscountCode, incrementDiscountCodeUsage } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const discountLimiter = rateLimit({ name: 'discount-validate', maxRequests: 10, windowSeconds: 5 * 60 });

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = discountLimiter.check(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Te veel pogingen. Probeer het later opnieuw.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { code, totalAmount } = body;

    if (!code || !totalAmount) {
      return NextResponse.json({ error: 'Missing code or totalAmount' }, { status: 400 });
    }

    const result = await validateDiscountCode(code, totalAmount);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      discountAmount: result.discountAmount,
      type: result.type,
      value: result.value,
      code: code.toUpperCase(),
    });
  } catch (error) {
    console.error('POST /api/discount/validate error:', error);
    return NextResponse.json({ error: 'Failed to validate discount code' }, { status: 500 });
  }
}
