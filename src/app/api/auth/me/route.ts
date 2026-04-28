import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBySessionToken, getBookingsByEmail, getPaymentsByBookingIds, getBorgChecklistsByEmail, updateCustomerProfile, deleteCustomer, deleteCustomerSession, createDeleteConfirmation, getNewsletterSubscriptionStatus, setNewsletterSubscription, setupDatabase } from '@/lib/db';
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
        must_change_password: !!customer.must_change_password,
      },
      bookings,
      payments,
      borgChecklists,
    });
  } catch (error: unknown) {
    console.error('Customer me error:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('does not exist') || msg.includes('relation')) {
      try {
        await setupDatabase();
        // Retry after setup
        const token2 = request.cookies.get('customer_session')?.value;
        if (!token2) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
        const customer2 = await getCustomerBySessionToken(token2);
        if (!customer2) return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });
        const bookings2 = await getBookingsByEmail(customer2.email);
        const bookingIds2 = bookings2.map((b) => (b as { id: string }).id);
        const payments2 = await getPaymentsByBookingIds(bookingIds2);
        const borgChecklists2 = await getBorgChecklistsByEmail(customer2.email);
        let newsletterUnsubscribed2 = false;
        try { newsletterUnsubscribed2 = await getNewsletterSubscriptionStatus(customer2.email); } catch { /* ignore */ }
        return NextResponse.json({ customer: { id: customer2.id, email: customer2.email, name: customer2.name, phone: customer2.phone, created_at: customer2.created_at, newsletter_unsubscribed: newsletterUnsubscribed2 }, bookings: bookings2, payments: payments2, borgChecklists: borgChecklists2 });
      } catch (setupErr) {
        console.error('Auto-setup failed:', setupErr);
      }
    }
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
    }, customer.locale);

    return NextResponse.json({ success: true, confirmationSent: true });
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 });
  }
}
