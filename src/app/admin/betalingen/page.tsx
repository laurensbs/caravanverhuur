'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowUpDown,
  Loader2,
  Download,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import {
  getPaymentStatusColor,
  formatDateTime,
  formatCurrency,
  type Payment,
  type PaymentStatus,
  type PaymentType,
} from '@/data/admin';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['OPENSTAAND', 'BETAALD', 'TERUGBETAALD', 'MISLUKT'];
const PAYMENT_TYPE_OPTIONS: PaymentType[] = ['AANBETALING', 'RESTBETALING', 'HUUR', 'BORG', 'BORG_RETOUR'];

export default function BetalingenPage() {
  const { t, ts } = useAdmin();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALLE'>('ALLE');
  const [typeFilter, setTypeFilter] = useState<PaymentType | 'ALLE'>('ALLE');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundConfirm, setRefundConfirm] = useState<string | null>(null);
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);

  useEffect(() => {
    fetch('/api/admin/caravans')
      .then(res => res.json())
      .then(data => setCustomCaravans(data.caravans || []))
      .catch((e) => console.error('Fetch error:', e));
    fetch('/api/payments')
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .catch((e) => { console.error('Fetch error:', e); })
      .finally(() => setLoading(false));
  }, []);

  const handleMarkPaid = async (paymentId: string) => {
    setUpdatingId(paymentId);
    try {
      await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, status: 'BETAALD', paidAt: new Date().toISOString() }),
      });
      setPayments(prev =>
        prev.map(p =>
          p.id === paymentId
            ? { ...p, status: 'BETAALD' as PaymentStatus, paid_at: new Date().toISOString() }
            : p
        )
      );
      toast(t('common.saved'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setUpdatingId(null);
  };

  const handleRefund = async (paymentId: string) => {
    setRefundingId(paymentId);
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      if (res.ok) {
        setPayments(prev =>
          prev.map(p =>
            p.id === paymentId
              ? { ...p, status: 'TERUGBETAALD' as PaymentStatus }
              : p
          )
        );
        toast(t('payments.refunded'), 'success');
      } else {
        toast(t('common.actionFailed'), 'error');
      }
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setRefundingId(null);
    setRefundConfirm(null);
  };

  const getCaravanName = (caravanId?: string) => {
    if (!caravanId) return '';
    return staticCaravans.find(c => c.id === caravanId)?.name || customCaravans.find(c => c.id === caravanId)?.name || caravanId;
  };

  const filtered = payments
    .filter((p) => {
      if (statusFilter !== 'ALLE' && p.status !== statusFilter) return false;
      if (typeFilter !== 'ALLE' && p.type !== typeFilter) return false;
      if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (p.guest_name && p.guest_name.toLowerCase().includes(q)) ||
          (p.booking_ref && p.booking_ref.toLowerCase().includes(q)) ||
          (p.stripe_id && p.stripe_id.toLowerCase().includes(q)) ||
          getCaravanName(p.caravan_id).toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, typeFilter, search, dateFrom, dateTo]);

  const paid = payments.filter((p) => p.status === 'BETAALD');
  const open = payments.filter((p) => p.status === 'OPENSTAAND');
  const refunded = payments.filter((p) => p.status === 'TERUGBETAALD');
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount), 0);
  const totalOpen = open.reduce((s, p) => s + Number(p.amount), 0);
  const totalRefunded = refunded.reduce((s, p) => s + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-2xl p-3 sm:p-5 flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-xl bg-primary-50 text-primary">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-muted font-medium">{t('payments.received')}</p>
            <p className="text-sm sm:text-xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
            <p className="text-[10px] sm:text-xs text-muted hidden sm:block">{paid.length} {t('payments.paymentsCount')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-xl bg-primary/20 text-primary">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-muted font-medium">{t('payments.openPayments')}</p>
            <p className="text-sm sm:text-xl font-bold text-foreground">{formatCurrency(totalOpen)}</p>
            <p className="text-[10px] sm:text-xs text-muted hidden sm:block">{open.length} {t('payments.paymentsCount')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-xl bg-primary/10 text-primary">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-muted font-medium">{t('payments.refunded')}</p>
            <p className="text-sm sm:text-xl font-bold text-foreground">{formatCurrency(totalRefunded)}</p>
            <p className="text-[10px] sm:text-xs text-muted hidden sm:block">{refunded.length} {t('payments.paymentsCount')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('payments.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALLE')}
            className="pl-10 pr-8 py-2.5 bg-white rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="ALLE">{t('status.allStatuses')}</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{ts(s)}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PaymentType | 'ALLE')}
            className="pl-10 pr-8 py-2.5 bg-white rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="ALLE">{t('status.allTypes')}</option>
            {PAYMENT_TYPE_OPTIONS.map((t2) => (
              <option key={t2} value={t2}>{ts(t2)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title={t('payments.dateFrom')}
          className="px-3 py-2 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark text-muted [&:not(:placeholder-shown)]:text-foreground"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title={t('payments.dateTo')}
          className="px-3 py-2 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark text-muted [&:not(:placeholder-shown)]:text-foreground"
        />
        <button
          onClick={() => {
            const headers = ['Gast', 'Boeking', 'Type', 'Bedrag', 'Status', 'Methode', 'Datum'];
            const rows = filtered.map(p => [
              p.guest_name || '', p.booking_ref || '', ts(p.type),
              Number(p.amount).toFixed(2), ts(p.status), p.method || '',
              new Date(p.created_at).toLocaleDateString('nl-NL'),
            ]);
            const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `betalingen-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Download size={14} />
          {t('payments.exportCsv')}
        </button>
      </div>

      <p className="text-xs text-muted">
        {filtered.length} {t('payments.paymentsFound', { count: String(filtered.length), s: filtered.length !== 1 ? 'en' : '' })} </p> {/* Payments list */} <div className="bg-white rounded-2xl overflow-hidden"> <div className="hidden md:grid grid-cols-12 gap-4 px-3 sm:px-5 py-2 sm:py-3 bg-surface text-xs font-semibold text-muted uppercase tracking-wider"> <div className="col-span-3">{t('payments.guestBooking')}</div> <div className="col-span-2">{t('payments.type')}</div> <div className="col-span-2">{t('payments.amount')}</div> <div className="col-span-2">{t('payments.status')}</div> <div className="col-span-1">{t('payments.method')}</div> <div className="col-span-2">{t('payments.date')}</div> </div> <div className=""> {paginated.map((payment) => ( <div key={payment.id} className="px-3 py-3 sm:px-5 sm:py-4 md:grid md:grid-cols-12 md:gap-4 md:items-center space-y-1.5 md:space-y-0 hover:bg-surface transition-colors" > <div className="col-span-3"> <p className="text-sm font-medium text-foreground">{payment.guest_name}</p> <p className="text-xs text-muted">{payment.booking_ref}</p> {payment.stripe_id && <p className="text-[10px] text-muted/60 font-mono truncate" title={payment.stripe_id}>{payment.stripe_id}</p>} </div> <div className="col-span-2"> <span className="text-sm text-foreground">{ts(payment.type)}</span>
              </div>

              <div className="col-span-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(Number(payment.amount))}
                </span>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}
                >
                  {ts(payment.status)}
                </span>
                {payment.status === 'OPENSTAAND' && (
                  <button
                    onClick={() => handleMarkPaid(payment.id)}
                    disabled={updatingId === payment.id}
                    className="text-xs text-primary-dark bg-primary-50 hover:bg-primary-50 px-2 py-0.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {updatingId === payment.id ? '...' : t('payments.markPaid')}
                  </button>
                )}
                {payment.status === 'BETAALD' && (
                  refundConfirm === payment.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRefund(payment.id)}
                        disabled={refundingId === payment.id}
                        className="text-xs text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {refundingId === payment.id ? '...' : 'Bevestig'}
                      </button>
                      <button
                        onClick={() => setRefundConfirm(null)}
                        className="text-xs text-muted px-1 py-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRefundConfirm(payment.id)}
                      className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Refund
                    </button>
                  )
                )}
              </div>

              <div className="col-span-1">
                <span className="text-xs text-muted">
                  {payment.method === 'ideal' ? 'iDEAL/Wero' : payment.method === 'stripe' ? 'iDEAL/Wero' : payment.method === 'bank' ? t('common.bank') : t('common.cash')}
                </span>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-muted">{formatDateTime(payment.created_at)}</p>
                {payment.paid_at && (
                  <p className="text-xs text-primary">✓ {formatDateTime(payment.paid_at)}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-lg">{t('payments.noPayments')}</p>
            <p className="text-sm mt-1">{t('payments.adjustFilters')}</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2 flex-wrap">
          <button onClick={() => setCurrentPage(1)} disabled={safePage <= 1} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">«</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">‹</button>
          {(() => {
            const pages: number[] = [];
            const start = Math.max(1, safePage - 2);
            const end = Math.min(totalPages, safePage + 2);
            if (start > 1) pages.push(1);
            if (start > 2) pages.push(-1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push(-2);
            if (end < totalPages) pages.push(totalPages);
            return pages.map((p, i) =>
              p < 0 ? <span key={`e${i}`} className="px-1 text-sm text-muted">…</span> : (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 text-sm rounded-lg transition-colors cursor-pointer ${safePage === p ? 'bg-primary text-white font-bold' : 'bg-white text-foreground hover:bg-surface'}`}>{p}</button>
              )
            );
          })()}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">»</button>
        </div>
      )}
    </div>
  );
}
