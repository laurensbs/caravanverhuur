import { NextRequest, NextResponse } from 'next/server';
import { deleteCustomerSession } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('customer_session')?.value;
    if (token) {
      await deleteCustomerSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('customer_session');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
