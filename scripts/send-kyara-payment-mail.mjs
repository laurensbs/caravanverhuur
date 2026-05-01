// One-off: send Kyara (BK-2026-001) a "fill in your address + pay" mail.
// Usage: node --env-file=.env.local scripts/send-kyara-payment-mail.mjs
// After Kyara is reached, this script may be deleted.

import { sql } from '@vercel/postgres';
import crypto from 'crypto';

const REF = 'BK-2026-001';
const PROD_BASE = 'https://caravanverhuurspanje.com';
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Caravanverhuur Spanje <info@caravanverhuurspanje.com>';
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!RESEND_KEY) { console.error('RESEND_API_KEY missing'); process.exit(1); }
if (!ADMIN_SECRET) { console.error('ADMIN_SECRET missing — needed to sign payment token'); process.exit(1); }

function signToken(ref) {
  return crypto.createHmac('sha256', ADMIN_SECRET).update(`pay:${ref}`).digest('hex').slice(0, 32);
}

const b = (await sql`SELECT * FROM bookings WHERE reference = ${REF} LIMIT 1`).rows[0];
if (!b) { console.error('Booking not found'); process.exit(1); }
const p = (await sql`SELECT * FROM payments WHERE booking_id = ${b.id} AND type = 'AANBETALING' LIMIT 1`).rows[0];
if (!p) { console.error('Payment not found'); process.exit(1); }
if (p.status === 'BETAALD') { console.log('Already paid; not sending.'); process.exit(0); }

const token = signToken(REF);
const url = `${PROD_BASE}/betalen/${REF}?token=${token}`;
const deposit = parseFloat(p.amount).toFixed(2);
const firstName = b.guest_name.split(' ')[0];

const subject = `Vul je gegevens aan en voltooi de aanbetaling — ${REF}`;
const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;margin:0;padding:0;background:#FAFAF9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="height:5px;background:linear-gradient(90deg,#0F172A 0%,#334155 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <p style="display:inline-block;background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;margin:0 0 16px;letter-spacing:0.5px;">AANBETALING — ACTIE NODIG</p>
          <h1 style="font-family:'Plus Jakarta Sans',Inter,sans-serif;font-size:24px;color:#0F172A;margin:0 0 12px;font-weight:800;">Hoi ${firstName}!</h1>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Bedankt voor je boeking <strong>${REF}</strong> bij Caravanverhuur Spanje! Om de aanbetaling van 25% te voltooien, hebben we nog <strong>je adresgegevens</strong> nodig voor de officiële factuur.
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Klik op onderstaande knop, vul je adres in en betaal direct veilig met iDEAL, Bancontact of creditcard via Stripe.
          </p>

          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:20px 24px;margin:0 0 24px;">
            <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Aanbetaling (25%)</p>
            <p style="margin:0;color:#0F172A;font-weight:800;font-size:28px;">€${deposit}</p>
            <p style="margin:8px 0 0;color:#64748B;font-size:12px;">Restbedrag + borg betaal je op de camping.</p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${url}" style="display:inline-block;background:#0F172A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Adres aanvullen & betalen →
            </a>
          </td></tr></table>

          <p style="color:#94A3B8;font-size:12px;line-height:1.5;margin:24px 0 0;text-align:center;">
            Werkt de knop niet? Kopieer deze link in je browser:<br>
            <a href="${url}" style="color:#475569;word-break:break-all;">${url}</a>
          </p>
          <p style="color:#94A3B8;font-size:12px;line-height:1.5;margin:16px 0 0;text-align:center;">
            Vragen? Mail naar info@caravanverhuurspanje.com.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
  body: JSON.stringify({ from: FROM, to: [b.guest_email], subject, html }),
});
const data = await r.json();
console.log('Resend response:', r.status, JSON.stringify(data));
if (!r.ok) process.exit(1);
console.log('---');
console.log('SENT to', b.guest_email);
console.log('URL:', url);
process.exit(0);
