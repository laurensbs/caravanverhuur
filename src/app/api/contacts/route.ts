import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContact, getAllContacts, updateContactStatus, replyToContact, getContactById, getCustomerByEmail, deleteContact, assignContactToCustomer, searchCustomersSimple, logActivity } from '@/lib/db';
import { sendContactAcknowledgmentEmail, sendContactReplyEmail } from '@/lib/email';
import { contactLimiter, getClientIp } from '@/lib/rate-limit';
import { Email, Phone } from '@/lib/validate';

const ContactPostSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: Email,
  phone: Phone.optional().or(z.literal('')),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  source: z.string().trim().max(40).optional(),
});

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
    const rl = await contactLimiter.check(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Te veel berichten. Probeer het over ${rl.retryAfter} seconden opnieuw.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    let raw: unknown;
    try { raw = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    // Honeypot check FIRST — bots filling `website` get a fake 201 so they
    // don't learn the field is a trigger. Must precede Zod (which would 400).
    if (raw && typeof raw === 'object' && 'website' in raw && (raw as { website?: unknown }).website) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const parsed = ContactPostSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) },
        { status: 400 },
      );
    }
    const { name, email, phone, subject, message, source } = parsed.data;

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
    const { id, status, reply, customer_id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });
    }

    if (action === 'assign_customer') {
      await assignContactToCustomer(id, customer_id || null);
      await logActivity({ actor: 'admin', role: 'admin', action: customer_id ? 'contact_assigned' : 'contact_unassigned', entityType: 'contact', entityId: id });
      return NextResponse.json({ success: true });
    }

    if (action === 'search_customers') {
      const { query } = body;
      if (!query || query.length < 2) return NextResponse.json({ customers: [] });
      const customers = await searchCustomersSimple(query);
      return NextResponse.json({ customers });
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

export async function DELETE(request: NextRequest) {
  const cookie = request.cookies.get('admin_session')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });

    const contact = await getContactById(id);
    await deleteContact(id);
    await logActivity({ actor: 'admin', role: 'admin', action: 'contact_deleted', entityType: 'contact', entityId: id, entityLabel: contact?.name || id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
