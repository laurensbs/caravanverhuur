import { NextResponse } from 'next/server';
import {
  getDueScheduledNewsletters,
  markNewsletterSent,
  getSubscribedCustomerEmails,
} from '@/lib/db';
import { sendNewsletterEmail } from '@/lib/email';
import { generateUnsubscribeToken } from '@/app/api/newsletter/unsubscribe/route';

// Cron job: runs every 15 minutes to send scheduled newsletters that are due
// POST /api/cron/send-newsletters

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dueNewsletters = await getDueScheduledNewsletters();

    if (dueNewsletters.length === 0) {
      return NextResponse.json({ message: 'No scheduled newsletters due', sent: 0 });
    }

    const results: { id: string; title: string; sentCount: number; totalEmails: number; errors: string[] }[] = [];

    for (const newsletter of dueNewsletters) {
      const emails = await getSubscribedCustomerEmails();

      if (emails.length === 0) {
        // No subscribers — mark as sent with 0
        await markNewsletterSent(newsletter.id, 0);
        results.push({ id: newsletter.id, title: newsletter.title, sentCount: 0, totalEmails: 0, errors: [] });
        continue;
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
      const photos: string[] = newsletter.photos
        ? (typeof newsletter.photos === 'string' ? JSON.parse(newsletter.photos) : newsletter.photos)
        : [];

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

      await markNewsletterSent(newsletter.id, sentCount);
      results.push({ id: newsletter.id, title: newsletter.title, sentCount, totalEmails: emails.length, errors });
    }

    return NextResponse.json({
      message: `Processed ${results.length} scheduled newsletter(s)`,
      results,
    });
  } catch (error) {
    console.error('Error in send-newsletters cron:', error);
    return NextResponse.json({ error: 'Fout bij verzenden geplande nieuwsbrieven' }, { status: 500 });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: Request) {
  return POST(request);
}
