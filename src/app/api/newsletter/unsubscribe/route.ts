import { NextRequest, NextResponse } from 'next/server';
import { setNewsletterSubscription, getNewsletterSubscriptionStatus } from '@/lib/db';
import crypto from 'crypto';

const SECRET = process.env.NEWSLETTER_SECRET;
if (!SECRET) console.warn('[newsletter] NEWSLETTER_SECRET env var not set — unsubscribe verification disabled');

export function generateUnsubscribeToken(email: string): string {
  if (!SECRET) throw new Error('NEWSLETTER_SECRET not configured');
  return crypto.createHmac('sha256', SECRET).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

function verifyToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

// GET - Unsubscribe page (renders simple HTML)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const action = searchParams.get('action'); // 'unsubscribe' or 'resubscribe'

  if (!email || !token) {
    return new NextResponse('Ongeldige link', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (!verifyToken(email, token)) {
    return new NextResponse('Ongeldige of verlopen link', { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  try {
    if (action === 'resubscribe') {
      await setNewsletterSubscription(email, false);
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="nl">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opnieuw ingeschreven</title>
        <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8FAFC;color:#0F172A}
        .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
        h1{font-size:24px;margin:0 0 8px}p{color:#64748B;line-height:1.6;margin:8px 0}
        .icon{font-size:48px;margin-bottom:16px}
        a{color:#0F172A;text-decoration:none;font-weight:600}</style></head>
        <body><div class="card">
          <div class="icon">✅</div>
          <h1>Opnieuw ingeschreven!</h1>
          <p>Je ontvangt weer onze nieuwsbrieven op <strong>${email.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>.</p>
          <p style="margin-top:20px"><a href="https://caravanverhuurspanje.com">Terug naar de website →</a></p>
        </div></body></html>
      `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Default: unsubscribe
    await setNewsletterSubscription(email, true);

    const resubUrl = `/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}&action=resubscribe`;

    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="nl">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Uitgeschreven</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8FAFC;color:#0F172A}
      .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
      h1{font-size:24px;margin:0 0 8px}p{color:#64748B;line-height:1.6;margin:8px 0}
      .icon{font-size:48px;margin-bottom:16px}
      a{color:#0F172A;text-decoration:none;font-weight:600}
      .btn{display:inline-block;background:#0F172A;color:#fff!important;padding:12px 24px;border-radius:10px;margin-top:12px}</style></head>
      <body><div class="card">
        <div class="icon">📭</div>
        <h1>Uitgeschreven</h1>
        <p>Je ontvangt geen nieuwsbrieven meer op <strong>${email.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>.</p>
        <p>Per ongeluk gedaan? <a href="${resubUrl}">Schrijf je opnieuw in →</a></p>
        <p style="margin-top:20px"><a href="https://caravanverhuurspanje.com" class="btn">Terug naar de website</a></p>
      </div></body></html>
    `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new NextResponse('Er ging iets mis', { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}
