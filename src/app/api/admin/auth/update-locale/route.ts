import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { updateAdminUserLocale } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminRequest(request);
    if (!session || session.user === 'staff') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { locale } = await request.json();
    if (!locale || !['nl', 'en'].includes(locale)) {
      return NextResponse.json({ error: 'Ongeldige taal' }, { status: 400 });
    }

    await updateAdminUserLocale(session.user, locale);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update locale error:', error);
    return NextResponse.json({ error: 'Fout bij taal wijzigen' }, { status: 500 });
  }
}
