'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowUpDown,
  Loader2,
  Download,
  RefreshCw,
  Send,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import { usePageActions } from '@/app/admin/layout';
import { holdedProformaAppUrl } from '@/lib/holded-urls';
import {
  formatDateTime,
  formatCurrency,
  type Payment,
  type PaymentStatus,
  type PaymentType,
} from '@/data/admin';

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['OPENSTAAND', 'BETAALD', 'TERUGBETAALD', 'MISLUKT'];
const PAYMENT_TYPE_OPTIONS: PaymentType[] = ['AANBETALING', 'RESTBETALING', 'HUUR', 'BORG', 'BORG_RETOUR'];

// Big visual badge — same color set as /admin/boekingen list view.
function paymentStatusBadge(status: PaymentStatus): { label: string; cls: string } {
  switch (status) {
    case 'BETAALD':
      return { label: '🟢 Betaald', cls: 'bg-green-50 text-green-700 border-green-200' };
    case 'OPENSTAAND':
      return { label: '🟡 Wacht op betaling', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    case 'MISLUKT':
      return { label: '🔴 Mislukt', cls: 'bg-red-50 text-red-700 border-red-200' };
    case 'TERUGBETAALD':
      return { label: '🔵 Terugbetaald', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    default:
      return { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
  }
}

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
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundConfirm, setRefundConfirm] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [markPaidConfirm, setMarkPaidConfirm] = useState<string | null>(null);
  // Anchor coords for the floating mark-menu (fixed-positioned so it
  // escapes the parent's overflow:hidden).
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);

  // Close menu on viewport scroll/resize so it doesn't drift away from its trigger.
  useEffect(() => {
    if (!markPaidConfirm) return;
    const close = () => { setMarkPaidConfirm(null); setMenuAnchor(null); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [markPaidConfirm]);

  const openMarkMenu = (e: React.MouseEvent<HTMLButtonElement>, paymentId: string) => {
    if (markPaidConfirm === paymentId) {
      setMarkPaidConfirm(null);
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMarkPaidConfirm(paymentId);
  };

  const fetchPayments = useCallback(() => {
    setLoading(true);
    fetch('/api/payments')
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .catch((e) => console.error('Fetch error:', e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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

  // Booking-level mark actions. The dropdown on each row lets admin pick
  // which milestone to register: deposit received / fully paid / borg
  // received / borg returned. All are idempotent on the server.
  type MarkAction = 'mark-deposit' | 'mark-fully-paid' | 'mark-borg-paid' | 'mark-borg-returned';

  const handleMarkAction = async (paymentId: string, bookingId: string, action: MarkAction) => {
    setMarkingPaid(paymentId);
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh full list so newly created payment-rows + status changes
        // for sibling payments of this booking show up.
        fetchPayments();
        const labels: Record<MarkAction, string> = {
          'mark-deposit': 'Aanbetaling op groen gezet',
          'mark-fully-paid': 'Boeking volledig betaald gemarkeerd',
          'mark-borg-paid': 'Borg op groen gezet',
          'mark-borg-returned': 'Borg-retour geregistreerd',
        };
        toast(labels[action], 'success');
      } else {
        toast(data?.error || t('common.actionFailed'), 'error');
      }
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setMarkingPaid(null);
    setMarkPaidConfirm(null);
    setMenuAnchor(null);
  };

  const handleSendReminder = async (paymentId: string) => {
    setSendingReminder(paymentId);
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, action: 'send-reminder' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, reminder_sent_at: data.reminderSentAt } : p));
        toast(t('payments.reminderSent'), 'success');
      } else { toast(t('common.actionFailed'), 'error'); }
    } catch { toast(t('common.actionFailed'), 'error'); }
    setSendingReminder(null);
  };

  const filtered = useMemo(() => payments
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
          (p.stripe_id && p.stripe_id.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [payments, statusFilter, typeFilter, dateFrom, dateTo, search]);

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

  const handleExportCsv = useCallback(() => {
    const headers = ['Gast', 'Boeking', 'Type', 'Bedrag', 'Status', 'Methode', 'Datum', 'Holded'];
    const rows = filtered.map(p => [
      p.guest_name || '', p.booking_ref || '', ts(p.type),
      Number(p.amount).toFixed(2), ts(p.status), p.method || '',
      new Date(p.created_at).toLocaleDateString('nl-NL'),
      p.holded_status === 'HANDMATIG' || p.holded_status === 'IN_HOLDED' ? 'Ja' : 'Nee',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `betalingen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, ts]);

  /* Register title-bar actions */
  usePageActions(
    useMemo(() => (
      <>
        <button onClick={fetchPayments} className="p-2 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={handleExportCsv} className="p-2 bg-white rounded-xl text-muted hover:text-foreground transition-colors cursor-pointer" title={t('payments.exportCsv')}>
          <Download className="w-4 h-4" />
        </button>
      </>
    ), [fetchPayments, handleExportCsv, t])
  );

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

      {/* Filters — compact single row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('payments.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>
        <div className="relative hidden sm:block">
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
        <div className="relative hidden sm:block">
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
        <div className="relative shrink-0">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title={t('payments.dateFrom')}
            className="w-10 sm:w-auto pl-9 pr-1 sm:pr-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark text-transparent sm:text-muted [&:not(:placeholder-shown)]:sm:text-foreground cursor-pointer"
          />
        </div>
        <div className="relative shrink-0">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title={t('payments.dateTo')}
            className="w-10 sm:w-auto pl-9 pr-1 sm:pr-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark text-transparent sm:text-muted [&:not(:placeholder-shown)]:sm:text-foreground cursor-pointer"
          />
        </div>
      </div>

      {/* Mobile filters */}
      <div className="flex sm:hidden gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALLE')}
          className="flex-1 px-3 py-2.5 bg-white rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="ALLE">{t('status.allStatuses')}</option>
          {PAYMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{ts(s)}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PaymentType | 'ALLE')}
          className="flex-1 px-3 py-2.5 bg-white rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="ALLE">{t('status.allTypes')}</option>
          {PAYMENT_TYPE_OPTIONS.map((t2) => (
            <option key={t2} value={t2}>{ts(t2)}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted">
        {t('payments.paymentsFound', { count: String(filtered.length), s: filtered.length !== 1 ? 'en' : '' })} </p> {/* Payments list */} <div className="bg-white rounded-2xl overflow-hidden"> <div className="hidden md:grid grid-cols-12 gap-4 px-3 sm:px-5 py-2 sm:py-3 bg-surface text-xs font-semibold text-muted uppercase tracking-wider"> <div className="col-span-3">{t('payments.guestBooking')}</div> <div className="col-span-2">{t('payments.type')}</div> <div className="col-span-2">{t('payments.amount')}</div> <div className="col-span-3">{t('payments.status')}</div> <div className="col-span-1">{t('payments.date')}</div> <div className="col-span-1"></div> </div> <div className=""> {paginated.map((payment) => ( <div key={payment.id} className="border-b border-gray-50 last:border-0">
              <div className="px-3 py-3 sm:px-5 sm:py-4 md:grid md:grid-cols-12 md:gap-4 md:items-center space-y-1.5 md:space-y-0 hover:bg-surface transition-colors">
                <div className="col-span-3">
                  <p className="text-sm font-medium text-foreground">{payment.guest_name}</p>
                  <p className="text-xs text-muted">{payment.booking_ref}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-foreground">{ts(payment.type)}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(Number(payment.amount))}
                  </span>
                </div>

                <div className="col-span-3 flex items-center gap-2 flex-wrap">
                  {(() => {
                    const badge = paymentStatusBadge(payment.status);
                    return (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  {payment.holded_invoice_id && (
                    <a
                      href={payment.holded_invoice_id.startsWith('http')
                        ? payment.holded_invoice_id
                        : holdedProformaAppUrl(payment.holded_invoice_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                      title="Open in Holded"
                    >
                      <ExternalLink size={10} /> Holded
                    </a>
                  )}
                </div>

                <div className="col-span-1">
                  <p className="text-xs text-muted">{formatDateTime(payment.created_at)}</p>
                  {payment.paid_at && (
                    <p className="text-xs text-green-600">✓ {formatDateTime(payment.paid_at)}</p>
                  )}
                </div>

                <div className="col-span-1 flex items-center justify-end gap-1.5">
                  {payment.status === 'OPENSTAAND' && (
                    <button
                      onClick={() => handleSendReminder(payment.id)}
                      disabled={sendingReminder === payment.id}
                      className="inline-flex items-center gap-1 text-[10px] text-white bg-amber-600 hover:bg-amber-700 px-2 py-1 rounded-lg disabled:opacity-50 cursor-pointer"
                      title={t('payments.sendReminder')}
                      aria-label={t('payments.sendReminder')}
                    >
                      {sendingReminder === payment.id ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                    </button>
                  )}
                  {/* Mark-status menu — werkt op booking-niveau, dus altijd
                      zichtbaar (ongeacht de status van deze payment-row). */}
                  <button
                    onClick={(e) => openMarkMenu(e, payment.id)}
                    disabled={markingPaid === payment.id}
                    className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg cursor-pointer disabled:opacity-50"
                    title="Markeer status"
                    aria-haspopup="menu"
                    aria-expanded={markPaidConfirm === payment.id}
                  >
                    {markingPaid === payment.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                    <span>Markeer</span>
                  </button>
                  {payment.status === 'BETAALD' && (
                    refundConfirm === payment.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRefund(payment.id)}
                          disabled={refundingId === payment.id}
                          className="text-[10px] text-red-700 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {refundingId === payment.id ? '...' : 'OK'}
                        </button>
                        <button
                          onClick={() => setRefundConfirm(null)}
                          className="text-[10px] text-muted px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRefundConfirm(payment.id)}
                        className="text-[10px] text-red-600 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded-lg cursor-pointer"
                      >
                        Refund
                      </button>
                    )
                  )}
                </div>
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

      {/* Floating mark-menu — fixed-positioned so it escapes any parent
          overflow:hidden / clipping. Anchored under the trigger button. */}
      {markPaidConfirm && menuAnchor && (() => {
        const target = payments.find(p => p.id === markPaidConfirm);
        if (!target) return null;
        return (
          <>
            <button
              aria-label="Sluit menu"
              onClick={() => { setMarkPaidConfirm(null); setMenuAnchor(null); }}
              className="fixed inset-0 z-40 cursor-default"
              tabIndex={-1}
            />
            <div
              role="menu"
              style={{ position: 'fixed', top: menuAnchor.top, right: menuAnchor.right }}
              className="z-50 bg-white rounded-lg shadow-xl ring-1 ring-black/5 py-1 min-w-[200px] text-left"
            >
              <button role="menuitem" onClick={() => handleMarkAction(target.id, target.booking_id, 'mark-deposit')} className="w-full text-left px-3 py-2 text-xs hover:bg-green-50 text-green-700 flex items-center gap-2">
                <CheckCircle2 size={12} /> Aanbetaling ontvangen
              </button>
              <button role="menuitem" onClick={() => handleMarkAction(target.id, target.booking_id, 'mark-fully-paid')} className="w-full text-left px-3 py-2 text-xs hover:bg-green-50 text-green-700 flex items-center gap-2">
                <CheckCircle2 size={12} /> Volledig betaald
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button role="menuitem" onClick={() => handleMarkAction(target.id, target.booking_id, 'mark-borg-paid')} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-blue-700 flex items-center gap-2">
                <CheckCircle2 size={12} /> Borg ontvangen
              </button>
              <button role="menuitem" onClick={() => handleMarkAction(target.id, target.booking_id, 'mark-borg-returned')} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-blue-700 flex items-center gap-2">
                <CheckCircle2 size={12} /> Borg retour gedaan
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
