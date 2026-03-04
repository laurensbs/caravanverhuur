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
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${BRAND_NAME}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#F5F5F4;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F5F5F4;">
    <tr><td style="padding:40px 16px;" align="center">

      <!-- Logo -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr><td align="center" style="padding:0 0 8px;">
          <span style="font-size:28px;">☀️</span>
        </td></tr>
        <tr><td align="center">
          <a href="${SITE_URL}" style="color:#0F172A;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${BRAND_NAME}</a>
        </td></tr>
      </table>

      <!-- Card -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E7E5E4;">
        <tr><td style="padding:44px 40px 40px;">
          ${content}
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
        <tr><td align="center" style="padding:0 40px;">
          <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;line-height:1.5;">
            ${BRAND_NAME} &middot; Costa Brava, Spanje
          </p>
          <p style="margin:0;color:#94A3B8;font-size:12px;">
            <a href="${SITE_URL}" style="color:#0EA5E9;text-decoration:none;">caravanverhuurspanje.com</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE_URL}/privacy" style="color:#94A3B8;text-decoration:none;">Privacy</a>
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
  return `<h2 style="margin:0 0 6px;color:#0F172A;font-size:24px;font-weight:700;letter-spacing:-0.3px;">${text}</h2>`;
}

function subtext(text: string): string {
  return `<p style="margin:0 0 28px;color:#64748B;font-size:15px;line-height:1.5;">${text}</p>`;
}

function button(label: string, href: string): string {
  return `<div style="text-align:center;margin:36px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#0284C7;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:0.2px;">${label}</a>
  </div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E7E5E4;margin:28px 0;">`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="color:#94A3B8;font-size:14px;padding:10px 0;border-bottom:1px solid #F5F5F4;">${label}</td>
    <td style="color:#0F172A;font-weight:600;font-size:14px;text-align:right;padding:10px 0;border-bottom:1px solid #F5F5F4;">${value}</td>
  </tr>`;
}

function highlight(content: string, accent = false): string {
  const bg = accent ? '#F0F9FF' : '#FAFAF9';
  const border = accent ? '#7DD3FC' : '#E7E5E4';
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
              <span style="color:#0EA5E9;font-size:16px;vertical-align:middle;">✓</span>
              <span style="color:#0F172A;font-size:14px;margin-left:10px;vertical-align:middle;">Caravans bekijken &amp; boeken</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#0EA5E9;font-size:16px;vertical-align:middle;">✓</span>
              <span style="color:#0F172A;font-size:14px;margin-left:10px;vertical-align:middle;">Boekingen &amp; betalingen inzien</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#0EA5E9;font-size:16px;vertical-align:middle;">✓</span>
              <span style="color:#0F172A;font-size:14px;margin-left:10px;vertical-align:middle;">Borg-checklist digitaal ondertekenen</span>
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
        <p style="margin:0 0 2px;color:#0284C7;font-weight:700;font-size:18px;letter-spacing:-0.2px;">${data.reference}</p>
        <p style="margin:0;color:#0EA5E9;font-size:13px;">Wacht op bevestiging</p>
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
          <td style="color:#0F172A;font-size:15px;padding:6px 0;">Totaalprijs</td>
          <td style="color:#0F172A;font-weight:700;font-size:18px;text-align:right;padding:6px 0;">${formatPrice(data.totalPrice)}</td>
        </tr>
        <tr>
          <td style="color:#94A3B8;font-size:14px;padding:4px 0;">Aanbetaling (30%)</td>
          <td style="color:#0284C7;font-weight:600;font-size:14px;text-align:right;padding:4px 0;">${formatPrice(data.depositAmount)}</td>
        </tr>
        <tr>
          <td style="color:#94A3B8;font-size:14px;padding:4px 0;">Restbetaling</td>
          <td style="color:#94A3B8;font-size:14px;text-align:right;padding:4px 0;">${formatPrice(data.remainingAmount)}</td>
        </tr>
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.6;">
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
          <p style="margin:0 0 4px;color:#94A3B8;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">${typeLabel}</p>
          <p style="margin:0 0 6px;color:#0284C7;font-weight:700;font-size:32px;letter-spacing:-0.5px;">${formatPrice(data.amount)}</p>
          <p style="margin:0;color:#0EA5E9;font-size:13px;">Betaald op ${dateStr}</p>
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
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.6;">
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
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.6;">
          Bekijk de checklist en geef je akkoord of dien eventueel bezwaar in. Dit kan via onderstaande link of via je account.
        </p>
      `)}

      ${button('Bekijk checklist & reageer →', checklistUrl)}

      <div style="text-align:center;margin-top:12px;">
        <a href="${dashboardUrl}" style="color:#0EA5E9;font-size:13px;text-decoration:none;">Of bekijk via je account →</a>
      </div>
    `, `Borgchecklist klaar voor boeking ${data.reference} — bekijk en reageer`),
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
}) {
  const cat = CATEGORY_LABELS[data.category] || CATEGORY_LABELS.algemeen;
  const lines = data.content.split('\n').filter(l => l.trim());
  const contentHtml = lines.map(l =>
    `<p style="margin:0 0 14px;color:#0F172A;font-size:15px;line-height:1.7;">${l}</p>`
  ).join('');

  const hasDetails = data.eventDate || data.eventLocation;

  return sendEmail({
    to: data.to,
    subject: `${cat.emoji} ${data.title}`,
    html: emailWrapper(`
      <div style="text-align:center;margin-bottom:8px;">
        <span style="display:inline-block;background:#F0F9FF;color:#0284C7;font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;letter-spacing:0.3px;">${cat.emoji} ${cat.label}</span>
      </div>

      ${heading(data.title)}

      ${hasDetails ? `
        <div style="background:#FAFAF9;border:1px solid #E7E5E4;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${data.eventDate ? `<tr>
              <td style="color:#94A3B8;font-size:13px;padding:4px 0;">📅 Datum</td>
              <td style="color:#0F172A;font-weight:600;font-size:13px;text-align:right;padding:4px 0;">${data.eventDate}</td>
            </tr>` : ''}
            ${data.eventLocation ? `<tr>
              <td style="color:#94A3B8;font-size:13px;padding:4px 0;">📍 Locatie</td>
              <td style="color:#0F172A;font-weight:600;font-size:13px;text-align:right;padding:4px 0;">${data.eventLocation}</td>
            </tr>` : ''}
          </table>
        </div>
      ` : ''}

      ${contentHtml}

      ${divider()}

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.6;">
          Wil je de Costa Brava zelf ervaren? Bekijk onze beschikbare caravans en boek jouw perfecte vakantie.
        </p>
      `, true)}

      ${button('Bekijk caravans →', `${SITE_URL}/caravans`)}
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
      ${heading(`${emoji} ${subjectLine}`)}
      ${subtext(`Hallo ${firstName}, je vakantie komt in zicht!`)}

      <!-- Countdown blocks -->
      <div style="text-align:center;margin:0 0 28px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td style="padding:0 6px;">
              <div style="background:#F0F9FF;border:1px solid #7DD3FC;border-radius:12px;padding:16px 22px;text-align:center;">
                <div style="font-size:32px;font-weight:800;color:#0284C7;line-height:1;">${weeks}</div>
                <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-top:6px;">weken</div>
              </div>
            </td>
            <td style="padding:0 6px;">
              <div style="background:#F0F9FF;border:1px solid #7DD3FC;border-radius:12px;padding:16px 22px;text-align:center;">
                <div style="font-size:32px;font-weight:800;color:#0284C7;line-height:1;">${remainingDays}</div>
                <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-top:6px;">dagen</div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 24px;color:#0F172A;font-size:15px;line-height:1.7;">${countdownText}</p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
        ${infoRow('Boeking', data.reference)}
        ${infoRow('Caravan', data.caravanName)}
        ${infoRow('Camping', data.campingName)}
        ${infoRow('Check-in', formatDateNl(data.checkIn))}
        ${infoRow('Check-out', formatDateNl(data.checkOut))}
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.6;">
          <strong>💡 Tip:</strong> Bewaar onze contactgegevens voor je reis. Bij vragen kun je ons bereiken via info@caravanverhuurspanje.com of WhatsApp.
        </p>
      `, true)}

      ${button('Bekijk mijn boeking →', `${SITE_URL}/mijn-account?tab=boekingen`)}
    `, `${emoji} ${subjectLine} — ${data.caravanName}, ${data.campingName}`),
  });
}
