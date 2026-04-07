import { NextResponse } from 'next/server';
import { getActivePricingRules, migratePricingRules } from '@/lib/db';

export async function GET() {
  try {
    await migratePricingRules().catch(() => {});
    const rules = await getActivePricingRules();
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('GET /api/pricing error:', error);
    return NextResponse.json({ rules: [] });
  }
}
