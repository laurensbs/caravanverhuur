import { caravans } from './caravans';
import { campings } from './campings';

// ===== TYPES =====

export type BookingStatus = 'NIEUW' | 'BEVESTIGD' | 'AANBETAALD' | 'VOLLEDIG_BETAALD' | 'ACTIEF' | 'AFGEROND' | 'GEANNULEERD';
export type PaymentStatus = 'OPENSTAAND' | 'BETAALD' | 'TERUGBETAALD' | 'MISLUKT';
export type PaymentType = 'AANBETALING' | 'RESTBETALING' | 'BORG' | 'BORG_RETOUR';
export type ContactStatus = 'NIEUW' | 'GELEZEN' | 'BEANTWOORD';

export interface Booking {
  id: string;
  reference: string;
  createdAt: string;
  status: BookingStatus;
  // Guest
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adults: number;
  children: number;
  specialRequests?: string;
  // Stay
  caravanId: string;
  campingId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  // Pricing
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  borgAmount: number;
  // Payments linked
  payments: Payment[];
  // Notes
  adminNotes?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  method: 'stripe' | 'bank' | 'cash';
  stripeId?: string;
  createdAt: string;
  paidAt?: string;
}

export interface ContactSubmission {
  id: string;
  createdAt: string;
  status: ContactStatus;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  adminReply?: string;
}

// ===== MOCK DATA =====

export const mockBookings: Booking[] = [
  {
    id: 'B-001',
    reference: 'BK-2026-001',
    createdAt: '2026-01-15T10:30:00',
    status: 'VOLLEDIG_BETAALD',
    guestName: 'Familie de Vries',
    guestEmail: 'devries@gmail.com',
    guestPhone: '+31 6 12345678',
    adults: 2,
    children: 2,
    specialRequests: 'Graag een plek met schaduw als mogelijk.',
    caravanId: '1',
    campingId: '1',
    checkIn: '2026-07-05',
    checkOut: '2026-07-19',
    nights: 14,
    totalPrice: 1190,
    depositAmount: 357,
    remainingAmount: 833,
    borgAmount: 350,
    payments: [
      { id: 'P-001', bookingId: 'B-001', type: 'AANBETALING', amount: 357, status: 'BETAALD', method: 'bank', createdAt: '2026-01-15T10:30:00', paidAt: '2026-01-16T14:00:00' },
      { id: 'P-002', bookingId: 'B-001', type: 'RESTBETALING', amount: 833, status: 'BETAALD', method: 'stripe', stripeId: 'pi_3abc123', createdAt: '2026-05-01T09:00:00', paidAt: '2026-05-01T09:05:00' },
      { id: 'P-003', bookingId: 'B-001', type: 'BORG', amount: 350, status: 'BETAALD', method: 'stripe', stripeId: 'pi_3abc124', createdAt: '2026-05-01T09:05:00', paidAt: '2026-05-01T09:06:00' },
    ],
    adminNotes: 'Vaste klant, 2e boeking.',
  },
  {
    id: 'B-002',
    reference: 'BK-2026-002',
    createdAt: '2026-01-28T14:15:00',
    status: 'AANBETAALD',
    guestName: 'Mark & Lisa Bakker',
    guestEmail: 'mark.bakker@outlook.com',
    guestPhone: '+31 6 98765432',
    adults: 2,
    children: 0,
    caravanId: '3',
    campingId: '3',
    checkIn: '2026-08-10',
    checkOut: '2026-08-24',
    nights: 14,
    totalPrice: 1330,
    depositAmount: 399,
    remainingAmount: 931,
    borgAmount: 500,
    payments: [
      { id: 'P-004', bookingId: 'B-002', type: 'AANBETALING', amount: 399, status: 'BETAALD', method: 'bank', createdAt: '2026-01-28T14:15:00', paidAt: '2026-01-30T10:00:00' },
      { id: 'P-005', bookingId: 'B-002', type: 'RESTBETALING', amount: 931, status: 'OPENSTAAND', method: 'stripe', createdAt: '2026-01-28T14:15:00' },
    ],
  },
  {
    id: 'B-003',
    reference: 'BK-2026-003',
    createdAt: '2026-02-05T09:45:00',
    status: 'BEVESTIGD',
    guestName: 'Jan & Petra van Dijk',
    guestEmail: 'jp.vandijk@gmail.com',
    guestPhone: '+31 6 55544433',
    adults: 2,
    children: 3,
    specialRequests: 'Kinderbedje nodig (baby 1 jaar).',
    caravanId: '1',
    campingId: '2',
    checkIn: '2026-06-20',
    checkOut: '2026-07-04',
    nights: 14,
    totalPrice: 1190,
    depositAmount: 357,
    remainingAmount: 833,
    borgAmount: 350,
    payments: [
      { id: 'P-006', bookingId: 'B-003', type: 'AANBETALING', amount: 357, status: 'OPENSTAAND', method: 'bank', createdAt: '2026-02-05T09:45:00' },
    ],
  },
  {
    id: 'B-004',
    reference: 'BK-2026-004',
    createdAt: '2026-02-10T16:20:00',
    status: 'NIEUW',
    guestName: 'Sophie & Tom Hendriks',
    guestEmail: 'sophie.hendriks@live.nl',
    guestPhone: '+31 6 22233344',
    adults: 2,
    children: 1,
    caravanId: '4',
    campingId: '8',
    checkIn: '2026-07-25',
    checkOut: '2026-08-08',
    nights: 14,
    totalPrice: 840,
    depositAmount: 252,
    remainingAmount: 588,
    borgAmount: 250,
    payments: [],
  },
  {
    id: 'B-005',
    reference: 'BK-2026-005',
    createdAt: '2026-02-14T11:00:00',
    status: 'GEANNULEERD',
    guestName: 'Peter Smit',
    guestEmail: 'peter.smit@hotmail.com',
    guestPhone: '+31 6 11122233',
    adults: 1,
    children: 0,
    caravanId: '5',
    campingId: '9',
    checkIn: '2026-06-01',
    checkOut: '2026-06-08',
    nights: 7,
    totalPrice: 299,
    depositAmount: 89.70,
    remainingAmount: 209.30,
    borgAmount: 250,
    payments: [
      { id: 'P-007', bookingId: 'B-005', type: 'AANBETALING', amount: 89.70, status: 'TERUGBETAALD', method: 'bank', createdAt: '2026-02-14T11:00:00', paidAt: '2026-02-15T09:00:00' },
    ],
    adminNotes: 'Geannuleerd wegens ziekte. Aanbetaling teruggestort.',
  },
  {
    id: 'B-006',
    reference: 'BK-2026-006',
    createdAt: '2026-02-18T08:30:00',
    status: 'AANBETAALD',
    guestName: 'Familie Jansen',
    guestEmail: 'jansen.fam@gmail.com',
    guestPhone: '+31 6 44455566',
    adults: 2,
    children: 2,
    specialRequests: 'Plek dichtbij het zwembad graag.',
    caravanId: '2',
    campingId: '4',
    checkIn: '2026-08-01',
    checkOut: '2026-08-15',
    nights: 14,
    totalPrice: 840,
    depositAmount: 252,
    remainingAmount: 588,
    borgAmount: 300,
    payments: [
      { id: 'P-008', bookingId: 'B-006', type: 'AANBETALING', amount: 252, status: 'BETAALD', method: 'stripe', stripeId: 'pi_3def456', createdAt: '2026-02-18T08:30:00', paidAt: '2026-02-18T08:35:00' },
      { id: 'P-009', bookingId: 'B-006', type: 'RESTBETALING', amount: 588, status: 'OPENSTAAND', method: 'stripe', createdAt: '2026-02-18T08:30:00' },
    ],
  },
  {
    id: 'B-007',
    reference: 'BK-2026-007',
    createdAt: '2026-02-20T13:10:00',
    status: 'NIEUW',
    guestName: 'Emma & Lars de Boer',
    guestEmail: 'emma.deboer@ziggo.nl',
    guestPhone: '+31 6 77788899',
    adults: 2,
    children: 0,
    caravanId: '6',
    campingId: '7',
    checkIn: '2026-09-01',
    checkOut: '2026-09-15',
    nights: 14,
    totalPrice: 1330,
    depositAmount: 399,
    remainingAmount: 931,
    borgAmount: 500,
    payments: [],
  },
];

export const mockContacts: ContactSubmission[] = [
  {
    id: 'C-001',
    createdAt: '2026-02-10T09:15:00',
    status: 'BEANTWOORD',
    name: 'Karin Visser',
    email: 'karin.visser@gmail.com',
    phone: '+31 6 33322211',
    subject: 'Beschikbaarheid juli',
    message: 'Hallo, ik wil graag weten welke caravans nog beschikbaar zijn in juli 2026 voor 4 personen op een camping in Pals.',
    adminReply: 'Beste Karin, de Dethleffs Camper 560 FMK is nog beschikbaar in juli op Camping Cypsela Resort en Camping Interpals. Boek snel via onze website!',
  },
  {
    id: 'C-002',
    createdAt: '2026-02-15T14:30:00',
    status: 'GELEZEN',
    name: 'Marco de Groot',
    email: 'marco.degroot@outlook.com',
    subject: 'Transport mogelijkheden',
    message: 'Kunnen jullie ook transport regelen vanuit Nederland naar de Costa Brava? Wat zijn de kosten?',
  },
  {
    id: 'C-003',
    createdAt: '2026-02-19T11:45:00',
    status: 'NIEUW',
    name: 'Linda Mulder',
    email: 'linda.m@yahoo.com',
    phone: '+31 6 00011122',
    subject: 'Huisdieren toegestaan?',
    message: 'Wij hebben een kleine hond. Zijn huisdieren welkom in de caravans? En zo ja, zijn er extra kosten?',
  },
  {
    id: 'C-004',
    createdAt: '2026-02-22T16:00:00',
    status: 'NIEUW',
    name: 'Rob Bakker',
    email: 'rob.bakker@live.nl',
    subject: 'Groepsboeking',
    message: 'Wij willen graag met 3 gezinnen (12 personen) tegelijk boeken op dezelfde camping. Is dit mogelijk en krijgen we korting?',
  },
];

// ===== HELPERS =====

export function getBookingCaravan(booking: Booking) {
  return caravans.find(c => c.id === booking.caravanId);
}

export function getBookingCamping(booking: Booking) {
  return campings.find(c => c.id === booking.campingId);
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
