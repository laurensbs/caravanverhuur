// Refund-percentage volgens algemene voorwaarden (artikel 9 / FAQ q1.5).
// Eén plek voor de policy zodat /api/bookings/cancel én /api/admin/refund
// hetzelfde rekenen — anders divergeert het.
//
//   • Niet betaald                  → 0% (geen iets om terug te boeken)
//   • >30 dagen voor aankomst      → 100%
//   • 14-30 dagen                   → 50%
//   • <14 dagen                     → 0%

export interface RefundPolicyResult {
  percentage: 0 | 50 | 100;
  reason: string;
  // Als de boeking nog niet betaald is geeft het endpoint typisch 0 terug
  // — de dialog gebruikt deze hint om een ander label te tonen.
  unpaid?: boolean;
}

export function computeRefundPolicy(opts: {
  daysUntilCheckIn: number;
  hasPaid: boolean;
}): RefundPolicyResult {
  if (!opts.hasPaid) {
    return { percentage: 0, reason: 'Geen betaling ontvangen — niets om terug te boeken.', unpaid: true };
  }
  if (opts.daysUntilCheckIn > 30) {
    return { percentage: 100, reason: 'Volledige restitutie (>30 dagen voor aankomst).' };
  }
  if (opts.daysUntilCheckIn >= 14) {
    return { percentage: 50, reason: '50% restitutie (14-30 dagen voor aankomst).' };
  }
  return { percentage: 0, reason: 'Geen restitutie (<14 dagen voor aankomst).' };
}

// Bereken het concrete refund-bedrag in euro's o.b.v. een originele payment.
// Round to whole cents (avoid floating sub-cent).
export function computeRefundAmount(originalAmount: number, percentage: number): number {
  return Math.round(originalAmount * percentage) / 100;
}
