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
  method: 'stripe' | 'bank' | 'cash';
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
    NIEUW: 'bg-blue-100 text-blue-700',
    BEVESTIGD: 'bg-yellow-100 text-yellow-700',
    AANBETAALD: 'bg-orange-100 text-orange-700',
    VOLLEDIG_BETAALD: 'bg-green-100 text-green-700',
    ACTIEF: 'bg-emerald-100 text-emerald-700',
    AFGEROND: 'bg-gray-100 text-gray-600',
    GEANNULEERD: 'bg-red-100 text-red-700',
  };
  return colors[status];
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    OPENSTAAND: 'bg-yellow-100 text-yellow-700',
    BETAALD: 'bg-green-100 text-green-700',
    TERUGBETAALD: 'bg-blue-100 text-blue-700',
    MISLUKT: 'bg-red-100 text-red-700',
  };
  return colors[status];
}

export function getContactStatusColor(status: ContactStatus): string {
  const colors: Record<ContactStatus, string> = {
    NIEUW: 'bg-blue-100 text-blue-700',
    GELEZEN: 'bg-yellow-100 text-yellow-700',
    BEANTWOORD: 'bg-green-100 text-green-700',
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
