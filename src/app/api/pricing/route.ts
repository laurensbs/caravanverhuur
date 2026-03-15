import { NextResponse } from 'next/server';
import { getActivePricingRules } from '@/lib/db';

export async function GET() {
  try {
    const rules = await getActivePricingRules();
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('GET /api/pricing error:', error);
    return NextResponse.json({ rules: [] });
  }
}
