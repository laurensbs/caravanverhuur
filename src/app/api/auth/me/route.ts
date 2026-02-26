import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBySessionToken, getBookingsByEmail, getPaymentsByBookingIds, getBorgChecklistsByEmail, updateCustomerProfile, deleteCustomer, deleteCustomerSession } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('customer_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const customer = await getCustomerBySessionToken(token);
    if (!customer) {
      return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });
    }

    // Get all customer data
    const bookings = await getBookingsByEmail(customer.email);
    const bookingIds = bookings.map((b) => (b as { id: string }).id);
    const payments = await getPaymentsByBookingIds(bookingIds);
    const borgChecklists = await getBorgChecklistsByEmail(customer.email);

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        created_at: customer.created_at,
      },
      bookings,
      payments,
      borgChecklists,
    });
  } catch (error) {
    console.error('Customer me error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('customer_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const customer = await getCustomerBySessionToken(token);
    if (!customer) {
      return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    await updateCustomerProfile(customer.id, { name, phone });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('customer_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const customer = await getCustomerBySessionToken(token);
    if (!customer) {
      return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });
    }

    // Delete session first, then customer (cascades sessions)
    await deleteCustomerSession(token);
    await deleteCustomer(customer.id);

    const response = NextResponse.json({ success: true });
    response.cookies.delete('customer_session');
    return response;
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
