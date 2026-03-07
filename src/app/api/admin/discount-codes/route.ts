import { NextRequest, NextResponse } from 'next/server';
import { getAllDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode, applyBookingDiscount, validateDiscountCode, incrementDiscountCodeUsage } from '@/lib/db';

export async function GET() {
  try {
    const codes = await getAllDiscountCodes();
    return NextResponse.json({ codes });
  } catch (error) {
    console.error('GET /api/admin/discount-codes error:', error);
    return NextResponse.json({ error: 'Failed to fetch discount codes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, type, value, maxUses, minAmount, validFrom, validUntil, action, bookingId, discountCode: dc, discountAmount } = body;

    // Apply discount to booking
    if (action === 'applyToBooking') {
      if (!bookingId || !dc || discountAmount === undefined) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      const result = await applyBookingDiscount(bookingId, dc, discountAmount);
      if (!result) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      return NextResponse.json(result);
    }

    // Create discount code
    if (!code || !type || !value) {
      return NextResponse.json({ error: 'Missing required fields (code, type, value)' }, { status: 400 });
    }

    const result = await createDiscountCode({
      code,
      type,
      value,
      maxUses: maxUses || undefined,
      minAmount: minAmount || undefined,
      validFrom: validFrom || undefined,
      validUntil: validUntil || undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/discount-codes error:', error);
    return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active, maxUses, validUntil } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await updateDiscountCode(id, { active, maxUses, validUntil });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/discount-codes error:', error);
    return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await deleteDiscountCode(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/discount-codes error:', error);
    return NextResponse.json({ error: 'Failed to delete discount code' }, { status: 500 });
  }
}
