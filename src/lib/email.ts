// ===== EMAIL SERVICE =====
// Uses Resend API via fetch (no npm package required)
// Set RESEND_API_KEY and EMAIL_FROM in .env.local

const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Caravans Costa Brava <noreply@caravanscostabrava.nl>';

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

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#386150,#58B09C);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🏕️ Caravans Costa Brava</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Uw vakantie aan de Spaanse kust</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#FAFAF7;padding:24px 40px;border-top:1px solid #DDD9D0;text-align:center;">
            <p style="margin:0;color:#7B7768;font-size:12px;">
              © ${new Date().getFullYear()} Caravans Costa Brava &middot; Costa Brava, Spanje<br>
              <a href="https://caravanscostabrava.nl" style="color:#58B09C;text-decoration:none;">caravanscostabrava.nl</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ===== EMAIL TEMPLATES =====

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Welkom bij Caravans Costa Brava! 🎉',
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#3D3522;font-size:22px;">Welkom, ${name}!</h2>
      <p style="color:#4A442D;line-height:1.6;margin:0 0 16px;">
        Bedankt voor het aanmaken van uw account. U kunt nu eenvoudig boekingen plaatsen
        en uw vakanties beheren via uw persoonlijke dashboard.
      </p>
      <p style="color:#4A442D;line-height:1.6;margin:0 0 24px;">
        Met uw account kunt u:
      </p>
      <ul style="color:#4A442D;line-height:1.8;margin:0 0 24px;padding-left:20px;">
        <li>Caravans bekijken en boeken</li>
        <li>Uw boekingen en betalingen inzien</li>
        <li>Borg-checklists digitaal ondertekenen</li>
        <li>Direct contact opnemen met ons team</li>
      </ul>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://caravanscostabrava.nl/mijn-account" 
           style="display:inline-block;background:#58B09C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
          Naar Mijn Account →
        </a>
      </div>
      <p style="color:#7B7768;font-size:13px;margin:0;">
        Heeft u vragen? Neem gerust contact met ons op via onze website.
      </p>
    `),
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
    return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatPrice = (n: number) => `€${n.toFixed(2).replace('.', ',')}`;

  return sendEmail({
    to,
    subject: `Boekingsbevestiging ${data.reference} ✅`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;color:#3D3522;font-size:22px;">Boekingsbevestiging</h2>
      <p style="color:#4A442D;line-height:1.6;margin:0 0 24px;">
        Beste ${data.guestName}, bedankt voor uw boeking! Hieronder vindt u de details.
      </p>

      <div style="background:#EEFBF5;border:1px solid #CAF7E2;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 4px;color:#386150;font-weight:700;font-size:18px;">Referentie: ${data.reference}</p>
        <p style="margin:0;color:#58B09C;font-size:14px;">Status: Nieuw — wacht op bevestiging</p>
      </div>

      <table width="100%" cellpadding="8" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;padding:8px 0;">Caravan</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${data.caravanName}</td>
        </tr>
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;padding:8px 0;">Camping</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${data.campingName}</td>
        </tr>
        ${data.spotNumber ? `<tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;padding:8px 0;">Plek</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${data.spotNumber}</td>
        </tr>` : ''}
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;padding:8px 0;">Inchecken</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${formatDate(data.checkIn)}</td>
        </tr>
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;padding:8px 0;">Uitchecken</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${formatDate(data.checkOut)}</td>
        </tr>
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;padding:8px 0;">Nachten</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${data.nights}</td>
        </tr>
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;padding:8px 0;">Gasten</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${data.adults} volw.${data.children > 0 ? ` + ${data.children} kind.` : ''}</td>
        </tr>
      </table>

      <div style="background:#FAFAF7;border-radius:8px;padding:20px;margin:0 0 24px;">
        <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="color:#7B7768;font-size:14px;">Totaalprijs</td>
            <td style="color:#3D3522;font-weight:700;font-size:16px;text-align:right;">${formatPrice(data.totalPrice)}</td>
          </tr>
          <tr>
            <td style="color:#7B7768;font-size:14px;">Aanbetaling (30%)</td>
            <td style="color:#dc2626;font-weight:600;font-size:14px;text-align:right;">${formatPrice(data.depositAmount)}</td>
          </tr>
          <tr>
            <td style="color:#7B7768;font-size:14px;">Restbetaling</td>
            <td style="color:#7B7768;font-size:14px;text-align:right;">${formatPrice(data.remainingAmount)}</td>
          </tr>
        </table>
      </div>

      <div style="background:#EEFBF5;border:1px solid #58B09C;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="margin:0;color:#3D3522;font-size:14px;line-height:1.5;">
          <strong>⚠️ Volgende stap:</strong> Betaal de aanbetaling van ${formatPrice(data.depositAmount)} via iDEAL. 
          Als je al bent doorgestuurd naar iDEAL, is de betaling onderweg. Anders kun je betalen via je account.
        </p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="https://caravanscostabrava.nl/mijn-account" 
           style="display:inline-block;background:#58B09C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
          Bekijk Boeking →
        </a>
      </div>
    `),
  });
}

export async function sendPaymentConfirmationEmail(to: string, data: {
  guestName: string;
  reference: string;
  type: string;
  amount: number;
  paidAt: string;
}) {
  const formatPrice = (n: number) => `€${n.toFixed(2).replace('.', ',')}`;
  const typeLabel = data.type === 'AANBETALING' ? 'Aanbetaling' : data.type === 'RESTBETALING' ? 'Restbetaling' : data.type === 'BORG' ? 'Borg' : data.type;

  return sendEmail({
    to,
    subject: `Betaling ontvangen — ${data.reference} 💰`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#3D3522;font-size:22px;">Betaling Ontvangen</h2>
      <p style="color:#4A442D;line-height:1.6;margin:0 0 24px;">
        Beste ${data.guestName}, wij hebben uw betaling ontvangen. Bedankt!
      </p>

      <div style="background:#EEFBF5;border:1px solid #CAF7E2;border-radius:8px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="margin:0 0 4px;color:#386150;font-size:14px;">${typeLabel}</p>
        <p style="margin:0;color:#386150;font-weight:700;font-size:28px;">${formatPrice(data.amount)}</p>
        <p style="margin:8px 0 0;color:#58B09C;font-size:13px;">✅ Betaald op ${new Date(data.paidAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <table width="100%" cellpadding="8" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;">Referentie</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${data.reference}</td>
        </tr>
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;">Type</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${typeLabel}</td>
        </tr>
        <tr style="border-bottom:1px solid #DDD9D0;">
          <td style="color:#7B7768;font-size:14px;">Bedrag</td>
          <td style="color:#3D3522;font-weight:600;font-size:14px;text-align:right;">${formatPrice(data.amount)}</td>
        </tr>
      </table>

      <div style="text-align:center;margin:32px 0;">
        <a href="https://caravanscostabrava.nl/mijn-account" 
           style="display:inline-block;background:#58B09C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
          Bekijk Mijn Account →
        </a>
      </div>
    `),
  });
}

export async function sendContactAcknowledgmentEmail(to: string, name: string, subject: string) {
  return sendEmail({
    to,
    subject: `Wij hebben uw bericht ontvangen — ${subject}`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#3D3522;font-size:22px;">Bericht Ontvangen</h2>
      <p style="color:#4A442D;line-height:1.6;margin:0 0 16px;">
        Beste ${name}, bedankt voor uw bericht over "<em>${subject}</em>".
      </p>
      <p style="color:#4A442D;line-height:1.6;margin:0 0 24px;">
        Wij hebben uw bericht in goede orde ontvangen en proberen binnen 24 uur te reageren.
      </p>
      <div style="background:#EEFBF5;border:1px solid #CAF7E2;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="margin:0;color:#386150;font-size:14px;">
          💬 U kunt ook altijd bellen of appen voor dringende vragen.
        </p>
      </div>
    `),
  });
}
