// ===== EMAIL SERVICE =====
// Uses Resend API via fetch (no npm package required)
// Set RESEND_API_KEY and EMAIL_FROM in .env.local
// Supports multilingual emails: NL (default), EN, ES

const RESEND_API_URL = 'https://api.resend.com/emails';
const SITE_URL = 'https://caravanverhuurspanje.com';
const BRAND_NAME = 'Caravanverhuur Spanje';
const LOGO_URL = 'https://u.cubeupload.com/laurensbos/Caravanverhuur1.png';
import { GOOGLE_REVIEW_URL } from './constants';
import { getEmailTranslations } from './email-translations';

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

function emailWrapper(content: string, preheader?: string, locale?: string): string {
  const t = getEmailTranslations(locale);
  return `<!DOCTYPE html>
<html lang="${t.lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
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
          <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;margin-bottom:16px;">
            <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="120" style="width:120px;height:auto;display:block;opacity:0.5;" />
          </a>
          <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;line-height:1.5;">
            ${BRAND_NAME} &middot; ${t.footerTagline}
          </p>
          <p style="margin:0 0 16px;color:#CBD5E1;font-size:12px;line-height:1.5;">
            <a href="${SITE_URL}" style="color:#0EA5E9;text-decoration:none;font-weight:500;">caravanverhuurspanje.com</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="${SITE_URL}/contact" style="color:#94A3B8;text-decoration:none;">${t.footerContact}</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="${SITE_URL}/privacy" style="color:#94A3B8;text-decoration:none;">${t.footerPrivacy}</a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="${SITE_URL}/voorwaarden" style="color:#94A3B8;text-decoration:none;">${t.footerTerms}</a>
          </p>
          <p style="margin:0;color:#CBD5E1;font-size:11px;">
            &copy; ${new Date().getFullYear()} ${BRAND_NAME}. ${t.footerCopyright}
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

// ===== LOCALE-AWARE DATE/PRICE HELPERS =====

function formatDate(dateStr: string, locale?: string): string {
  const t = getEmailTranslations(locale);
  const d = new Date(dateStr);
  return d.toLocaleDateString(t.dateLocale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateLong(dateStr: string, locale?: string): string {
  const t = getEmailTranslations(locale);
  const d = new Date(dateStr);
  return d.toLocaleDateString(t.dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string, locale?: string): string {
  const t = getEmailTranslations(locale);
  const d = new Date(dateStr);
  return d.toLocaleDateString(t.dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPrice(n: number): string {
  return `\u20AC\u00A0${n.toFixed(2).replace('.', ',')}`;
}

function getPaymentTypeLabel(type: string, locale?: string): string {
  const t = getEmailTranslations(locale);
  switch (type) {
    case 'HUUR': return t.paymentTypeRental;
    case 'AANBETALING': return t.paymentTypeDeposit;
    case 'RESTBETALING': return t.paymentTypeRemaining;
    case 'BORG': return t.paymentTypeBorg;
    default: return type;
  }
}

// ===== EMAIL TEMPLATES =====

export async function sendWelcomeEmail(to: string, name: string, locale?: string, verifyUrl?: string) {
  const t = getEmailTranslations(locale);
  const firstName = name.split(' ')[0];

  const verifySection = verifyUrl ? `
      ${divider()}
      ${badge('\u2709\uFE0F', t.verifyBadge)}
      ${heading(t.verifyHeading)}
      ${subtext(t.verifySubtext(firstName))}
      ${button(t.verifyButton, verifyUrl)}
      <p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">
        ${t.verifyExpiry}
      </p>
  ` : '';

  return sendEmail({
    to,
    subject: t.welcomeSubject(firstName),
    html: emailWrapper(`
      ${badge('\uD83D\uDC4B', t.welcomeBadge)}
      ${heading(t.welcomeHeading(firstName))}
      ${subtext(t.welcomeSubtext)}

      <!-- Feature cards -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 32px;">
        <tr>
          <td style="padding:8px 4px 8px 0;width:33%;" valign="top">
            <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:14px;padding:20px 16px;text-align:center;height:100%;">
              <div style="font-size:28px;margin-bottom:8px;">\uD83C\uDFD5\uFE0F</div>
              <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600;line-height:1.4;">${t.welcomeCard1}</p>
            </div>
          </td>
          <td style="padding:8px 2px;width:33%;" valign="top">
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:20px 16px;text-align:center;height:100%;">
              <div style="font-size:28px;margin-bottom:8px;">\uD83D\uDCCB</div>
              <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600;line-height:1.4;">${t.welcomeCard2}</p>
            </div>
          </td>
          <td style="padding:8px 0 8px 4px;width:33%;" valign="top">
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px;padding:20px 16px;text-align:center;height:100%;">
              <div style="font-size:28px;margin-bottom:8px;">\u2705</div>
              <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600;line-height:1.4;">${t.welcomeCard3}</p>
            </div>
          </td>
        </tr>
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
          ${t.welcomeTip}
        </p>
      `, true)}

      ${button(t.welcomeButton, `${SITE_URL}/caravans`)}

      ${verifySection}
    `, t.welcomePreheader, locale),
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
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.guestName.split(' ')[0];
  const deadlineLabel = data.immediatePayment
    ? t.bookingDirectPayment
    : formatDateShort(data.paymentDeadline, locale);

  return sendEmail({
    to,
    subject: t.bookingSubject(data.reference),
    html: emailWrapper(`
      ${badge('\uD83D\uDCDD', t.bookingBadge)}
      ${heading(t.bookingHeading)}
      ${subtext(t.bookingSubtext(firstName))}

      <!-- Reference card -->
      <div style="background:linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);border:1px solid #BAE6FD;border-radius:16px;padding:24px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${t.bookingRefLabel}</p>
        <p style="margin:0 0 8px;color:#0284C7;font-weight:800;font-size:22px;letter-spacing:0.5px;">${data.reference}</p>
        <span style="display:inline-block;background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">${t.bookingAwaitConfirm}</span>
      </div>

      <!-- Booking details -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow(t.bookingCaravan, data.caravanName)}
        ${infoRow(t.bookingCamping, data.campingName)}
        ${data.spotNumber ? infoRow(t.bookingSpot, data.spotNumber) : ''}
        ${infoRow(t.bookingCheckIn, formatDate(data.checkIn, locale))}
        ${infoRow(t.bookingCheckOut, formatDate(data.checkOut, locale))}
        ${infoRow(t.bookingNights, String(data.nights))}
        ${infoRow(t.bookingGuests, `${data.adults} ${t.bookingAdults}${data.children > 0 ? ` + ${data.children} ${t.bookingChildren}` : ''}`)}
      </table>

      ${divider()}

      <!-- Pricing -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr>
          <td style="color:#0F172A;font-size:16px;font-weight:700;padding:8px 0;">${t.bookingTotalPrice}</td>
          <td style="color:#0F172A;font-weight:800;font-size:22px;text-align:right;padding:8px 0;">${formatPrice(data.totalPrice)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="color:#64748B;font-size:13px;padding:4px 0;">${t.bookingPayBefore}</td>
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
            ? t.bookingImmediateNote(formatPrice(data.totalPrice), deadlineLabel)
            : t.bookingLaterNote(formatPrice(data.totalPrice), deadlineLabel)
          }
        </p>
      `, true)}

      ${button(t.bookingButton, `${SITE_URL}/mijn-account`)}
    `, `${t.bookingSubject(data.reference)} — ${data.caravanName}, ${data.campingName}`, locale),
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
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.guestName.split(' ')[0];

  const accountSection = data.isNewAccount && data.password ? `
    ${divider()}
    ${highlight(`
      <p style="margin:0 0 8px;color:#0F172A;font-size:14px;line-height:1.65;">
        <strong>${t.manualAccountTitle}</strong><br/>
        ${t.manualAccountDesc}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 0;">
        <tr>
          <td style="color:#64748B;font-size:13px;padding:4px 0;">${t.manualEmail}</td>
          <td style="color:#0F172A;font-weight:600;font-size:14px;text-align:right;padding:4px 0;">${to}</td>
        </tr>
        <tr>
          <td style="color:#64748B;font-size:13px;padding:4px 0;">${t.manualPassword}</td>
          <td style="color:#0F172A;font-weight:600;font-size:14px;text-align:right;padding:4px 0;font-family:monospace;letter-spacing:1px;">${data.password}</td>
        </tr>
      </table>
      <p style="margin:8px 0 0;color:#64748B;font-size:12px;">${t.manualChangePassword}</p>
    `, true)}
    ${button(t.manualLoginButton, `${SITE_URL}/mijn-account`)}
  ` : '';

  return sendEmail({
    to,
    subject: t.manualSubject(data.reference),
    html: emailWrapper(`
      ${badge('\uD83D\uDCDE', t.manualBadge)}
      ${heading(t.manualHeading)}
      ${subtext(t.manualSubtext(firstName))}

      <!-- Reference card -->
      <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);border:1px solid #86EFAC;border-radius:16px;padding:24px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${t.bookingRefLabel}</p>
        <p style="margin:0 0 8px;color:#16A34A;font-weight:800;font-size:22px;letter-spacing:0.5px;">${data.reference}</p>
        <span style="display:inline-block;background:#DBEAFE;color:#1E40AF;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">${t.manualConfirmed}</span>
      </div>

      <!-- Booking details -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow(t.bookingCaravan, data.caravanName)}
        ${infoRow(t.bookingCamping, data.campingName)}
        ${data.spotNumber ? infoRow(t.bookingSpot, data.spotNumber) : ''}
        ${infoRow(t.bookingCheckIn, formatDate(data.checkIn, locale))}
        ${infoRow(t.bookingCheckOut, formatDate(data.checkOut, locale))}
        ${infoRow(t.bookingNights, String(data.nights))}
        ${infoRow(t.bookingGuests, `${data.adults} ${t.bookingAdults}${data.children > 0 ? ` + ${data.children} ${t.bookingChildren}` : ''}`)}
      </table>

      ${divider()}

      <!-- Pricing & Payment -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr>
          <td style="color:#0F172A;font-size:16px;font-weight:700;padding:8px 0;">${t.bookingTotalPrice}</td>
          <td style="color:#0F172A;font-weight:800;font-size:22px;text-align:right;padding:8px 0;">${formatPrice(data.totalPrice)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="color:#64748B;font-size:13px;padding:4px 0;">${t.bookingPayBefore}</td>
                  <td style="color:#0284C7;font-weight:700;font-size:14px;text-align:right;padding:4px 0;">${data.paymentDeadline}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
          ${t.manualPayNote}
        </p>
      `, true)}

      ${button(t.manualPayButton(formatPrice(data.totalPrice)), data.paymentUrl)}

      <p style="margin:0 0 20px;color:#94A3B8;font-size:12px;text-align:center;">${t.manualPayLater}</p>

      ${accountSection}
    `, `${t.manualSubject(data.reference)} — ${data.caravanName}, ${data.campingName}`, locale),
  });
}

export async function sendPaymentConfirmationEmail(to: string, data: {
  guestName: string;
  reference: string;
  type: string;
  amount: number;
  paidAt: string;
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const typeLabel = getPaymentTypeLabel(data.type, locale);
  const firstName = data.guestName.split(' ')[0];
  const dateStr = formatDateShort(data.paidAt, locale);

  return sendEmail({
    to,
    subject: t.paymentSubject(data.reference),
    html: emailWrapper(`
      ${badge('\u2705', t.paymentBadge)}
      ${heading(t.paymentHeading)}
      ${subtext(t.paymentSubtext(firstName))}

      <!-- Amount display -->
      <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);border:1px solid #BBF7D0;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${typeLabel}</p>
        <p style="margin:0 0 8px;color:#16A34A;font-weight:800;font-size:36px;letter-spacing:-0.5px;">${formatPrice(data.amount)}</p>
        <p style="margin:0;color:#22C55E;font-size:13px;font-weight:500;">${t.paymentPaidOn(dateStr)}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow(t.paymentRef, data.reference)}
        ${infoRow(t.paymentType, typeLabel)}
        ${infoRow(t.paymentAmount, formatPrice(data.amount))}
      </table>

      ${button(t.paymentButton, `${SITE_URL}/mijn-account`)}
    `, `${t.paymentSubject(data.reference)} — ${formatPrice(data.amount)}`, locale),
  });
}

export async function sendContactAcknowledgmentEmail(to: string, name: string, subject: string, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: t.contactSubject,
    html: emailWrapper(`
      ${badge('\uD83D\uDCAC', t.contactBadge)}
      ${heading(t.contactHeading)}
      ${subtext(t.contactSubtext(firstName, subject))}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">\u23F1\uFE0F</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                ${t.contactResponseTime}
              </p>
            </td>
          </tr>
        </table>
      `)}

      ${button(t.contactButton, `${SITE_URL}/contact`)}
    `, `${t.contactSubject} — ${subject}`, locale),
  });
}

export async function sendContactReplyEmail(to: string, name: string, subject: string, reply: string, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: t.replySubject(subject),
    html: emailWrapper(`
      ${badge('\uD83D\uDCAC', t.replyBadge)}
      ${heading(t.replyHeading(firstName))}
      ${subtext(t.replySubtext(subject))}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align:top;">
              <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${t.replyLabel}</p>
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.7;white-space:pre-wrap;">${reply}</p>
            </td>
          </tr>
        </table>
      `, true)}

      ${subtext(t.replyFollowUp)}

      ${button(t.replyButton, `${SITE_URL}/contact`)}
    `, `${t.replySubject(subject)}`, locale),
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
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.guestName.split(' ')[0];
  const typeLabel = data.type === 'INCHECKEN' ? 'check-in' : 'check-out';
  const checklistUrl = `${SITE_URL}/borg/${data.token}`;
  const dashboardUrl = `${SITE_URL}/mijn-account?tab=borg`;

  return sendEmail({
    to: data.to,
    subject: t.borgSubject(data.reference),
    html: emailWrapper(`
      ${badge('\uD83D\uDD0D', t.borgBadge)}
      ${heading(t.borgHeading)}
      ${subtext(t.borgSubtext(firstName, typeLabel))}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow(t.borgBooking, data.reference)}
        ${data.caravanName ? infoRow(t.bookingCaravan, data.caravanName) : ''}
        ${infoRow(t.paymentType, data.type === 'INCHECKEN' ? t.borgCheckInType : t.borgCheckOutType)}
        ${data.checkIn ? infoRow(t.bookingCheckIn, data.checkIn) : ''}
        ${data.checkOut ? infoRow(t.bookingCheckOut, data.checkOut) : ''}
      </table>

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">\uD83D\uDCDD</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                ${t.borgNote}
              </p>
            </td>
          </tr>
        </table>
      `)}

      ${button(t.borgButton, checklistUrl)}

      <div style="text-align:center;margin-top:16px;">
        <a href="${dashboardUrl}" style="color:#0EA5E9;font-size:13px;text-decoration:none;font-weight:500;">${t.borgDashboardLink}</a>
      </div>
    `, `${t.borgSubject(data.reference)}`, locale),
  });
}

// ===== DELETE CONFIRMATION EMAIL =====

export async function sendDeleteConfirmationEmail(data: {
  to: string;
  name: string;
  token: string;
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.name.split(' ')[0];
  const confirmUrl = `${SITE_URL}/api/auth/delete-confirm?token=${data.token}`;

  return sendEmail({
    to: data.to,
    subject: t.deleteSubject,
    html: emailWrapper(`
      ${badge('\u26A0\uFE0F', t.deleteBadge)}
      ${heading(t.deleteHeading)}
      ${subtext(t.deleteSubtext(firstName))}

      <!-- Warning box -->
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:14px;padding:22px 26px;margin:0 0 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:22px;">\uD83D\uDEA8</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#991B1B;font-size:14px;line-height:1.65;font-weight:500;">
                ${t.deleteWarning}
              </p>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 8px;color:#0F172A;font-size:15px;line-height:1.7;">
        ${t.deleteInstruction}
      </p>

      ${button(t.deleteButton, confirmUrl, '#DC2626')}

      <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;text-align:center;">
        ${t.deleteIgnore}
      </p>
    `, `${t.deleteSubject}`, locale),
  });
}

// ===== NEWSLETTER EMAIL (admin content — not translated per user locale) =====

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  activiteit: { label: 'Activiteit', emoji: '\uD83C\uDF89' },
  feestdag: { label: 'Feestdag', emoji: '\uD83C\uDF8A' },
  markt: { label: 'Markt', emoji: '\uD83D\uDECD\uFE0F' },
  evenement: { label: 'Evenement', emoji: '\uD83C\uDFAD' },
  algemeen: { label: 'Nieuws', emoji: '\uD83D\uDCE3' },
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

  const photosHtml = data.photos && data.photos.length > 0
    ? `<div style="margin:0 0 28px;">
        ${data.photos.map(url =>
          `<div style="margin:0 0 14px;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <img src="${url}" alt="Nieuwsbrief afbeelding" style="width:100%;height:auto;display:block;" />
          </div>`
        ).join('')}
      </div>`
    : '';

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
              <td style="color:#64748B;font-size:13px;padding:4px 0;font-weight:500;">\uD83D\uDCC5 Datum</td>
              <td style="color:#0F172A;font-weight:600;font-size:13px;text-align:right;padding:4px 0;">${data.eventDate}</td>
            </tr>` : ''}
            ${data.eventLocation ? `<tr>
              <td style="color:#64748B;font-size:13px;padding:4px 0;font-weight:500;">\uD83D\uDCCD Locatie</td>
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
              <span style="font-size:20px;">\uD83C\uDF34</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                Wil je de Costa Brava zelf ervaren? Bekijk onze beschikbare caravans en boek jouw perfecte vakantie.
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      ${button('Bekijk caravans \u2192', `${SITE_URL}/caravans`)}

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
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.guestName.split(' ')[0];

  const weeks = Math.floor(data.daysUntil / 7);
  const remainingDays = data.daysUntil % 7;

  let countdownText: string;
  let emoji: string;
  let subjectLine: string;

  if (data.daysUntil === 30) {
    emoji = '\uD83D\uDCC5'; subjectLine = t.countdown30Subject; countdownText = t.countdown30Text;
  } else if (data.daysUntil === 14) {
    emoji = '\uD83C\uDF0A'; subjectLine = t.countdown14Subject; countdownText = t.countdown14Text;
  } else if (data.daysUntil === 7) {
    emoji = '\u2600\uFE0F'; subjectLine = t.countdown7Subject; countdownText = t.countdown7Text;
  } else if (data.daysUntil === 3) {
    emoji = '\uD83C\uDF89'; subjectLine = t.countdown3Subject; countdownText = t.countdown3Text;
  } else if (data.daysUntil === 1) {
    emoji = '\u2708\uFE0F'; subjectLine = t.countdown1Subject; countdownText = t.countdown1Text;
  } else {
    emoji = '\uD83C\uDFD6\uFE0F'; subjectLine = t.countdownDefaultSubject(data.daysUntil); countdownText = t.countdownDefaultText(data.daysUntil);
  }

  return sendEmail({
    to: data.to,
    subject: `${emoji} ${subjectLine}`,
    html: emailWrapper(`
      ${badge(emoji, t.countdownBadge)}
      ${heading(subjectLine)}
      ${subtext(t.countdownHi(firstName))}

      <!-- Countdown blocks -->
      <div style="text-align:center;margin:0 0 32px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td style="padding:0 8px;">
              <div style="background:linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);border:1px solid #BAE6FD;border-radius:14px;padding:20px 26px;text-align:center;min-width:80px;">
                <div style="font-size:36px;font-weight:800;color:#0284C7;line-height:1;">${weeks}</div>
                <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1.5px;margin-top:8px;font-weight:600;">${t.countdownWeeks}</div>
              </div>
            </td>
            <td style="padding:0 8px;">
              <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);border:1px solid #BBF7D0;border-radius:14px;padding:20px 26px;text-align:center;min-width:80px;">
                <div style="font-size:36px;font-weight:800;color:#16A34A;line-height:1;">${remainingDays}</div>
                <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:1.5px;margin-top:8px;font-weight:600;">${t.countdownDays}</div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 28px;color:#0F172A;font-size:15px;line-height:1.7;">${countdownText}</p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow(t.borgBooking, data.reference)}
        ${infoRow(t.bookingCaravan, data.caravanName)}
        ${infoRow(t.bookingCamping, data.campingName)}
        ${infoRow(t.bookingCheckIn, formatDateLong(data.checkIn, locale))}
        ${infoRow(t.bookingCheckOut, formatDateLong(data.checkOut, locale))}
      </table>

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">\uD83D\uDCA1</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                ${t.countdownTip}
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      ${button(t.countdownButton, `${SITE_URL}/mijn-account?tab=boekingen`)}
    `, `${emoji} ${subjectLine} — ${data.caravanName}, ${data.campingName}`, locale),
  });
}

// ===== PASSWORD RESET EMAIL =====

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `${t.resetSubject} — ${BRAND_NAME}`,
    html: emailWrapper(`
      ${badge('\uD83D\uDD11', t.resetBadge)}
      ${heading(t.resetHeading(firstName))}
      ${subtext(t.resetSubtext)}

      ${button(t.resetButton, resetUrl)}

      ${divider()}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">\u26A0\uFE0F</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
                ${t.resetExpiry}
              </p>
            </td>
          </tr>
        </table>
      `)}
    `, t.resetSubject, locale),
  });
}

// ===== EMAIL VERIFICATION =====

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = name.split(' ')[0];

  return sendEmail({
    to,
    subject: `${t.verifySubject} — ${BRAND_NAME}`,
    html: emailWrapper(`
      ${badge('\u2709\uFE0F', t.verifyBadge)}
      ${heading(t.verifyHeading)}
      ${subtext(t.verifySubtext(firstName))}

      ${button(t.verifyButton, verifyUrl)}

      ${divider()}

      <p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">
        ${t.verifyExpiry}
      </p>
    `, t.verifySubject, locale),
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
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.guestName.split(' ')[0];
  const urgency = data.daysUntil <= 7 ? 'urgent' : 'normal';
  const accentColor = urgency === 'urgent' ? '#DC2626' : '#F59E0B';
  const bgColor = urgency === 'urgent' ? '#FEF2F2' : '#FFFBEB';
  const borderColor = urgency === 'urgent' ? '#FECACA' : '#FDE68A';

  return sendEmail({
    to: data.to,
    subject: urgency === 'urgent'
      ? t.reminderUrgentSubject(data.daysUntil, data.reference)
      : t.reminderNormalSubject(data.reference),
    html: emailWrapper(`
      ${badge(urgency === 'urgent' ? '\u26A0\uFE0F' : '\uD83D\uDCB6', t.reminderBadge)}
      ${heading(urgency === 'urgent' ? t.reminderUrgentHeading : t.reminderNormalHeading)}
      ${subtext(t.reminderSubtext(firstName, data.daysUntil))}

      <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${t.reminderToPay}</p>
        <p style="margin:0 0 8px;color:${accentColor};font-weight:800;font-size:36px;letter-spacing:-0.5px;">${formatPrice(data.amount)}</p>
        <p style="margin:0;color:#64748B;font-size:13px;">${t.reminderForBooking(data.reference)}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow(t.reminderRef, data.reference)}
        ${infoRow(t.bookingCaravan, data.caravanName)}
        ${infoRow(t.bookingCamping, data.campingName)}
        ${infoRow(t.reminderArrival, formatDateShort(data.checkIn, locale))}
        ${infoRow(t.reminderOutstanding, formatPrice(data.amount))}
      </table>

      ${highlight(`
        <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.65;">
          ${t.reminderPayNote}
          ${urgency === 'urgent' ? t.reminderUrgentNote : ''}
        </p>
      `, true)}

      ${button(t.reminderButton, `${SITE_URL}/mijn-account`)}
    `, `${formatPrice(data.amount)} — ${data.reference}`, locale),
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
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.guestName.split(' ')[0];

  return sendEmail({
    to: data.to,
    subject: t.cancelSubject(data.reference),
    html: emailWrapper(`
      ${badge('\u274C', t.cancelBadge)}
      ${heading(t.cancelHeading)}
      ${subtext(t.cancelSubtext(firstName))}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        ${infoRow(t.cancelRef, data.reference)}
        ${infoRow(t.bookingCaravan, data.caravanName)}
        ${infoRow(t.bookingCamping, data.campingName)}
        ${infoRow(t.bookingCheckIn, formatDateLong(data.checkIn, locale))}
        ${infoRow(t.bookingCheckOut, formatDateLong(data.checkOut, locale))}
      </table>

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">\uD83D\uDCB0</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;color:#0F172A;font-size:14px;font-weight:700;">
                ${t.cancelRefundLabel(data.refundPercentage)}
              </p>
              <p style="margin:0;color:#64748B;font-size:14px;line-height:1.65;">
                ${data.refundMessage}
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      <p style="margin:0 0 20px;color:#64748B;font-size:14px;line-height:1.65;">
        ${t.cancelRefundNote}
      </p>

      ${button(t.cancelButton, `${SITE_URL}/contact`)}
    `, `${t.cancelSubject(data.reference)}`, locale),
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
}, locale?: string) {
  const t = getEmailTranslations(locale);
  const firstName = data.guestName.split(' ')[0];

  return sendEmail({
    to: data.to,
    subject: t.reviewSubject(firstName),
    html: emailWrapper(`
      ${badge('\u2B50', t.reviewBadge)}
      ${heading(t.reviewHeading(firstName))}
      ${subtext(t.reviewSubtext)}

      ${highlight(`
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:2px;">
              <span style="font-size:20px;">\uD83C\uDFD5\uFE0F</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;color:#0F172A;font-size:14px;font-weight:700;">
                ${data.caravanName} — ${data.campingName}
              </p>
              <p style="margin:0;color:#64748B;font-size:13px;">
                ${t.reviewDateRange(formatDateShort(data.checkIn, locale), formatDateShort(data.checkOut, locale))}
              </p>
            </td>
          </tr>
        </table>
      `, true)}

      <div style="text-align:center;margin:0 0 20px;">
        <div style="font-size:32px;letter-spacing:4px;margin-bottom:8px;">\u2B50\u2B50\u2B50\u2B50\u2B50</div>
        <p style="margin:0;color:#64748B;font-size:14px;">${t.reviewRateQuestion}</p>
      </div>

      ${button(t.reviewButton, GOOGLE_REVIEW_URL, '#EA4335')}

      <p style="margin:24px 0 0;color:#94A3B8;font-size:13px;text-align:center;line-height:1.6;">
        ${t.reviewThanks}
      </p>

      ${divider()}

      <p style="margin:0 0 8px;color:#64748B;font-size:13px;line-height:1.6;">
        ${t.reviewFeedbackTitle}
      </p>

      ${button(t.reviewFeedbackButton, `${SITE_URL}/contact`, '#64748B')}
    `, `${t.reviewSubject(firstName)}`, locale),
  });
}
