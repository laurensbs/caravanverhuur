import { NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

// Daily full database backup via Vercel Cron
// Exports all tables as JSON and emails as attachment to admin
// POST /api/cron/backup

const BACKUP_TABLES = [
  'bookings',
  'payments',
  'contacts',
  'caravan_settings',
  'borg_checklists',
  'customers',
  'customer_sessions',
  'password_reset_tokens',
  'email_verification_tokens',
  'custom_caravans',
  'newsletters',
  'delete_confirmations',
  'discount_codes',
  'booking_tasks',
  'chat_conversations',
  'chat_messages',
  'campings',
  'activity_log',
  'pricing_rules',
];

const ADMIN_EMAIL = 'info@caravanverhuurspanje.com';
const RESEND_API_URL = 'https://api.resend.com/emails';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const pool = createPool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    const backup: Record<string, { count: number; rows: unknown[] }> = {};
    const errors: string[] = [];

    // Export each table (wrapped in try/catch so one failing table doesn't kill the whole backup)
    for (const table of BACKUP_TABLES) {
      try {
        // Use parameterized-safe approach for known table names (all hardcoded above)
        const result = await pool.query(`SELECT * FROM ${table}`);
        backup[table] = {
          count: result.rows.length,
          rows: result.rows,
        };
      } catch (err) {
        // Table might not exist yet — that's fine, skip it
        errors.push(`${table}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // 2026-04-06
    const timeStr = now.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam' });

    // Build summary
    const tableStats = Object.entries(backup)
      .map(([name, data]) => `  ${name}: ${data.count} rijen`)
      .join('\n');
    const totalRows = Object.values(backup).reduce((sum, t) => sum + t.count, 0);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Create JSON backup
    const backupData = {
      metadata: {
        date: now.toISOString(),
        tables: Object.keys(backup).length,
        totalRows,
        errors: errors.length > 0 ? errors : undefined,
        durationSeconds: parseFloat(duration),
      },
      data: backup,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const jsonBase64 = Buffer.from(jsonStr).toString('base64');
    const sizeMB = (Buffer.byteLength(jsonStr) / (1024 * 1024)).toFixed(2);

    // Send via Resend with attachment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not set — backup not emailed');
      return NextResponse.json({ error: 'No email API key' }, { status: 500 });
    }

    const from = process.env.EMAIL_FROM || 'Caravanverhuur Spanje <info@caravanverhuurspanje.com>';

    const emailHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1a1a;">✅ Dagelijkse backup — ${dateStr}</h2>
        <p style="color:#666;font-size:14px;">Automatische database backup van Caravanverhuur Spanje.</p>
        <div style="background:#f8f9fa;border-radius:12px;padding:16px;margin:16px 0;">
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;color:#888;">Datum</td><td style="padding:4px 8px;font-weight:600;">${dateStr} ${timeStr}</td></tr>
            <tr><td style="padding:4px 8px;color:#888;">Tabellen</td><td style="padding:4px 8px;font-weight:600;">${Object.keys(backup).length} / ${BACKUP_TABLES.length}</td></tr>
            <tr><td style="padding:4px 8px;color:#888;">Totaal rijen</td><td style="padding:4px 8px;font-weight:600;">${totalRows.toLocaleString('nl-NL')}</td></tr>
            <tr><td style="padding:4px 8px;color:#888;">Bestandsgrootte</td><td style="padding:4px 8px;font-weight:600;">${sizeMB} MB</td></tr>
            <tr><td style="padding:4px 8px;color:#888;">Duur</td><td style="padding:4px 8px;font-weight:600;">${duration}s</td></tr>
          </table>
        </div>
        <details style="margin:12px 0;font-size:12px;color:#888;">
          <summary style="cursor:pointer;font-weight:600;margin-bottom:8px;">Tabel details</summary>
          <pre style="background:#f0f0f0;padding:12px;border-radius:8px;overflow-x:auto;font-size:11px;">${tableStats}</pre>
        </details>
        ${errors.length > 0 ? `
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;margin:12px 0;font-size:12px;">
            <strong>⚠️ Fouten (${errors.length}):</strong><br/>
            ${errors.map(e => `<code style="font-size:11px;">${e}</code>`).join('<br/>')}
          </div>
        ` : ''}
        <p style="font-size:11px;color:#aaa;margin-top:20px;">De backup is bijgevoegd als JSON bestand. Bewaar dit bestand op een veilige plek.</p>
      </div>
    `;

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [ADMIN_EMAIL],
        subject: `✅ Backup ${dateStr} — ${totalRows} rijen (${sizeMB} MB)`,
        html: emailHtml,
        attachments: [
          {
            filename: `backup-caravanverhuur-${dateStr}.json`,
            content: jsonBase64,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Backup email failed:', res.status, body);
      return NextResponse.json({ error: 'Email failed', details: body }, { status: 500 });
    }

    console.log(`[BACKUP] ${dateStr} — ${Object.keys(backup).length} tables, ${totalRows} rows, ${sizeMB} MB, ${duration}s`);

    return NextResponse.json({
      success: true,
      date: dateStr,
      tables: Object.keys(backup).length,
      totalRows,
      sizeMB: parseFloat(sizeMB),
      durationSeconds: parseFloat(duration),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[BACKUP] Fatal error:', error);
    return NextResponse.json(
      { error: 'Backup failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
