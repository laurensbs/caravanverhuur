'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  Save,
} from 'lucide-react';
import {
  getBookingCaravan,
  getBookingCamping,
  getStatusColor,
  getPaymentStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  type Booking,
  type Payment,
  type BookingStatus,
} from '@/data/admin';

const STATUS_OPTIONS: BookingStatus[] = [
  'NIEUW', 'BEVESTIGD', 'AANBETAALD', 'VOLLEDIG_BETAALD', 'ACTIEF', 'AFGEROND', 'GEANNULEERD',
];

function BookingDetail({ booking, onStatusChange, onNotesChange }: {
  booking: Booking;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  const caravan = getBookingCaravan(booking);
  const camping = getBookingCamping(booking);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [newStatus, setNewStatus] = useState(booking.status);
  const [notes, setNotes] = useState(booking.admin_notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/payments?bookingId=${booking.id}`)
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .catch(() => {})
      .finally(() => setLoadingPayments(false));
  }, [booking.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (newStatus !== booking.status) {
        await fetch('/api/bookings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: booking.id, status: newStatus }),
        });
        onStatusChange(booking.id, newStatus);
      }
      if (notes !== (booking.admin_notes || '')) {
        await fetch('/api/bookings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: booking.id, notes }),
        });
        onNotesChange(booking.id, notes);
      }
    } catch {
      // silent
    }
    setSaving(false);
  };

  return (
    <div className="bg-[#f8fafc] rounded-2xl p-5 border border-[#e2e8f0] mt-2 space-y-5">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-2">
          <User className="w-4 h-4" /> Gastgegevens
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-[#1a1a2e]">{booking.guest_name}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b] mt-1">
              <Mail className="w-3 h-3" />
              <a href={`mailto:${booking.guest_email}`} className="hover:text-[#1a3c6e]">{booking.guest_email}</a>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b] mt-0.5">
              <Phone className="w-3 h-3" />
              <a href={`tel:${booking.guest_phone}`} className="hover:text-[#1a3c6e]">{booking.guest_phone}</a>
            </div>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">
              <strong>{booking.adults}</strong> volwassenen, <strong>{booking.children}</strong> kinderen
            </p>
            {booking.special_requests && (
              <div className="mt-1 flex items-start gap-1.5">
                <FileText className="w-3 h-3 text-[#64748b] mt-0.5 shrink-0" />
                <p className="text-xs text-[#64748b] italic">{booking.special_requests}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Verblijf
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <CarFront className="w-4 h-4 text-[#64748b] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">{caravan?.name || booking.caravan_id}</p>
              <p className="text-xs text-[#64748b]">{caravan?.reference}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#64748b] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#1a1a2e]">{camping?.name || booking.camping_id}</p>
              <p className="text-xs text-[#64748b]">{camping?.location}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 bg-white rounded-xl p-3 text-xs text-[#64748b]">
          <p>
            <strong>Check-in:</strong> {formatDate(booking.check_in)} &nbsp;|&nbsp;
            <strong>Check-out:</strong> {formatDate(booking.check_out)} &nbsp;|&nbsp;
            <strong>Nachten:</strong> {booking.nights}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Financieel
        </h4>
        <div className="bg-white rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Totaalprijs</span>
            <span className="font-semibold text-[#1a1a2e]">{formatCurrency(Number(booking.total_price))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Aanbetaling (30%)</span>
            <span className="text-[#1a1a2e]">{formatCurrency(Number(booking.deposit_amount))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Restbedrag</span>
            <span className="text-[#1a1a2e]">{formatCurrency(Number(booking.remaining_amount))}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-[#e2e8f0] pt-2">
            <span className="text-[#64748b]">Borg</span>
            <span className="text-[#1a1a2e]">{formatCurrency(Number(booking.borg_amount))}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Betalingen</h4>
        {loadingPayments ? (
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]"><Loader2 className="w-4 h-4 animate-spin" /> Laden...</div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-[#94a3b8]">Geen betalingen</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[#1a1a2e]">{p.type.replace('_', ' ')} &ndash; {formatCurrency(Number(p.amount))}</p>
                  <p className="text-xs text-[#64748b]">
                    {p.method === 'stripe' ? 'Stripe' : p.method === 'bank' ? 'Bank' : 'Contant'}
                    {p.stripe_id && ` (${p.stripe_id})`}
                  </p>
                  {p.paid_at && <p className="text-xs text-green-600">Betaald op {formatDateTime(p.paid_at)}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(p.status)}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider block mb-1">Status wijzigen</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
            className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider block mb-1">Admin Notities</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
            placeholder="Interne notities..."
          />
        </div>
      </div>

      {(newStatus !== booking.status || notes !== (booking.admin_notes || '')) && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a3c6e] text-white rounded-xl text-sm font-medium hover:bg-[#15325c] transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Opslaan
        </button>
      )}
    </div>
  );
}

export default function BookingenPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALLE'>('ALLE');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchBookings = useCallback(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleStatusChange = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleNotesChange = (id: string, adminNotes: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, admin_notes: adminNotes } : b));
  };

  const filtered = bookings
    .filter((b) => {
      if (statusFilter !== 'ALLE' && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const caravan = getBookingCaravan(b);
        const camping = getBookingCamping(b);
        return (
          b.guest_name.toLowerCase().includes(q) ||
          b.guest_email.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          (caravan?.name.toLowerCase().includes(q) ?? false) ||
          (camping?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3c6e]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-[#64748b]">
        {filtered.length} boeking{filtered.length !== 1 ? 'en' : ''} gevonden
      </p>

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
                <div className="text-center bg-[#f8fafc] rounded-xl px-3 py-2 shrink-0 hidden sm:block">
                  <p className="text-lg font-bold text-[#1a3c6e]">
                    {new Date(booking.check_in).getDate()}
                  </p>
                  <p className="text-xs text-[#64748b] uppercase">
                    {new Date(booking.check_in).toLocaleDateString('nl-NL', { month: 'short' })}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[#1a1a2e]">{booking.guest_name}</p>
                    <span className="text-xs text-[#94a3b8]">{booking.reference}</span>
                  </div>
                  <p className="text-xs text-[#64748b] truncate mt-0.5">
                    {caravan?.name} → {camping?.name} &nbsp;|&nbsp; {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-[#1a1a2e]">{formatCurrency(Number(booking.total_price))}</p>
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
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
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
