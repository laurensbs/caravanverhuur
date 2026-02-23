'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import {
  mockBookings,
  getBookingCaravan,
  getPaymentStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  type Payment,
  type PaymentStatus,
  type PaymentType,
} from '@/data/admin';

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['OPENSTAAND', 'BETAALD', 'TERUGBETAALD', 'MISLUKT'];
const PAYMENT_TYPE_OPTIONS: PaymentType[] = ['AANBETALING', 'RESTBETALING', 'BORG', 'BORG_RETOUR'];

interface PaymentWithBooking extends Payment {
  guestName: string;
  bookingRef: string;
  caravanName: string;
}

export default function BetalingenPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALLE'>('ALLE');
  const [typeFilter, setTypeFilter] = useState<PaymentType | 'ALLE'>('ALLE');

  // Flatten all payments with booking context
  const allPayments: PaymentWithBooking[] = mockBookings.flatMap((b) =>
    b.payments.map((p) => ({
      ...p,
      guestName: b.guestName,
      bookingRef: b.reference,
      caravanName: getBookingCaravan(b)?.name || b.caravanId,
    }))
  );

  const filtered = allPayments
    .filter((p) => {
      if (statusFilter !== 'ALLE' && p.status !== statusFilter) return false;
      if (typeFilter !== 'ALLE' && p.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.guestName.toLowerCase().includes(q) ||
          p.bookingRef.toLowerCase().includes(q) ||
          p.caravanName.toLowerCase().includes(q) ||
          (p.stripeId && p.stripeId.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Summary stats
  const paid = allPayments.filter((p) => p.status === 'BETAALD');
  const open = allPayments.filter((p) => p.status === 'OPENSTAAND');
  const refunded = allPayments.filter((p) => p.status === 'TERUGBETAALD');
  const totalPaid = paid.reduce((s, p) => s + p.amount, 0);
  const totalOpen = open.reduce((s, p) => s + p.amount, 0);
  const totalRefunded = refunded.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-100 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748b] font-medium">Ontvangen</p>
            <p className="text-xl font-bold text-[#1a1a2e]">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-[#94a3b8]">{paid.length} betalingen</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748b] font-medium">Openstaand</p>
            <p className="text-xl font-bold text-[#1a1a2e]">{formatCurrency(totalOpen)}</p>
            <p className="text-xs text-[#94a3b8]">{open.length} betalingen</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748b] font-medium">Terugbetaald</p>
            <p className="text-xl font-bold text-[#1a1a2e]">{formatCurrency(totalRefunded)}</p>
            <p className="text-xs text-[#94a3b8]">{refunded.length} betalingen</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, referentie, Stripe ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALLE')}
            className="pl-10 pr-8 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          >
            <option value="ALLE">Alle statussen</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PaymentType | 'ALLE')}
            className="pl-10 pr-8 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          >
            <option value="ALLE">Alle types</option>
            {PAYMENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-[#64748b]">
        {filtered.length} betaling{filtered.length !== 1 ? 'en' : ''} gevonden
      </p>

      {/* Payments list */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-[#f8fafc] text-xs font-semibold text-[#64748b] uppercase tracking-wider border-b border-[#e2e8f0]">
          <div className="col-span-3">Gast / Boeking</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Bedrag</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Methode</div>
          <div className="col-span-2">Datum</div>
        </div>

        <div className="divide-y divide-[#e2e8f0]">
          {filtered.map((payment) => (
            <div
              key={payment.id}
              className="px-5 py-4 md:grid md:grid-cols-12 md:gap-4 md:items-center space-y-2 md:space-y-0 hover:bg-[#f8fafc] transition-colors"
            >
              {/* Guest */}
              <div className="col-span-3">
                <p className="text-sm font-medium text-[#1a1a2e]">{payment.guestName}</p>
                <p className="text-xs text-[#94a3b8]">{payment.bookingRef}</p>
              </div>

              {/* Type */}
              <div className="col-span-2">
                <span className="text-sm text-[#1a1a2e]">{payment.type.replace('_', ' ')}</span>
              </div>

              {/* Amount */}
              <div className="col-span-2">
                <span className="text-sm font-semibold text-[#1a1a2e]">
                  {formatCurrency(payment.amount)}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}
                >
                  {payment.status}
                </span>
              </div>

              {/* Method */}
              <div className="col-span-1">
                <span className="text-xs text-[#64748b]">
                  {payment.method === 'stripe' ? 'Stripe' : payment.method === 'bank' ? 'Bank' : 'Contant'}
                </span>
              </div>

              {/* Date */}
              <div className="col-span-2">
                <p className="text-xs text-[#64748b]">{formatDateTime(payment.createdAt)}</p>
                {payment.paidAt && (
                  <p className="text-xs text-green-600">✓ {formatDateTime(payment.paidAt)}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#94a3b8]">
            <p className="text-lg">Geen betalingen gevonden</p>
            <p className="text-sm mt-1">Pas je filters aan</p>
          </div>
        )}
      </div>
    </div>
  );
}
