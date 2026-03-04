import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBySessionToken, getBookingsByEmail, getPaymentsByBookingIds, getBorgChecklistsByEmail, updateCustomerProfile, deleteCustomer, deleteCustomerSession, createDeleteConfirmation, getNewsletterSubscriptionStatus, setNewsletterSubscription } from '@/lib/db';
import { sendDeleteConfirmationEmail } from '@/lib/email';

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
    const newsletterUnsubscribed = await getNewsletterSubscriptionStatus(customer.email);

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        created_at: customer.created_at,
        newsletter_unsubscribed: newsletterUnsubscribed,
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
    const { name, phone, newsletterUnsubscribed } = body;

    // Handle newsletter subscription change
    if (newsletterUnsubscribed !== undefined) {
      await setNewsletterSubscription(customer.email, newsletterUnsubscribed);
      return NextResponse.json({ success: true });
    }

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

    const body = await request.json().catch(() => ({}));

    // If confirmed=true, actually delete (after email confirmation)
    if (body.confirmed) {
      await deleteCustomerSession(token);
      await deleteCustomer(customer.id);
      const response = NextResponse.json({ success: true, deleted: true });
      response.cookies.delete('customer_session');
      return response;
    }

    // Otherwise, send confirmation email
    const confirmation = await createDeleteConfirmation(customer.id);
    await sendDeleteConfirmationEmail({
      to: customer.email,
      name: customer.name,
      token: confirmation.token,
    });

    return NextResponse.json({ success: true, confirmationSent: true });
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
