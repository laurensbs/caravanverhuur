import { NextRequest, NextResponse } from 'next/server';
import { getBorgChecklistByToken, customerAgreeBorgChecklist } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const checklist = await getBorgChecklistByToken(token);

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('GET /api/borg/[token] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { agreed, notes } = body;

    const checklist = await getBorgChecklistByToken(token);
    if (!checklist) {
      return NextResponse.json({ error: 'Checklist niet gevonden' }, { status: 404 });
    }

    if (checklist.status !== 'AFGEROND') {
      return NextResponse.json({ error: 'Checklist is nog niet afgerond door staff' }, { status: 400 });
    }

    await customerAgreeBorgChecklist(token, agreed, notes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/borg/[token] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
