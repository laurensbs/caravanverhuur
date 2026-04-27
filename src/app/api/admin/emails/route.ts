import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/db';

// Returns the Resend email history for a given booking.
// Looks up by guest_email and filters on subject containing the booking reference.
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookingId = request.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ emails: [], note: 'RESEND_API_KEY not configured' });

  try {
    const booking = await getBookingById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const email = booking.guest_email;
    const ref = booking.reference;

    // Resend list endpoint — paginate up to 100 most recent (default page size)
    const res = await fetch('https://api.resend.com/emails?limit=100', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `Resend API ${res.status}: ${txt}` }, { status: 502 });
    }
    const data = await res.json() as { data?: Array<{ id: string; to: string[]; from: string; subject: string; created_at: string; last_event: string; }> };

    // Show all mails to this guest's email — broader than just-this-booking, so the admin can
    // see whether *any* mail (incl. payment link) has gone out. We still surface the booking ref
    // when present so it's obvious which mails belong to this booking.
    const list = (data.data || []).filter(e =>
      Array.isArray(e.to) && e.to.some(t => t.toLowerCase() === email.toLowerCase()),
    );
    const matchesRef = (subject: string) => typeof subject === 'string' && subject.includes(ref);

    return NextResponse.json({ emails: list.map(e => ({
      id: e.id,
      to: e.to,
      from: e.from,
      subject: e.subject,
      createdAt: e.created_at,
      status: e.last_event,
      forThisBooking: matchesRef(e.subject),
    })) });
  } catch (err) {
    console.error('GET /api/admin/emails error:', err);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
