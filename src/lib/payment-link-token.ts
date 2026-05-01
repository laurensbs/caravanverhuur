// HMAC-based unguessable token for the customer-facing payment-flow page (/betalen/[ref]).
// Token is short-lived only by way of the booking's payment status — once paid, the link
// becomes useless on the page itself. There's no expiry stored.

import crypto from 'crypto';

function getSecret(): string {
  // Reuse ADMIN_SECRET as the signing secret — it's already configured. Fall back to a
  // hard-coded dev string only outside production.
  const s = process.env.ADMIN_SECRET || process.env.PAYMENT_LINK_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_SECRET (or PAYMENT_LINK_SECRET) must be set in production');
  }
  return 'dev-only-payment-link-secret';
}

export function signBookingPaymentToken(bookingRef: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`pay:${bookingRef}`).digest('hex').slice(0, 32);
}

export function verifyBookingPaymentToken(bookingRef: string, token: string): boolean {
  const expected = signBookingPaymentToken(bookingRef);
  if (expected.length !== token.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
