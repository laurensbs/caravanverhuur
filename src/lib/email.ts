// ===== EMAIL SERVICE =====
// Uses Resend API via fetch (no npm package required)
// Set RESEND_API_KEY and EMAIL_FROM in .env.local

const RESEND_API_URL = 'https://api.resend.com/emails';
const SITE_URL = 'https://caravanverhuurspanje.com';
const BRAND_NAME = 'Caravanverhuur Spanje';
const LOGO_URL = 'https://u.cubeupload.com/laurensbos/Caravanverhuur1.png';
export { GOOGLE_REVIEW_URL } from './constants';
import { GOOGLE_REVIEW_URL } from './constants';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${BRAND_NAME} <info@caravanverhuurspanje.com>`;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — email not sent:', options.subject);
    return { success: false, error: 'No API key configured' };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend API error:', res.status, body);
      return { success: false, error: body };
    }

    return { success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: String(err) };
  }
}

// ===== SHARED TEMPLATE WRAPPER =====

function emailWrapper(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND_NAME}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body, table, td { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    img { border: 0; max-width: 100%; }
  </style>
</head>
<body style="margin:0;padding:0;background:#EFF6FF;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#EFF6FF;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#EFF6FF;">
    <tr><td style="padding:32px 16px 48px;" align="center">

      <!-- Header with logo -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding:0 0 28px;">
          <a href="${SITE_URL}" style="text-decoration:none;">
            <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="200" style="width:200px;height:auto;display:block;" />
          </a>
        </td></tr>
      </table>

      <!-- Main card -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Top accent bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg, #0EA5E9, #14B8A6);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:48px 44px 44px;">
          ${content}
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;margin-top:32px;">
        <tr><td align="center" style="padding:0 20px;">
          <!-- Footer logo -->
          <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;margin-bottom:16px;">
            <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="120" style="width:120px;height:auto;display:block;opacity:0.5;" />
          </a>
          <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;line-height:1.5;">
            ${BRAND_NAME} &middot; Caravans aan de Costa Brava
          </p>
          <p style="margin:0 0 16px;color:#CBD5E1;font-size:12px;line-height:1.5;">
            <a href="${SITE_URL}" style="color:#0EA5E9;text-decoration:none;font-weight:500;">caravanverhuurspanje.com</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="${SITE_URL}/contact" style="color:#94A3B8;text-decoration:none;">Contact</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="${SITE_URL}/privacy" style="color:#94A3B8;text-decoration:none;">Privacy</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="${SITE_URL}/voorwaarden" style="color:#94A3B8;text-decoration:none;">Voorwaarden</a>
          </p>
          <p style="margin:0;color:#CBD5E1;font-size:11px;">
            &copy; ${new Date().getFullYear()} ${BRAND_NAME}. Alle rechten voorbehouden.
          </p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

// ===== HELPERS =====

function heading(text: string): string {
  return `<h2 style="margin:0 0 8px;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;line-height:1.3;">${text}</h2>`;
}

function subtext(text: string): string {
  return `<p style="margin:0 0 32px;color:#64748B;font-size:15px;line-height:1.65;">${text}</p>`;
}

function button(label: string, href: string, color: string = '#0284C7'): string {
  return `<div style="text-align:center;margin:36px 0 12px;">
    <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.2px;box-shadow:0 2px 8px ${color}40;">${label}</a>
  </div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0;">`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="color:#94A3B8;font-size:14px;padding:12px 0;border-bottom:1px solid #F1F5F9;vertical-align:top;">${label}</td>
    <td style="color:#0F172A;font-weight:600;font-size:14px;text-align:right;padding:12px 0;border-bottom:1px solid #F1F5F9;vertical-align:top;">${value}</td>
  </tr>`;
}

function highlight(content: string, accent = false): string {
  const bg = accent ? '#F0F9FF' : '#F8FAFC';
  const border = accent ? '#BAE6FD' : '#E2E8F0';
  return `<div style="background:${bg};border:1px solid ${border};border-radius:14px;padding:22px 26px;margin:0 0 28px;">${content}</div>`;
}

function badge(emoji: string, label: string): string {
  return `<div style="text-align:center;margin-bottom:12px;">
    <span style="display:inline-block;background:#F0F9FF;color:#0284C7;font-size:12px;font-weight:700;padding:6px 16px;border-radius:24px;letter-spacing:0.3px;border:1px solid #BAE6FD;">${emoji} ${label}</span>
  </div>`;
}

// ===== EMAIL TEMPLATES =====

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `Welkom bij ${BRAND_NAME}, ${firstName}! ☀️`,
    html: emailWrapper(`
      ${badge('👋', 'WELKOM')}
      ${heading(`Hallo ${firstName}!`)}
      ${subtext('Wat leuk dat je een account hebt aangemaakt! Je bent nu helemaal klaar om jouw droomvakantie aan de Costa Brava te boeken.')}

      <!-- Feature cards -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;">
        <tr>
          <td style="padding:8px 4px 8px 0;width:33%;" valign="top">
            <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:14px;padding:20px 16px;text-align:center;height:100%;">
              <div style="font-size:28px;margin-bottom:8px;">🏕️</div>
              <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600;line-height:1.4;">Caravans bekijken &amp; boeken</p>
            </div>
          </td>
          <td style="padding:8px 2px;width:33%;" valign="top">
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:20px 16px;text-align:center;height:100%;">
              <div style="font-size:28px;margin-bottom:8px;">📋</div>
              <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600;line-height:1.4;">Boekingen &amp; betalingen</p>
            </div>
          </td>
          <td style="padding:8px 0 8px 4px;width:33%;" valign="top">
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px;padding:20px 16px;text-align:center;height:100%;">
              <div style="font-size:28px;margin-bottom:8px;">✅</div>
              <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600;line-height:1.4;">Borg-checklist tekenen</p>
            </div>
          </td>
        </tr>
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
          <strong>🌴 Wist je dat?</strong> Al onze caravans staan op toplocaties aan de Spaanse Costa Brava, met directe toegang tot stranden, restaurants en lokale markten.
        </p>
      `, true)}

      ${button('Bekijk onze caravans →', `${SITE_URL}/caravans`)}
    `, `Welkom bij ${BRAND_NAME} — je account is klaar!`),
  });
}

export async function sendBookingConfirmationEmail(to: string, data: {
  guestName: string;
  reference: string;
  caravanName: string;
  campingName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalPrice: number;
  paymentDeadline: string;
  immediatePayment: boolean;
  spotNumber?: string;
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatPrice = (n: number) => `€\u00A0${n.toFixed(2).replace('.', ',')}`;
  const firstName = data.guestName.split(' ')[0];
  const deadlineLabel = data.immediatePayment
    ? 'Direct bij boeking'
    : new Date(data.paymentDeadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

  return sendEmail({
    to,
    subject: `Boeking ${data.reference} bevestigd ✅`,
    html: emailWrapper(`
      ${badge('📝', 'NIEUWE BOEKING')}
      ${heading('Boeking ontvangen')}
      ${subtext(`Bedankt ${firstName}! We hebben je boeking ontvangen en gaan deze zo snel mogelijk bevestigen.`)}

      <!-- Reference card -->
      <div style="background:linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);border:1px solid #BAE6FD;border-radius:16px;padding:24px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Referentienummer</p>
        <p style="margin:0 0 8px;color:#0284C7;font-weight:800;font-size:22px;letter-spacing:0.5px;">${data.reference}</p>
        <span style="display:inline-block;background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">⏳ Wacht op bevestiging</span>
      </div>

      <!-- Booking details -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow('Caravan', data.caravanName)}
        ${infoRow('Camping', data.campingName)}
        ${data.spotNumber ? infoRow('Plek', data.spotNumber) : ''}
        ${infoRow('Inchecken', formatDate(data.checkIn))}
        ${infoRow('Uitchecken', formatDate(data.checkOut))}
        ${infoRow('Nachten', String(data.nights))}
        ${infoRow('Gasten', `${data.adults} volw.${data.children > 0 ? ` + ${data.children} kind.` : ''}`)}
      </table>

      ${divider()}

      <!-- Pricing -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr>
          <td style="color:#0F172A;font-size:16px;font-weight:700;padding:8px 0;">Totaalprijs</td>
          <td style="color:#0F172A;font-weight:800;font-size:22px;text-align:right;padding:8px 0;">${formatPrice(data.totalPrice)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="color:#64748B;font-size:13px;padding:4px 0;">📅 Betalen vóór</td>
                  <td style="color:#0284C7;font-weight:700;font-size:14px;text-align:right;padding:4px 0;">${deadlineLabel}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
          ${data.immediatePayment
            ? `<strong>Let op:</strong> je vakantie begint binnen 30 dagen. Betaal ${formatPrice(data.totalPrice)} nu via iDEAL/Wero in je account om de boeking definitief te maken.`
            : `<strong>Volgende stap:</strong> betaal ${formatPrice(data.totalPrice)} vóór ${deadlineLabel} via iDEAL/Wero in je account. Je ontvangt automatisch een herinnering.`
          }
        </p>
      `, true)}

      ${button('Ga naar mijn account →', `${SITE_URL}/mijn-account`)}
    `, `Boeking ${data.reference} — ${data.caravanName}, ${data.campingName}`),
  });
}

export async function sendManualBookingEmail(to: string, data: {
  guestName: string;
  reference: string;
  caravanName: string;
  campingName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalPrice: number;
  paymentDeadline: string;
  immediatePayment: boolean;
  spotNumber?: string;
  paymentUrl: string;
  isNewAccount: boolean;
  password?: string;
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatPrice = (n: number) => `€\u00A0${n.toFixed(2).replace('.', ',')}`;
  const firstName = data.guestName.split(' ')[0];

  const accountSection = data.isNewAccount && data.password ? `
    ${divider()}
    ${highlight(`
      <p style="margin:0 0 8px;color:#0F172A;font-size:14px;line-height:1.65;">
        <strong>🔐 Jouw account</strong><br/>
        Er is automatisch een account voor je aangemaakt zodat je je boeking kunt beheren, betalingen kunt doen en je borg kunt inzien.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 0;">
        <tr>
          <td style="color:#64748B;font-size:13px;padding:4px 0;">E-mail</td>
          <td style="color:#0F172A;font-weight:600;font-size:14px;text-align:right;padding:4px 0;">${to}</td>
        </tr>
        <tr>
          <td style="color:#64748B;font-size:13px;padding:4px 0;">Wachtwoord</td>
          <td style="color:#0F172A;font-weight:600;font-size:14px;text-align:right;padding:4px 0;font-family:monospace;letter-spacing:1px;">${data.password}</td>
        </tr>
      </table>
      <p style="margin:8px 0 0;color:#64748B;font-size:12px;">Je kunt je wachtwoord wijzigen na het inloggen.</p>
    `, true)}
    ${button('Inloggen op je account →', `${SITE_URL}/mijn-account`)}
  ` : '';

  return sendEmail({
    to,
    subject: `Boeking ${data.reference} — betaallink & gegevens`,
    html: emailWrapper(`
      ${badge('📞', 'TELEFONISCHE BOEKING')}
      ${heading('Je boeking is aangemaakt')}
      ${subtext(`Hoi ${firstName}! Naar aanleiding van ons telefoongesprek hebben wij een boeking voor je aangemaakt. Hieronder vind je alle gegevens en de betaallink.`)}

      <!-- Reference card -->
      <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);border:1px solid #86EFAC;border-radius:16px;padding:24px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Referentienummer</p>
        <p style="margin:0 0 8px;color:#16A34A;font-weight:800;font-size:22px;letter-spacing:0.5px;">${data.reference}</p>
        <span style="display:inline-block;background:#DBEAFE;color:#1E40AF;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">✅ Bevestigd</span>
      </div>

      <!-- Booking details -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow('Caravan', data.caravanName)}
        ${infoRow('Camping', data.campingName)}
        ${data.spotNumber ? infoRow('Plek', data.spotNumber) : ''}
        ${infoRow('Inchecken', formatDate(data.checkIn))}
        ${infoRow('Uitchecken', formatDate(data.checkOut))}
        ${infoRow('Nachten', String(data.nights))}
        ${infoRow('Gasten', `${data.adults} volw.${data.children > 0 ? ` + ${data.children} kind.` : ''}`)}
      </table>

      ${divider()}

      <!-- Pricing & Payment -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr>
          <td style="color:#0F172A;font-size:16px;font-weight:700;padding:8px 0;">Totaalprijs</td>
          <td style="color:#0F172A;font-weight:800;font-size:22px;text-align:right;padding:8px 0;">${formatPrice(data.totalPrice)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="color:#64748B;font-size:13px;padding:4px 0;">📅 Betalen vóór</td>
                  <td style="color:#0284C7;font-weight:700;font-size:14px;text-align:right;padding:4px 0;">${data.paymentDeadline}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
          <strong>Betaal direct via de knop hieronder.</strong> Je wordt doorgestuurd naar een beveiligde iDEAL/Wero betaalpagina. Na betaling is je boeking definitief.
        </p>
      `, true)}

      ${button(`Betaal ${formatPrice(data.totalPrice)} via iDEAL →`, data.paymentUrl)}

      <p style="margin:0 0 20px;color:#94A3B8;font-size:12px;text-align:center;">Of betaal later via je persoonlijke dashboard</p>

      ${accountSection}
    `, `Boeking ${data.reference} — ${data.caravanName}, ${data.campingName}`),
  });
}

export async function sendPaymentConfirmationEmail(to: string, data: {
  guestName: string;
  reference: string;
  type: string;
  amount: number;
  paidAt: string;
}) {
  const formatPrice = (n: number) => `€\u00A0${n.toFixed(2).replace('.', ',')}`;
  const typeLabel = data.type === 'HUUR' ? 'Huurbedrag' : data.type === 'AANBETALING' ? 'Aanbetaling' : data.type === 'RESTBETALING' ? 'Restbetaling' : data.type === 'BORG' ? 'Borg' : data.type;
  const firstName = data.guestName.split(' ')[0];
  const dateStr = new Date(data.paidAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

  return sendEmail({
    to,
    subject: `Betaling ontvangen — ${data.reference}`,
    html: emailWrapper(`
      ${badge('✅', 'BETALING ONTVANGEN')}
      ${heading('Betaling geslaagd!')}
      ${subtext(`Bedankt ${firstName}, je betaling is in goede orde ontvangen en verwerkt.`)}

      <!-- Amount display -->
      <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);border:1px solid #BBF7D0;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${typeLabel}</p>
        <p style="margin:0 0 8px;color:#16A34A;font-weight:800;font-size:36px;letter-spacing:-0.5px;">${formatPrice(data.amount)}</p>
        <p style="margin:0;color:#22C55E;font-size:13px;font-weight:500;">✓ Betaald op ${dateStr}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow('Referentie', data.reference)}
        ${infoRow('Type', typeLabel)}
        ${infoRow('Bedrag', formatPrice(data.amount))}
      </table>

      ${button('Bekijk mijn account →', `${SITE_URL}/mijn-account`)}
    `, `Betaling van ${formatPrice(data.amount)} ontvangen voor ${data.reference}`),
  });
}

export async function sendContactAcknowledgmentEmail(to: string, name: string, subject: string) {
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `We hebben je bericht ontvangen`,
    html: emailWrapper(`
      ${badge('💬', 'BERICHT ONTVANGEN')}
      ${heading('Bedankt voor je bericht!')}
      ${subtext(`Hallo ${firstName}, we hebben je bericht over "<em>${subject}</em>" ontvangen en nemen zo snel mogelijk contact met je op.`)}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">⏱️</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                <strong>Reactietijd:</strong> We reageren meestal binnen 24 uur. Bij dringende vragen kun je ons ook bereiken via WhatsApp of telefoon.
              </p>
            </td>
          </tr>
        </table>
      `)}

      ${button('Bekijk onze contactgegevens →', `${SITE_URL}/contact`)}
    `, `We hebben je bericht ontvangen — ${subject}`),
  });
}

export async function sendContactReplyEmail(to: string, name: string, subject: string, reply: string) {
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `Reactie op je bericht: ${subject}`,
    html: emailWrapper(`
      ${badge('💬', 'REACTIE OP JE BERICHT')}
      ${heading(`Hallo ${firstName}!`)}
      ${subtext(`We hebben gereageerd op je bericht over "<em>${subject}</em>".`)}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align:top;">
              <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ons antwoord:</p>
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.7;white-space:pre-wrap;">${reply}</p>
            </td>
          </tr>
        </table>
      `, true)}

      ${subtext('Heb je nog verdere vragen? Reageer gerust op deze e-mail of neem contact met ons op via onze website.')}

      ${button('Neem contact op →', `${SITE_URL}/contact`)}
    `, `Reactie op je bericht — ${subject}`),
  });
}

export async function sendBorgChecklistEmail(data: {
  to: string;
  guestName: string;
  reference: string;
  type: 'INCHECKEN' | 'UITCHECKEN';
  token: string;
  caravanName?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const firstName = data.guestName.split(' ')[0];
  const typeLabel = data.type === 'INCHECKEN' ? 'check-in' : 'check-out';
  const checklistUrl = `${SITE_URL}/borg/${data.token}`;
  const dashboardUrl = `${SITE_URL}/mijn-account?tab=borg`;

  return sendEmail({
    to: data.to,
    subject: `Borgchecklist klaar — ${data.reference}`,
    html: emailWrapper(`
      ${badge('🔍', 'INSPECTIE')}
      ${heading('Inspectie afgerond')}
      ${subtext(`Hallo ${firstName}, de ${typeLabel}-inspectie voor je boeking is afgerond. Bekijk de resultaten en geef je akkoord.`)}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow('Boeking', data.reference)}
        ${data.caravanName ? infoRow('Caravan', data.caravanName) : ''}
        ${infoRow('Type', data.type === 'INCHECKEN' ? '📥 Incheck-inspectie' : '📤 Uitcheck-inspectie')}
        ${data.checkIn ? infoRow('Check-in', data.checkIn) : ''}
        ${data.checkOut ? infoRow('Check-out', data.checkOut) : ''}
      </table>

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">📝</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                Bekijk de checklist en geef je akkoord of dien eventueel bezwaar in. Dit kan via onderstaande link of via je account.
              </p>
            </td>
          </tr>
        </table>
      `)}

      ${button('Bekijk checklist & reageer →', checklistUrl)}

      <div style="text-align:center;margin-top:16px;">
        <a href="${dashboardUrl}" style="color:#0EA5E9;font-size:13px;text-decoration:none;font-weight:500;">Of bekijk via je account →</a>
      </div>
    `, `Borgchecklist klaar voor boeking ${data.reference} — bekijk en reageer`),
  });
}

// ===== DELETE CONFIRMATION EMAIL =====

export async function sendDeleteConfirmationEmail(data: {
  to: string;
  name: string;
  token: string;
}) {
  const firstName = data.name.split(' ')[0];
  const confirmUrl = `${SITE_URL}/api/auth/delete-confirm?token=${data.token}`;

  return sendEmail({
    to: data.to,
    subject: `Bevestig verwijdering van je account`,
    html: emailWrapper(`
      ${badge('⚠️', 'ACCOUNT VERWIJDEREN')}
      ${heading('Account verwijderen')}
      ${subtext(`Hallo ${firstName}, we hebben een verzoek ontvangen om je account te verwijderen.`)}

      <!-- Warning box -->
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:14px;padding:22px 26px;margin:0 0 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:22px;">🚨</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#991B1B;font-size:14px;line-height:1.65;font-weight:500;">
                <strong>Dit is onomkeerbaar.</strong> Alle gegevens, boekingen en betalingshistorie worden permanent verwijderd.
              </p>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 8px;color:#0F172A;font-size:15px;line-height:1.7;">
        Klik op de onderstaande knop om de verwijdering te bevestigen. Deze link is <strong>24 uur</strong> geldig.
      </p>

      ${button('Ja, verwijder mijn account →', confirmUrl, '#DC2626')}

      <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;text-align:center;">
        Heb je dit verzoek niet gedaan? Negeer deze e-mail — er wordt niets verwijderd.
      </p>
    `, `Bevestig de verwijdering van je account bij ${BRAND_NAME}`),
  });
}

// ===== NEWSLETTER EMAIL =====

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  activiteit: { label: 'Activiteit', emoji: '🎉' },
  feestdag: { label: 'Feestdag', emoji: '🎊' },
  markt: { label: 'Markt', emoji: '🛍️' },
  evenement: { label: 'Evenement', emoji: '🎭' },
  algemeen: { label: 'Nieuws', emoji: '📣' },
};

export async function sendNewsletterEmail(data: {
  to: string;
  title: string;
  content: string;
  category: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  photos?: string[];
  unsubscribeUrl?: string;
}) {
  const cat = CATEGORY_LABELS[data.category] || CATEGORY_LABELS.algemeen;
  const lines = data.content.split('\n').filter(l => l.trim());
  const contentHtml = lines.map(l =>
    `<p style="margin:0 0 14px;color:#0F172A;font-size:15px;line-height:1.7;">${l}</p>`
  ).join('');

  const hasDetails = data.eventDate || data.eventLocation;

  // Photos section
  const photosHtml = data.photos && data.photos.length > 0
    ? `<div style="margin:0 0 28px;">
        ${data.photos.map(url =>
          `<div style="margin:0 0 14px;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <img src="${url}" alt="" style="width:100%;height:auto;display:block;" />
          </div>`
        ).join('')}
      </div>`
    : '';

  // Unsubscribe footer
  const unsubscribeHtml = data.unsubscribeUrl
    ? `<div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #E2E8F0;">
        <p style="margin:0;color:#94A3B8;font-size:11px;">
          <a href="${data.unsubscribeUrl}" style="color:#94A3B8;text-decoration:underline;">Uitschrijven voor nieuwsbrieven</a>
        </p>
      </div>`
    : '';

  return sendEmail({
    to: data.to,
    subject: `${cat.emoji} ${data.title}`,
    html: emailWrapper(`
      ${badge(cat.emoji, cat.label.toUpperCase())}

      ${heading(data.title)}

      ${hasDetails ? `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;margin:0 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${data.eventDate ? `<tr>
              <td style="color:#64748B;font-size:13px;padding:4px 0;font-weight:500;">📅 Datum</td>
              <td style="color:#0F172A;font-weight:600;font-size:13px;text-align:right;padding:4px 0;">${data.eventDate}</td>
            </tr>` : ''}
            ${data.eventLocation ? `<tr>
              <td style="color:#64748B;font-size:13px;padding:4px 0;font-weight:500;">📍 Locatie</td>
              <td style="color:#0F172A;font-weight:600;font-size:13px;text-align:right;padding:4px 0;">${data.eventLocation}</td>
            </tr>` : ''}
          </table>
        </div>
      ` : ''}

      ${photosHtml}

      ${contentHtml}

      ${divider()}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">🌴</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                Wil je de Costa Brava zelf ervaren? Bekijk onze beschikbare caravans en boek jouw perfecte vakantie.
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      ${button('Bekijk caravans →', `${SITE_URL}/caravans`)}

      ${unsubscribeHtml}
    `, `${cat.emoji} ${data.title} — ${BRAND_NAME}`),
  });
}

// ===== COUNTDOWN EMAIL =====

export async function sendCountdownEmail(data: {
  to: string;
  guestName: string;
  reference: string;
  caravanName: string;
  campingName: string;
  checkIn: string;
  checkOut: string;
  daysUntil: number;
}) {
  const firstName = data.guestName.split(' ')[0];
  const formatDateNl = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const weeks = Math.floor(data.daysUntil / 7);
  const remainingDays = data.daysUntil % 7;

  let countdownText: string;
  let emoji: string;
  let subjectLine: string;

  if (data.daysUntil === 30) {
    emoji = '📅';
    subjectLine = `Nog 30 dagen — je vakantie komt eraan!`;
    countdownText = `Over precies 30 dagen begint je vakantie aan de Costa Brava! Tijd om alvast te gaan pakken en je reisgids te bekijken.`;
  } else if (data.daysUntil === 14) {
    emoji = '🌊';
    subjectLine = `Nog 2 weken tot de Costa Brava!`;
    countdownText = `De vakantie is bijna in zicht! Nog slechts twee weken en je geniet van de zon, zee en de prachtige Costa Brava.`;
  } else if (data.daysUntil === 7) {
    emoji = '☀️';
    subjectLine = `Volgende week begint je vakantie!`;
    countdownText = `Nog maar één week! Heb je alles ingepakt? Vergeet je reisdocumenten niet en neem genoeg zonnebrand mee.`;
  } else if (data.daysUntil === 3) {
    emoji = '🎉';
    subjectLine = `Over 3 dagen ben je op vakantie!`;
    countdownText = `Het is bijna zover! Nog drie nachtjes slapen en je bent op je vakantiebestemming. We hebben alles klaarstaan!`;
  } else if (data.daysUntil === 1) {
    emoji = '✈️';
    subjectLine = `Morgen begint je vakantie!`;
    countdownText = `Morgen is het zover! We hopen dat je een fantastische reis hebt. De caravan is schoon en klaar voor je komst.`;
  } else {
    emoji = '🏖️';
    subjectLine = `Nog ${data.daysUntil} dagen tot je vakantie!`;
    countdownText = `Je vakantie aan de Costa Brava komt steeds dichterbij. Nog ${data.daysUntil} dagen!`;
  }

  return sendEmail({
    to: data.to,
    subject: `${emoji} ${subjectLine}`,
    html: emailWrapper(`
      ${badge(emoji, 'COUNTDOWN')}
      ${heading(subjectLine)}
      ${subtext(`Hallo ${firstName}, je vakantie komt in zicht!`)}

      <!-- Countdown blocks -->
      <div style="text-align:center;margin:0 0 32px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td style="padding:0 8px;">
              <div style="background:linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);border:1px solid #BAE6FD;border-radius:14px;padding:20px 26px;text-align:center;min-width:80px;">
                <div style="font-size:36px;font-weight:800;color:#0284C7;line-height:1;">${weeks}</div>
                <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1.5px;margin-top:8px;font-weight:600;">weken</div>
              </div>
            </td>
            <td style="padding:0 8px;">
              <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);border:1px solid #BBF7D0;border-radius:14px;padding:20px 26px;text-align:center;min-width:80px;">
                <div style="font-size:36px;font-weight:800;color:#16A34A;line-height:1;">${remainingDays}</div>
                <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1.5px;margin-top:8px;font-weight:600;">dagen</div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 28px;color:#0F172A;font-size:15px;line-height:1.7;">${countdownText}</p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow('Boeking', data.reference)}
        ${infoRow('Caravan', data.caravanName)}
        ${infoRow('Camping', data.campingName)}
        ${infoRow('Check-in', formatDateNl(data.checkIn))}
        ${infoRow('Check-out', formatDateNl(data.checkOut))}
      </table>

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">💡</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                <strong>Tip:</strong> Bewaar onze contactgegevens voor je reis. Bij vragen kun je ons bereiken via info@caravanverhuurspanje.com of WhatsApp.
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      ${button('Bekijk mijn boeking →', `${SITE_URL}/mijn-account?tab=boekingen`)}
    `, `${emoji} ${subjectLine} — ${data.caravanName}, ${data.campingName}`),
  });
}

// ===== PASSWORD RESET EMAIL =====

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `🔑 Wachtwoord herstellen — ${BRAND_NAME}`,
    html: emailWrapper(`
      ${badge('🔑', 'WACHTWOORD HERSTELLEN')}
      ${heading(`Hallo ${firstName}`)}
      ${subtext('We hebben een verzoek ontvangen om je wachtwoord te herstellen. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.')}

      ${button('Nieuw wachtwoord instellen →', resetUrl)}

      ${divider()}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">⚠️</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                Deze link is <strong>1 uur geldig</strong>. Heb je dit verzoek niet gedaan? Dan kun je deze email veilig negeren.
              </p>
            </td>
          </tr>
        </table>
      `)}
    `, 'Herstel je wachtwoord'),
  });
}

// ===== EMAIL VERIFICATION =====

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `✉️ Bevestig je e-mailadres — ${BRAND_NAME}`,
    html: emailWrapper(`
      ${badge('✉️', 'E-MAIL VERIFICATIE')}
      ${heading(`Bevestig je e-mailadres`)}
      ${subtext(`Hallo ${firstName}, klik op de knop hieronder om je e-mailadres te bevestigen. Zo weten we zeker dat we je op het juiste adres kunnen bereiken.`)}

      ${button('E-mailadres bevestigen →', verifyUrl)}

      ${divider()}

      <p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">
        Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.
      </p>
    `, 'Bevestig je e-mailadres'),
  });
}

// ===== PAYMENT REMINDER EMAIL =====

export async function sendPaymentReminderEmail(data: {
  to: string;
  guestName: string;
  reference: string;
  caravanName: string;
  campingName: string;
  checkIn: string;
  amount: number;
  daysUntil: number;
}) {
  const formatPrice = (n: number) => `€\u00A0${n.toFixed(2).replace('.', ',')}`;
  const firstName = data.guestName.split(' ')[0];
  const formatDateNl = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const urgency = data.daysUntil <= 7 ? 'urgent' : 'normal';
  const accentColor = urgency === 'urgent' ? '#DC2626' : '#F59E0B';
  const bgColor = urgency === 'urgent' ? '#FEF2F2' : '#FFFBEB';
  const borderColor = urgency === 'urgent' ? '#FECACA' : '#FDE68A';

  return sendEmail({
    to: data.to,
    subject: urgency === 'urgent'
      ? `⚠️ Betaling vereist — nog ${data.daysUntil} dagen tot aankomst (${data.reference})`
      : `Herinnering: betaling voor je vakantie (${data.reference})`,
    html: emailWrapper(`
      ${badge(urgency === 'urgent' ? '⚠️' : '💶', 'BETALINGSHERINNERING')}
      ${heading(urgency === 'urgent' ? 'Actie vereist!' : 'Betaling openstaand')}
      ${subtext(`Beste ${firstName}, de betaling voor je boeking is nog niet ontvangen. Je aankomst is over <strong>${data.daysUntil} dagen</strong>.`)}

      <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Nog te betalen</p>
        <p style="margin:0 0 8px;color:${accentColor};font-weight:800;font-size:36px;letter-spacing:-0.5px;">${formatPrice(data.amount)}</p>
        <p style="margin:0;color:#64748B;font-size:13px;">Betaling voor boeking ${data.reference}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow('Referentie', data.reference)}
        ${infoRow('Caravan', data.caravanName)}
        ${infoRow('Camping', data.campingName)}
        ${infoRow('Aankomst', formatDateNl(data.checkIn))}
        ${infoRow('Openstaand', formatPrice(data.amount))}
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
          <strong>💡 Betaal eenvoudig via iDEAL/Wero</strong> vanuit je account. De betaling wordt direct verwerkt.
          ${urgency === 'urgent' ? '<br/><br/>⚠️ <strong>Let op:</strong> zonder betaling kan je verblijf niet doorgaan.' : ''}
        </p>
      `, true)}

      ${button('Nu betalen →', `${SITE_URL}/mijn-account`)}
    `, `Betaling van ${formatPrice(data.amount)} voor ${data.reference} — nog ${data.daysUntil} dagen`),
  });
}

// ===== CANCELLATION CONFIRMATION EMAIL =====

export async function sendCancellationEmail(data: {
  to: string;
  guestName: string;
  reference: string;
  caravanName: string;
  campingName: string;
  checkIn: string;
  checkOut: string;
  refundPercentage: number;
  refundMessage: string;
}) {
  const firstName = data.guestName.split(' ')[0];
  const formatDateNl = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return sendEmail({
    to: data.to,
    subject: `❌ Boeking geannuleerd — ${data.reference}`,
    html: emailWrapper(`
      ${badge('❌', 'ANNULERING BEVESTIGD')}
      ${heading('Boeking geannuleerd')}
      ${subtext(`Hallo ${firstName}, je boeking is succesvol geannuleerd. Hieronder vind je de details.`)}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow('Referentie', data.reference)}
        ${infoRow('Caravan', data.caravanName)}
        ${infoRow('Camping', data.campingName)}
        ${infoRow('Check-in', formatDateNl(data.checkIn))}
        ${infoRow('Check-out', formatDateNl(data.checkOut))}
      </table>

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">💰</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;color:#0F172A;font-size:14px;font-weight:700;">
                Restitutie: ${data.refundPercentage}%
              </p>
              <p style="margin:0;color:#64748B;font-size:14px;line-height:1.65;">
                ${data.refundMessage}
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      <p style="margin:0 0 20px;color:#64748B;font-size:14px;line-height:1.65;">
        Eventuele restituties worden binnen 7 werkdagen verwerkt. Heb je vragen? Neem gerust contact op.
      </p>

      ${button('Contact opnemen →', `${SITE_URL}/contact`)}
    `, `Boeking ${data.reference} is geannuleerd`),
  });
}

// ===== POST-STAY REVIEW REQUEST EMAIL =====

export async function sendReviewRequestEmail(data: {
  to: string;
  guestName: string;
  reference: string;
  caravanName: string;
  campingName: string;
  checkIn: string;
  checkOut: string;
}) {
  const firstName = data.guestName.split(' ')[0];
  const formatDateNl = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return sendEmail({
    to: data.to,
    subject: `⭐ ${firstName}, hoe was je vakantie? Laat een review achter!`,
    html: emailWrapper(`
      ${badge('⭐', 'REVIEW')}
      ${heading(`Hoe was je vakantie, ${firstName}?`)}
      ${subtext('We hopen dat je een fantastische tijd hebt gehad aan de Costa Brava! Je mening helpt andere vakantiegangers bij hun keuze — en het kost maar 1 minuut.')}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">🏕️</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;color:#0F172A;font-size:14px;font-weight:700;">
                ${data.caravanName} — ${data.campingName}
              </p>
              <p style="margin:0;color:#64748B;font-size:13px;">
                ${formatDateNl(data.checkIn)} t/m ${formatDateNl(data.checkOut)}
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      <div style="text-align:center;margin:0 0 20px;">
        <div style="font-size:32px;letter-spacing:4px;margin-bottom:8px;">⭐⭐⭐⭐⭐</div>
        <p style="margin:0;color:#64748B;font-size:14px;">Hoe beoordeel jij je ervaring?</p>
      </div>

      ${button('Laat een Google Review achter ⭐', GOOGLE_REVIEW_URL, '#EA4335')}

      <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;text-align:center;line-height:1.6;">
        Door een review achter te laten help je ons én andere vakantiegangers. Hartelijk dank! 🙏
      </p>

      ${divider()}

      <p style="margin:0 0 8px;color:#64748B;font-size:13px;line-height:1.6;">
        <strong>Was er iets niet goed?</strong> Laat het ons weten zodat we het kunnen verbeteren. Je kunt ons altijd bereiken via het contactformulier.
      </p>

      ${button('Feedback geven →', `${SITE_URL}/contact`, '#64748B')}
    `, `Hoe was je vakantie? Deel je ervaring met een Google review ⭐`),
  });
}
