import { NextRequest, NextResponse } from 'next/server';
import { validateDiscountCode, incrementDiscountCodeUsage } from '@/lib/db';

export async function POST(request: NextRequest) {
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
