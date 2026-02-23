'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  CarFront,
  Calendar,
  Phone,
  Mail,
  FileText,
  CreditCard,
} from 'lucide-react';
import {
  mockBookings,
  getBookingCaravan,
  getBookingCamping,
  getStatusColor,
  getPaymentStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  type Booking,
  type BookingStatus,
} from '@/data/admin';

const STATUS_OPTIONS: BookingStatus[] = [
  'NIEUW',
  'BEVESTIGD',
  'AANBETAALD',
  'VOLLEDIG_BETAALD',
  'ACTIEF',
  'AFGEROND',
  'GEANNULEERD',
];

function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const caravan = getBookingCaravan(booking);
  const camping = getBookingCamping(booking);

  return (
    <div className="bg-[#f8fafc] rounded-2xl p-5 border border-[#e2e8f0] mt-2 space-y-5 animate-in">
      {/* Guest info */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-2">
          <User className="w-4 h-4" /> Gastgegevens
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-[#1a1a2e]">{booking.guestName}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b] mt-1">
              <Mail className="w-3 h-3" />
              <a href={`mailto:${booking.guestEmail}`} className="hover:text-[#1a3c6e]">
                {booking.guestEmail}
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b] mt-0.5">
              <Phone className="w-3 h-3" />
              <a href={`tel:${booking.guestPhone}`} className="hover:text-[#1a3c6e]">
                {booking.guestPhone}
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">
              <strong>{booking.adults}</strong> volwassenen, <strong>{booking.children}</strong> kinderen
            </p>
            {booking.specialRequests && (
              <div className="mt-1 flex items-start gap-1.5">
                <FileText className="w-3 h-3 text-[#64748b] mt-0.5 shrink-0" />
                <p className="text-xs text-[#64748b] italic">{booking.specialRequests}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stay info */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Verblijf
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <CarFront className="w-4 h-4 text-[#64748b] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">{caravan?.name || booking.caravanId}</p>
              <p className="text-xs text-[#64748b]">{caravan?.reference}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#64748b] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">{camping?.name || booking.campingId}</p>
              <p className="text-xs text-[#64748b]">{camping?.location}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 bg-white rounded-xl p-3 text-xs text-[#64748b]">
          <p>
            <strong>Check-in:</strong> {formatDate(booking.checkIn)} &nbsp; | &nbsp;
            <strong>Check-out:</strong> {formatDate(booking.checkOut)} &nbsp; | &nbsp;
            <strong>Nachten:</strong> {booking.nights}
          </p>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Financieel
        </h4>
        <div className="bg-white rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Totaalprijs</span>
            <span className="font-semibold text-[#1a1a2e]">{formatCurrency(booking.totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Aanbetaling (30%)</span>
            <span className="text-[#1a1a2e]">{formatCurrency(booking.depositAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Restbedrag</span>
            <span className="text-[#1a1a2e]">{formatCurrency(booking.remainingAmount)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-[#e2e8f0] pt-2">
            <span className="text-[#64748b]">Borg</span>
            <span className="text-[#1a1a2e]">{formatCurrency(booking.borgAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {booking.payments.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">
            Betalingen
          </h4>
          <div className="space-y-2">
            {booking.payments.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl p-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-[#1a1a2e]">
                    {p.type.replace('_', ' ')} – {formatCurrency(p.amount)}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {p.method === 'stripe' ? 'Stripe' : p.method === 'bank' ? 'Bankoverschrijving' : 'Contant'}
                    {p.stripeId && ` (${p.stripeId})`}
                  </p>
                  {p.paidAt && (
                    <p className="text-xs text-green-600">Betaald op {formatDateTime(p.paidAt)}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(p.status)}`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes */}
      {booking.adminNotes && (
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
          <p className="text-xs font-semibold text-yellow-800 mb-1">Admin Notities</p>
          <p className="text-sm text-yellow-700">{booking.adminNotes}</p>
        </div>
      )}

      <button
        onClick={onClose}
        className="text-sm text-[#64748b] hover:text-[#1a1a2e] transition-colors cursor-pointer"
      >
        Sluiten
      </button>
    </div>
  );
}

export default function BookingenPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALLE'>('ALLE');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockBookings
    .filter((b) => {
      if (statusFilter !== 'ALLE' && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const caravan = getBookingCaravan(b);
        const camping = getBookingCamping(b);
        return (
          b.guestName.toLowerCase().includes(q) ||
          b.guestEmail.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          caravan?.name.toLowerCase().includes(q) ||
          camping?.name.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail, referentie..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALLE')}
            className="pl-10 pr-8 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          >
            <option value="ALLE">Alle statussen</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-[#64748b]">
        {filtered.length} boeking{filtered.length !== 1 ? 'en' : ''} gevonden
      </p>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((booking) => {
          const caravan = getBookingCaravan(booking);
          const camping = getBookingCamping(booking);
          const isExpanded = expandedId === booking.id;

          return (
            <div key={booking.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                {/* Date badge */}
                <div className="text-center bg-[#f8fafc] rounded-xl px-3 py-2 shrink-0 hidden sm:block">
                  <p className="text-lg font-bold text-[#1a3c6e]">
                    {new Date(booking.checkIn).getDate()}
                  </p>
                  <p className="text-xs text-[#64748b] uppercase">
                    {new Date(booking.checkIn).toLocaleDateString('nl-NL', { month: 'short' })}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[#1a1a2e]">{booking.guestName}</p>
                    <span className="text-xs text-[#94a3b8]">{booking.reference}</span>
                  </div>
                  <p className="text-xs text-[#64748b] truncate mt-0.5">
                    {caravan?.name} → {camping?.name} &nbsp;|&nbsp; {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-[#1a1a2e]">{formatCurrency(booking.totalPrice)}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(booking.status)}`}
                  >
                    {booking.status.replace('_', ' ')}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#94a3b8]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5">
                  <BookingDetail
                    booking={booking}
                    onClose={() => setExpandedId(null)}
                  />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#94a3b8]">
            <p className="text-lg">Geen boekingen gevonden</p>
            <p className="text-sm mt-1">Pas je zoekopdracht of filters aan</p>
          </div>
        )}
      </div>
    </div>
  );
}
