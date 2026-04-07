import { NextRequest, NextResponse } from 'next/server';
import { createContact, getAllContacts, updateContactStatus, replyToContact, getContactById, getCustomerByEmail } from '@/lib/db';
import { sendContactAcknowledgmentEmail, sendContactReplyEmail } from '@/lib/email';
import { contactLimiter, getClientIp } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Require admin auth to list contacts
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contacts = await getAllContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('GET /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rl = contactLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Te veel berichten. Probeer het over ${rl.retryAfter} seconden opnieuw.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, message, website, source } = body;

    // Honeypot check — if filled, it's a bot
    if (website) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createContact({ name, email, phone, subject, message, source });

    // Send acknowledgment email (non-blocking)
    const contactCustomer = await getCustomerByEmail(email.toLowerCase().trim()).catch(() => null);
    sendContactAcknowledgmentEmail(email, name, subject, contactCustomer?.locale).catch(err =>
      console.error('Contact acknowledgment email failed:', err)
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Require admin auth for contact updates
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, status, reply } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });
    }

    if (reply) {
      const contact = await getContactById(id);
      await replyToContact(id, reply);

      // Send reply email to the visitor (non-blocking)
      if (contact?.email) {
        const replyCustomer = await getCustomerByEmail(contact.email.toLowerCase().trim()).catch(() => null);
        sendContactReplyEmail(contact.email, contact.name, contact.subject, reply, replyCustomer?.locale).catch(err =>
          console.error('Contact reply email failed:', err)
        );
      }
    } else if (status) {
      await updateContactStatus(id, status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}
