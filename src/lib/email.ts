// ===== EMAIL SERVICE =====
// Uses Resend API via fetch (no npm package required)
// Set RESEND_API_KEY and EMAIL_FROM in .env.local

const RESEND_API_URL = 'https://api.resend.com/emails';
const SITE_URL = 'https://caravanverhuurspanje.com';
const BRAND_NAME = 'Caravans Spanje';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${BRAND_NAME} <noreply@caravanverhuurspanje.com>`;

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
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${BRAND_NAME}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f3ef;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f3ef;">
    <tr><td style="padding:40px 16px;" align="center">

      <!-- Logo -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr><td align="center" style="padding:0 0 8px;">
          <span style="font-size:28px;">☀️</span>
        </td></tr>
        <tr><td align="center">
          <a href="${SITE_URL}" style="color:#3D3522;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${BRAND_NAME}</a>
        </td></tr>
      </table>

      <!-- Card -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e6e0;">
        <tr><td style="padding:44px 40px 40px;">
          ${content}
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
        <tr><td align="center" style="padding:0 40px;">
          <p style="margin:0 0 8px;color:#9a9588;font-size:12px;line-height:1.5;">
            ${BRAND_NAME} &middot; Costa Brava, Spanje
          </p>
          <p style="margin:0;color:#9a9588;font-size:12px;">
            <a href="${SITE_URL}" style="color:#58B09C;text-decoration:none;">caravanverhuurspanje.com</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE_URL}/privacy" style="color:#9a9588;text-decoration:none;">Privacy</a>
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
  return `<h2 style="margin:0 0 6px;color:#3D3522;font-size:24px;font-weight:700;letter-spacing:-0.3px;">${text}</h2>`;
}

function subtext(text: string): string {
  return `<p style="margin:0 0 28px;color:#7B7768;font-size:15px;line-height:1.5;">${text}</p>`;
}

function button(label: string, href: string): string {
  return `<div style="text-align:center;margin:36px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#386150;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:0.2px;">${label}</a>
  </div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #eeece6;margin:28px 0;">`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="color:#9a9588;font-size:14px;padding:10px 0;border-bottom:1px solid #f4f3ef;">${label}</td>
    <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;padding:10px 0;border-bottom:1px solid #f4f3ef;">${value}</td>
  </tr>`;
}

function highlight(content: string, accent = false): string {
  const bg = accent ? '#f0faf6' : '#f9f8f5';
  const border = accent ? '#d1f0e3' : '#eeece6';
  return `<div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:20px 24px;margin:0 0 24px;">${content}</div>`;
}

// ===== EMAIL TEMPLATES =====

export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `Welkom bij ${BRAND_NAME}, ${firstName}! ☀️`,
    html: emailWrapper(`
      ${heading(`Hallo ${firstName}!`)}
      ${subtext('Leuk dat je een account hebt aangemaakt. Je bent nu klaar om jouw ideale caravan te boeken aan de Costa Brava.')}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#58B09C;font-size:16px;vertical-align:middle;">✓</span>
              <span style="color:#3D3522;font-size:14px;margin-left:10px;vertical-align:middle;">Caravans bekijken &amp; boeken</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#58B09C;font-size:16px;vertical-align:middle;">✓</span>
              <span style="color:#3D3522;font-size:14px;margin-left:10px;vertical-align:middle;">Boekingen &amp; betalingen inzien</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#58B09C;font-size:16px;vertical-align:middle;">✓</span>
              <span style="color:#3D3522;font-size:14px;margin-left:10px;vertical-align:middle;">Borg-checklist digitaal ondertekenen</span>
            </td>
          </tr>
        </table>
      `, true)}

      ${button('Bekijk de caravans →', `${SITE_URL}/caravans`)}
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
  depositAmount: number;
  remainingAmount: number;
  spotNumber?: string;
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatPrice = (n: number) => `€\u00A0${n.toFixed(2).replace('.', ',')}`;
  const firstName = data.guestName.split(' ')[0];

  return sendEmail({
    to,
    subject: `Boeking ${data.reference} bevestigd ✅`,
    html: emailWrapper(`
      ${heading('Boeking ontvangen')}
      ${subtext(`Bedankt ${firstName}! We hebben je boeking ontvangen en gaan deze zo snel mogelijk bevestigen.`)}

      ${highlight(`
        <p style="margin:0 0 2px;color:#386150;font-weight:700;font-size:18px;letter-spacing:-0.2px;">${data.reference}</p>
        <p style="margin:0;color:#58B09C;font-size:13px;">Wacht op bevestiging</p>
      `, true)}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
        ${infoRow('Caravan', data.caravanName)}
        ${infoRow('Camping', data.campingName)}
        ${data.spotNumber ? infoRow('Plek', data.spotNumber) : ''}
        ${infoRow('Inchecken', formatDate(data.checkIn))}
        ${infoRow('Uitchecken', formatDate(data.checkOut))}
        ${infoRow('Nachten', String(data.nights))}
        ${infoRow('Gasten', `${data.adults} volw.${data.children > 0 ? ` + ${data.children} kind.` : ''}`)}
      </table>

      ${divider()}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
        <tr>
          <td style="color:#3D3522;font-size:15px;padding:6px 0;">Totaalprijs</td>
          <td style="color:#3D3522;font-weight:700;font-size:18px;text-align:right;padding:6px 0;">${formatPrice(data.totalPrice)}</td>
        </tr>
        <tr>
          <td style="color:#9a9588;font-size:14px;padding:4px 0;">Aanbetaling (30%)</td>
          <td style="color:#386150;font-weight:600;font-size:14px;text-align:right;padding:4px 0;">${formatPrice(data.depositAmount)}</td>
        </tr>
        <tr>
          <td style="color:#9a9588;font-size:14px;padding:4px 0;">Restbetaling</td>
          <td style="color:#9a9588;font-size:14px;text-align:right;padding:4px 0;">${formatPrice(data.remainingAmount)}</td>
        </tr>
      </table>

      ${highlight(`
        <p style="margin:0;color:#3D3522;font-size:14px;line-height:1.6;">
          <strong>Volgende stap:</strong> betaal de aanbetaling van ${formatPrice(data.depositAmount)} via iDEAL in je account.
        </p>
      `, true)}

      ${button('Bekijk boeking →', `${SITE_URL}/mijn-account`)}
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
  const typeLabel = data.type === 'AANBETALING' ? 'Aanbetaling' : data.type === 'RESTBETALING' ? 'Restbetaling' : data.type === 'BORG' ? 'Borg' : data.type;
  const firstName = data.guestName.split(' ')[0];
  const dateStr = new Date(data.paidAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

  return sendEmail({
    to,
    subject: `Betaling ontvangen — ${data.reference}`,
    html: emailWrapper(`
      ${heading('Betaling ontvangen')}
      ${subtext(`Bedankt ${firstName}, we hebben je betaling in goede orde ontvangen.`)}

      ${highlight(`
        <div style="text-align:center;">
          <p style="margin:0 0 4px;color:#9a9588;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">${typeLabel}</p>
          <p style="margin:0 0 6px;color:#386150;font-weight:700;font-size:32px;letter-spacing:-0.5px;">${formatPrice(data.amount)}</p>
          <p style="margin:0;color:#58B09C;font-size:13px;">Betaald op ${dateStr}</p>
        </div>
      `, true)}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
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
      ${heading('Bericht ontvangen')}
      ${subtext(`Bedankt ${firstName}! We hebben je bericht over "<em>${subject}</em>" ontvangen en reageren zo snel mogelijk — meestal binnen 24 uur.`)}

      ${highlight(`
        <p style="margin:0;color:#3D3522;font-size:14px;line-height:1.6;">
          Dringende vraag? Je kunt ons ook altijd bereiken via WhatsApp of telefoon.
        </p>
      `)}

      ${button('Bekijk onze contactgegevens →', `${SITE_URL}/contact`)}
    `, `We hebben je bericht ontvangen — ${subject}`),
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
      ${heading('Inspectie afgerond')}
      ${subtext(`Hallo ${firstName}, de ${typeLabel}-inspectie voor je boeking is afgerond. Bekijk de resultaten en geef je akkoord.`)}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${infoRow('Boeking', data.reference)}
        ${data.caravanName ? infoRow('Caravan', data.caravanName) : ''}
        ${infoRow('Type', data.type === 'INCHECKEN' ? 'Incheck-inspectie' : 'Uitcheck-inspectie')}
        ${data.checkIn ? infoRow('Check-in', data.checkIn) : ''}
        ${data.checkOut ? infoRow('Check-out', data.checkOut) : ''}
      </table>

      ${highlight(`
        <p style="margin:0;color:#3D3522;font-size:14px;line-height:1.6;">
          Bekijk de checklist en geef je akkoord of dien eventueel bezwaar in. Dit kan via onderstaande link of via je account.
        </p>
      `)}

      ${button('Bekijk checklist & reageer →', checklistUrl)}

      <div style="text-align:center;margin-top:12px;">
        <a href="${dashboardUrl}" style="color:#58B09C;font-size:13px;text-decoration:none;">Of bekijk via je account →</a>
      </div>
    `, `Borgchecklist klaar voor boeking ${data.reference} — bekijk en reageer`),
  });
}
