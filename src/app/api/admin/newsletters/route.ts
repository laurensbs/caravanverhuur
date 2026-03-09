import { NextRequest, NextResponse } from 'next/server';
import {
  getAllNewsletters,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  getNewsletterById,
  markNewsletterSent,
  getSubscribedCustomerEmails,
  setupDatabase,
  logActivity,
} from '@/lib/db';
import { sendNewsletterEmail } from '@/lib/email';
import { generateUnsubscribeToken } from '@/app/api/newsletter/unsubscribe/route';
import { getSessionFromHeaders } from '@/lib/admin-auth';

// GET - List all newsletters
export async function GET() {
  try {
    const newsletters = await getAllNewsletters();
    return NextResponse.json({ newsletters });
  } catch (error: unknown) {
    // Auto-setup if table doesn't exist
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('does not exist') || msg.includes('relation')) {
      try {
        await setupDatabase();
        const newsletters = await getAllNewsletters();
        return NextResponse.json({ newsletters });
      } catch (retryError) {
        console.error('Error after setup retry:', retryError);
      }
    }
    console.error('Error fetching newsletters:', error);
    return NextResponse.json({ error: 'Fout bij ophalen nieuwsbrieven' }, { status: 500 });
  }
}

// POST - Create or send newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Send existing newsletter
    if (action === 'send') {
      const { id, excludeEmails } = body;
      if (!id) {
        return NextResponse.json({ error: 'Nieuwsbrief ID ontbreekt' }, { status: 400 });
      }

      const newsletter = await getNewsletterById(id);
      if (!newsletter) {
        return NextResponse.json({ error: 'Nieuwsbrief niet gevonden' }, { status: 404 });
      }

      if (newsletter.status === 'verzonden') {
        return NextResponse.json({ error: 'Nieuwsbrief is al verzonden' }, { status: 400 });
      }

      // Get subscribed customer emails (excludes unsubscribed)
      let emails = await getSubscribedCustomerEmails();
      
      // Apply manual exclusion list
      if (excludeEmails && Array.isArray(excludeEmails) && excludeEmails.length > 0) {
        const excludeSet = new Set(excludeEmails.map((e: string) => e.toLowerCase()));
        emails = emails.filter(e => !excludeSet.has(e.toLowerCase()));
      }

      if (emails.length === 0) {
        return NextResponse.json({ error: 'Geen e-mailadressen gevonden' }, { status: 400 });
      }

      // Format event date for display
      let eventDateFormatted: string | null = null;
      if (newsletter.event_date) {
        const d = new Date(newsletter.event_date);
        eventDateFormatted = d.toLocaleDateString('nl-NL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      // Parse photos
      const photos: string[] = newsletter.photos ? (typeof newsletter.photos === 'string' ? JSON.parse(newsletter.photos) : newsletter.photos) : [];

      // Send to all customers
      let sentCount = 0;
      const errors: string[] = [];

      for (const email of emails) {
        try {
          const token = generateUnsubscribeToken(email);
          const unsubscribeUrl = `https://caravanverhuurspanje.com/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
          
          const result = await sendNewsletterEmail({
            to: email,
            title: newsletter.title,
            content: newsletter.content,
            category: newsletter.category,
            eventDate: eventDateFormatted,
            eventLocation: newsletter.event_location,
            photos,
            unsubscribeUrl,
          });
          if (result.success) {
            sentCount++;
          } else {
            errors.push(`${email}: ${result.error}`);
          }
        } catch (err) {
          errors.push(`${email}: ${String(err)}`);
        }
      }

      // Mark as sent
      await markNewsletterSent(id, sentCount);

      logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'newsletter_sent', entityType: 'newsletter', entityId: id, entityLabel: newsletter.title, details: `${sentCount} ontvangers` }).catch(() => {});

      return NextResponse.json({
        success: true,
        sentCount,
        totalEmails: emails.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Create new newsletter
    const { title, content, category, eventDate, eventLocation, photos, scheduledAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Titel en inhoud zijn verplicht' }, { status: 400 });
    }

    let result;
    try {
      result = await createNewsletter({
        title: title.trim(),
        content: content.trim(),
        category: category || 'algemeen',
        eventDate: eventDate || undefined,
        eventLocation: eventLocation?.trim() || undefined,
        photos: photos && Array.isArray(photos) ? photos.filter((p: string) => p.trim()) : undefined,
        scheduledAt: scheduledAt || undefined,
      });
    } catch (createError: unknown) {
      // Auto-setup if table doesn't exist
      const msg = createError instanceof Error ? createError.message : String(createError);
      if (msg.includes('does not exist') || msg.includes('relation')) {
        await setupDatabase();
        result = await createNewsletter({
          title: title.trim(),
          content: content.trim(),
          category: category || 'algemeen',
          eventDate: eventDate || undefined,
          eventLocation: eventLocation?.trim() || undefined,
          photos: photos && Array.isArray(photos) ? photos.filter((p: string) => p.trim()) : undefined,
          scheduledAt: scheduledAt || undefined,
        });
      } else {
        throw createError;
      }
    }

    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'newsletter_created', entityType: 'newsletter', entityId: result.id, entityLabel: title }).catch(() => {});

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error creating/sending newsletter:', error);
    return NextResponse.json({ error: 'Fout bij verwerken nieuwsbrief' }, { status: 500 });
  }
}

// PUT - Update newsletter
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, category, eventDate, eventLocation, photos, scheduledAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'Nieuwsbrief ID ontbreekt' }, { status: 400 });
    }

    const newsletter = await getNewsletterById(id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Nieuwsbrief niet gevonden' }, { status: 404 });
    }

    if (newsletter.status === 'verzonden') {
      return NextResponse.json({ error: 'Verzonden nieuwsbrieven kunnen niet worden bewerkt' }, { status: 400 });
    }

    const result = await updateNewsletter(id, {
      title: title?.trim(),
      content: content?.trim(),
      category,
      eventDate: eventDate !== undefined ? eventDate : undefined,
      eventLocation: eventLocation !== undefined ? eventLocation?.trim() || null : undefined,
      photos: photos !== undefined ? (Array.isArray(photos) ? photos.filter((p: string) => p.trim()) : undefined) : undefined,
      scheduledAt: scheduledAt !== undefined ? scheduledAt : undefined,
    });

    if (!result) {
      return NextResponse.json({ error: 'Nieuwsbrief niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating newsletter:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken nieuwsbrief' }, { status: 500 });
  }
}

// DELETE - Delete newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Nieuwsbrief ID ontbreekt' }, { status: 400 });
    }

    await deleteNewsletter(id);
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'newsletter_deleted', entityType: 'newsletter', entityId: id, entityLabel: `Nieuwsbrief #${id}` }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen nieuwsbrief' }, { status: 500 });
  }
}
