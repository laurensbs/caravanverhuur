import { caravans } from './caravans';
import { campings } from './campings';

// Module-level cache for custom (DB) caravans and campings
// Set via loadCustomData() — persists for the page session
/* eslint-disable @typescript-eslint/no-explicit-any */
let _cachedCustomCaravans: any[] = [];
let _cachedCustomCampings: any[] = [];
let _dataLoaded = false;

export function setCustomCaravansCache(data: any[]) { _cachedCustomCaravans = data; }
export function setCustomCampingsCache(data: any[]) { _cachedCustomCampings = data; }

/** Fetch custom caravans + campings from the API and cache module-level. Call once on mount. */
export async function loadCustomData() {
  if (_dataLoaded) return;
  _dataLoaded = true;
  try {
    const [caravanRes, campingRes] = await Promise.all([
      fetch('/api/admin/caravans').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/campings').then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (caravanRes?.caravans) _cachedCustomCaravans = caravanRes.caravans;
    if (campingRes?.campings) _cachedCustomCampings = campingRes.campings;
  } catch { /* silent */ }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ===== TYPES (snake_case matching DB columns) =====

export type BookingStatus = 'NIEUW' | 'BEVESTIGD' | 'AANBETAALD' | 'VOLLEDIG_BETAALD' | 'ACTIEF' | 'AFGEROND' | 'GEANNULEERD';
export type PaymentStatus = 'OPENSTAAND' | 'BETAALD' | 'TERUGBETAALD' | 'MISLUKT';
export type PaymentType = 'AANBETALING' | 'RESTBETALING' | 'HUUR' | 'BORG' | 'BORG_RETOUR';
export type ContactStatus = 'NIEUW' | 'GELEZEN' | 'BEANTWOORD';

export interface Booking {
  id: string;
  reference: string;
  created_at: string;
  status: BookingStatus;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  adults: number;
  children: number;
  special_requests?: string;
  caravan_id: string;
  camping_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  deposit_amount: number;
  remaining_amount: number;
  borg_amount: number;
  spot_number?: string;
  admin_notes?: string;
  // Payments are fetched separately
  payments?: Payment[];
}

export type HoldedStatus = 'NIET_AANGEMAAKT' | 'HANDMATIG' | 'IN_HOLDED';

export interface Payment {
  id: string;
  booking_id: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  method: 'ideal' | 'stripe' | 'bank' | 'cash';
  stripe_id?: string;
  created_at: string;
  paid_at?: string;
  holded_status?: HoldedStatus;
  holded_invoice_id?: string;
  holded_marked_at?: string;
  // Joined fields from getAllPayments
  guest_name?: string;
  booking_ref?: string;
  caravan_id?: string;
}

export type ContactSource = 'contact' | 'livechat';

export interface ContactSubmission {
  id: string;
  created_at: string;
  status: ContactStatus;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  admin_reply?: string;
  source: ContactSource;
}

// ===== HELPERS =====

// These check static data first, then the module-level custom cache, then the optional parameter.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function getBookingCaravan(booking: Booking, customCaravans?: any[]) {
  const staticMatch = caravans.find(c => c.id === booking.caravan_id);
  if (staticMatch) return staticMatch;
  const cacheMatch = _cachedCustomCaravans.find((c: any) => c.id === booking.caravan_id);
  if (cacheMatch) return cacheMatch;
  const customMatch = customCaravans?.find((c: any) => c.id === booking.caravan_id);
  if (customMatch) return customMatch;
  // Fallback: return minimal object so displays don't break
  if (booking.caravan_id) return { id: booking.caravan_id, name: `Caravan ${booking.caravan_id}`, reference: booking.caravan_id, type: '', maxPersons: 0, manufacturer: '', year: 0, description: '', photos: [] as string[], amenities: [] as string[], pricePerDay: 0, pricePerWeek: 0, deposit: 0 };
  return undefined;
}

export function getBookingCamping(booking: Booking, customCampings?: any[]) {
  const staticMatch = campings.find(c => c.id === booking.camping_id);
  if (staticMatch) return staticMatch;
  const cacheMatch = _cachedCustomCampings.find((c: any) => c.id === booking.camping_id);
  if (cacheMatch) return cacheMatch;
  const customMatch = customCampings?.find((c: any) => c.id === booking.camping_id);
  if (customMatch) return customMatch;
  // Fallback: return minimal object so displays don't break
  if (booking.camping_id) return { id: booking.camping_id, name: `Camping ${booking.camping_id}`, location: '', description: '' };
  return undefined;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    NIEUW: 'bg-primary-100 text-primary-dark',
    BEVESTIGD: 'bg-primary-50 text-primary',
    AANBETAALD: 'bg-primary-light/50 text-primary',
    VOLLEDIG_BETAALD: 'bg-primary-100 text-primary-dark',
    ACTIEF: 'bg-primary-light text-primary-dark',
    AFGEROND: 'bg-surface-alt text-muted',
    GEANNULEERD: 'bg-danger/10 text-danger',
  };
  return colors[status];
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    OPENSTAAND: 'bg-primary-50 text-primary',
    BETAALD: 'bg-primary-100 text-primary-dark',
    TERUGBETAALD: 'bg-primary-light/50 text-primary-dark',
    MISLUKT: 'bg-danger/10 text-danger',
  };
  return colors[status];
}

export function getContactStatusColor(status: ContactStatus): string {
  const colors: Record<ContactStatus, string> = {
    NIEUW: 'bg-primary-100 text-primary-dark',
    GELEZEN: 'bg-primary-50 text-primary',
    BEANTWOORD: 'bg-primary-light text-primary-dark',
  };
  return colors[status];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}
