import { NextRequest, NextResponse } from 'next/server';
import { createContact, getAllContacts, updateContactStatus, replyToContact, getContactById } from '@/lib/db';
import { sendContactAcknowledgmentEmail, sendContactReplyEmail } from '@/lib/email';

export async function GET() {
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
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createContact({ name, email, phone, subject, message });

    // Send acknowledgment email (non-blocking)
    sendContactAcknowledgmentEmail(email, name, subject).catch(err =>
      console.error('Contact acknowledgment email failed:', err)
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
        sendContactReplyEmail(contact.email, contact.name, contact.subject, reply).catch(err =>
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
