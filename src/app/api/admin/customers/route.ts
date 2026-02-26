import { NextResponse } from 'next/server';
import { getAllCustomers } from '@/lib/db';

export async function GET() {
  try {
    const customers = await getAllCustomers();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Admin customers error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
