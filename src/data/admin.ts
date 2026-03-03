import { caravans } from './caravans';
import { campings } from './campings';

// ===== TYPES (snake_case matching DB columns) =====

export type BookingStatus = 'NIEUW' | 'BEVESTIGD' | 'AANBETAALD' | 'VOLLEDIG_BETAALD' | 'ACTIEF' | 'AFGEROND' | 'GEANNULEERD';
export type PaymentStatus = 'OPENSTAAND' | 'BETAALD' | 'TERUGBETAALD' | 'MISLUKT';
export type PaymentType = 'AANBETALING' | 'RESTBETALING' | 'BORG' | 'BORG_RETOUR';
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
  admin_notes?: string;
  // Payments are fetched separately
  payments?: Payment[];
}

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
  // Joined fields from getAllPayments
  guest_name?: string;
  booking_ref?: string;
  caravan_id?: string;
}

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
}

// ===== HELPERS =====

export function getBookingCaravan(booking: Booking) {
  return caravans.find(c => c.id === booking.caravan_id);
}

export function getBookingCamping(booking: Booking) {
  return campings.find(c => c.id === booking.camping_id);
}

export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    NIEUW: 'bg-primary-100 text-primary-dark',
    BEVESTIGD: 'bg-primary-50 text-accent',
    AANBETAALD: 'bg-primary-light/50 text-accent',
    VOLLEDIG_BETAALD: 'bg-primary-100 text-primary-dark',
    ACTIEF: 'bg-primary-light text-primary-dark',
    AFGEROND: 'bg-surface-alt text-muted',
    GEANNULEERD: 'bg-danger/10 text-danger',
  };
  return colors[status];
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    OPENSTAAND: 'bg-primary-50 text-accent',
    BETAALD: 'bg-primary-100 text-primary-dark',
    TERUGBETAALD: 'bg-primary-light/50 text-primary-dark',
    MISLUKT: 'bg-danger/10 text-danger',
  };
  return colors[status];
}

export function getContactStatusColor(status: ContactStatus): string {
  const colors: Record<ContactStatus, string> = {
    NIEUW: 'bg-primary-100 text-primary-dark',
    GELEZEN: 'bg-primary-50 text-accent',
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
