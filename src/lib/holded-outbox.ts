// Holded outbox — async retry-pattern voor Holded API-calls.
//
// Gebruikt door payment-flow.ts wanneer markHoldedInvoicePaid faalt:
// in plaats van de fout vergeten loggen we 'm in deze tabel en de
// /api/cron/holded-retry route probeert later opnieuw met exponential
// backoff. Zo kan een tijdelijke Holded-storing geen proforma's verliezen.
//
// Action-types ondersteund:
//   - 'mark-paid' → markHoldedInvoicePaid(holdedInvoiceId)
// Future: 'create-invoice', 'mark-paid-amount' kunnen hier ook landen
// als we die ook robuust willen maken.

import { sql } from '@vercel/postgres';
import { markHoldedInvoicePaid } from './holded';
import * as Sentry from '@sentry/nextjs';

export type HoldedOutboxAction = 'mark-paid';

// Backoff-schema in minuten. Index = aantal failed attempts.
// Na meer pogingen geven we op (geen further auto-retry).
const BACKOFF_MINUTES = [0, 5, 30, 120, 360, 1440]; // 0min, 5min, 30min, 2u, 6u, 24u
const MAX_ATTEMPTS = BACKOFF_MINUTES.length;

function generateId() {
  return 'hox_' + Math.random().toString(36).slice(2, 12);
}

export async function enqueueHoldedJob(opts: {
  paymentId: string;
  holdedInvoiceId: string;
  action: HoldedOutboxAction;
  initialError?: string;
}): Promise<string> {
  const id = generateId();
  await sql`
    INSERT INTO holded_outbox (id, payment_id, holded_invoice_id, action, attempts, last_error, next_retry_at)
    VALUES (${id}, ${opts.paymentId}, ${opts.holdedInvoiceId}, ${opts.action}, 0, ${opts.initialError || null}, NOW())
    ON CONFLICT (id) DO NOTHING
  `;
  return id;
}

interface OutboxRow {
  id: string;
  payment_id: string;
  holded_invoice_id: string;
  action: HoldedOutboxAction;
  attempts: number;
}

export async function getPendingHoldedJobs(limit = 25): Promise<OutboxRow[]> {
  const result = await sql<OutboxRow>`
    SELECT id, payment_id, holded_invoice_id, action, attempts
    FROM holded_outbox
    WHERE completed_at IS NULL
      AND next_retry_at <= NOW()
      AND attempts < ${MAX_ATTEMPTS}
    ORDER BY next_retry_at ASC
    LIMIT ${limit}
  `;
  return result.rows;
}

async function markCompleted(id: string) {
  await sql`UPDATE holded_outbox SET completed_at = NOW() WHERE id = ${id}`;
}

async function markFailed(id: string, attempts: number, error: string) {
  const nextAttempt = attempts + 1;
  // If we've exhausted retries, leave next_retry_at as-is and let it
  // sit "stuck"; cron filters on attempts < MAX_ATTEMPTS so it won't
  // try again. Sentry alert below tells the team to investigate.
  const backoffMin = BACKOFF_MINUTES[nextAttempt] ?? BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1];
  await sql`
    UPDATE holded_outbox
    SET attempts = ${nextAttempt},
        last_error = ${error.slice(0, 1000)},
        last_attempt_at = NOW(),
        next_retry_at = NOW() + (${backoffMin} || ' minutes')::interval
    WHERE id = ${id}
  `;

  if (nextAttempt >= MAX_ATTEMPTS) {
    Sentry.captureMessage(`Holded outbox job exhausted retries: ${id}`, {
      level: 'error',
      tags: { integration: 'holded', flow: 'outbox' },
      extra: { jobId: id, attempts: nextAttempt, error },
    });
  }
}

// Process one job: dispatch to the right action handler. Returns true on
// success, false on failure (caller logs + marks failed).
async function processJob(job: OutboxRow): Promise<{ ok: boolean; error?: string }> {
  try {
    if (job.action === 'mark-paid') {
      await markHoldedInvoicePaid(job.holded_invoice_id);
      return { ok: true };
    }
    return { ok: false, error: `Unknown action: ${job.action}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Drain the queue: pick up to `limit` pending jobs and try each. Used by
// the cron route. Returns a summary for the response body.
export async function drainHoldedOutbox(limit = 25): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const jobs = await getPendingHoldedJobs(limit);
  let succeeded = 0;
  let failed = 0;
  for (const job of jobs) {
    const result = await processJob(job);
    if (result.ok) {
      await markCompleted(job.id);
      succeeded++;
    } else {
      await markFailed(job.id, job.attempts, result.error || 'unknown');
      failed++;
    }
  }
  return { processed: jobs.length, succeeded, failed };
}
