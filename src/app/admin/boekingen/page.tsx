'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Trash2,
  Lock,
  AlertTriangle,
  Tag,
  Plus,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import {
  getBookingCaravan,
  getBookingCamping,
  getStatusColor,
  getPaymentStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  loadCustomData,
  type Booking,
  type Payment,
  type BookingStatus,
} from '@/data/admin';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';

const STATUS_OPTIONS: BookingStatus[] = [
  'NIEUW', 'BEVESTIGD', 'AANBETAALD', 'VOLLEDIG_BETAALD', 'ACTIEF', 'AFGEROND', 'GEANNULEERD',
];

function BookingDetail({ booking, onStatusChange, onNotesChange, onDelete }: {
  booking: Booking;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t, ts, role } = useAdmin();
  const { toast } = useToast();
  const caravan = getBookingCaravan(booking);
  const camping = getBookingCamping(booking);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [newStatus, setNewStatus] = useState(booking.status);
  const [notes, setNotes] = useState(booking.admin_notes || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountPassword, setDiscountPassword] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/payments?bookingId=${booking.id}`)
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .catch((e) => { console.error('Fetch error:', e); })
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
      toast(t('common.saved'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setSaving(false);
  };

  return (
    <div className="bg-surface rounded-2xl p-3 sm:p-5 mt-2 space-y-3 sm:space-y-5">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
          <User className="w-4 h-4" /> {t('bookings.guestDetails')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{booking.guest_name}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
              <Mail className="w-3 h-3" />
              <a href={`mailto:${booking.guest_email}`} className="hover:text-primary-dark">{booking.guest_email}</a>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
              <Phone className="w-3 h-3" />
              <a href={`tel:${booking.guest_phone}`} className="hover:text-primary-dark">{booking.guest_phone}</a>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted">
              <strong>{booking.adults}</strong> {t('bookings.adults')}, <strong>{booking.children}</strong> {t('bookings.children')}
            </p>
            {booking.special_requests && (
              <div className="mt-1 flex items-start gap-1.5">
                <FileText className="w-3 h-3 text-muted mt-0.5 shrink-0" />
                <p className="text-xs text-muted italic">{booking.special_requests}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> {t('bookings.stay')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <CarFront className="w-4 h-4 text-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{caravan?.name || booking.caravan_id}</p>
              <p className="text-xs text-muted">{caravan?.reference}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{camping?.name || booking.camping_id}</p>
              <p className="text-xs text-muted">{camping?.location}</p>
              {booking.spot_number && (
                <p className="text-xs font-semibold text-primary mt-0.5">📍 {t('bookings.spotNumber')}: {booking.spot_number}</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 text-xs text-muted">
          <p className="flex flex-wrap gap-x-2 gap-y-0.5">
            <strong>{t('bookings.checkIn')}:</strong> {formatDate(booking.check_in)} &nbsp;|&nbsp;
            <strong>{t('bookings.checkOut')}:</strong> {formatDate(booking.check_out)} &nbsp;|&nbsp;
            <strong>{t('bookings.nightsLabel')}:</strong> {booking.nights}
            {booking.spot_number && (<>&nbsp;|&nbsp; <strong>{t('bookings.spotNumber')}:</strong> <span className="text-primary font-semibold">{booking.spot_number}</span></>)}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> {t('bookings.financial')}
        </h4>
        <div className="bg-white rounded-xl p-3 sm:p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t('bookings.totalPrice')}</span>
            <span className="font-semibold text-foreground">{formatCurrency(Number(booking.total_price))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t('bookings.deposit30')}</span>
            <span className="text-foreground">{formatCurrency(Number(booking.deposit_amount))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t('bookings.remainingAmount')}</span>
            <span className="text-foreground">{formatCurrency(Number(booking.remaining_amount))}</span>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-muted">{t('bookings.securityDeposit')}</span>
            <span className="text-foreground">{formatCurrency(Number(booking.borg_amount))}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t('bookings.paymentsTitle')}</h4>
        {loadingPayments ? (
          <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted">{t('bookings.noPayments')}</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{p.type.replace('_', ' ')} &ndash; {formatCurrency(Number(p.amount))}</p>
                  <p className="text-xs text-muted">
                    {p.method === 'ideal' ? 'iDEAL/Wero' : p.method === 'stripe' ? 'iDEAL/Wero' : p.method === 'bank' ? t('common.bank') : t('common.cash')}
                    {p.stripe_id && ` (${p.stripe_id})`}
                  </p>
                  {p.paid_at && <p className="text-xs text-primary">{t('bookings.paidOn', { date: formatDateTime(p.paid_at) })}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(p.status)}`}>{ts(p.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">{t('bookings.changeStatus')}</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
            className="w-full px-3 py-2 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">{role === 'admin' ? t('bookings.adminNotes') : t('bookings.staffNotes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-white rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-dark"
            placeholder={t('bookings.notesPlaceholder')}
          />
        </div>
      </div>

      {/* Discount section */}
      <div>
        <button
          onClick={() => { setShowDiscount(!showDiscount); setDiscountError(''); setDiscountSuccess(false); }}
          className="flex items-center gap-2 text-sm font-medium text-primary cursor-pointer"
        >
          <Tag className="w-4 h-4" />
          {showDiscount ? t('bookings.cancelDiscount') : t('bookings.applyDiscount')}
        </button>
        {showDiscount && (
          <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 space-y-3">
            {discountSuccess ? (
              <div className="text-sm text-primary font-medium">{t('bookings.discountApplied')}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">{t('bookings.discountAmount')}</label>
                    <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="50"
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">{t('bookings.discountReason')}</label>
                    <input type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="ADMIN"
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> {t('auth.password')}</label>
                    <input type="password" value={discountPassword} onChange={e => setDiscountPassword(e.target.value)} placeholder={t('dashboard.adminPassword')}
                      className="w-full px-3 py-2 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                {discountError && <p className="text-xs text-red-500">{discountError}</p>}
                <button
                  onClick={async () => {
                    if (!discountAmount || !discountPassword) { setDiscountError(t('bookings.fillAllFields')); return; }
                    setDiscountSaving(true); setDiscountError('');
                    try {
                      const res = await fetch('/api/admin/discount-codes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          password: discountPassword,
                          action: 'applyToBooking',
                          bookingId: booking.id,
                          discountCode: discountCode || 'ADMIN',
                          discountAmount: parseFloat(discountAmount),
                        }),
                      });
                      if (res.status === 403) { setDiscountError(t('bookings.wrongPassword')); setDiscountSaving(false); return; }
                      if (!res.ok) { setDiscountError(t('bookings.discountFailed')); setDiscountSaving(false); return; }
                      setDiscountSuccess(true);
                      // Refresh payments
                      fetch(`/api/payments?bookingId=${booking.id}`).then(r => r.json()).then(d => setPayments(d.payments || [])).catch((e) => console.error('Fetch error:', e));
                    } catch {
                      setDiscountError(t('common.error'));
                    }
                    setDiscountSaving(false);
                  }}
                  disabled={discountSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {discountSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  {t('bookings.applyDiscountBtn')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {(newStatus !== booking.status || notes !== (booking.admin_notes || '')) && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-xl text-sm font-medium hover:bg-[#1E40AF] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save')}
          </button>
        )}
        {role === 'admin' && (<button
          onClick={() => { setShowDeleteConfirm(true); setDeletePassword(''); setDeleteError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          {t('bookings.deleteBooking')}
        </button>)}
      </div>

      {showDeleteConfirm && (
        <div className="bg-red-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-semibold">{t('bookings.deleteConfirm')}</p>
          </div>
          <p className="text-xs text-red-600">
            {t('bookings.deleteWarning')}
          </p>
          {deleteError && (
            <p className="text-xs text-red-700 bg-red-100 px-3 py-1.5 rounded-lg">{deleteError}</p>
          )}
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t('dashboard.adminPassword')}
              className="flex-1 px-3 py-2 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!deletePassword) { setDeleteError(t('bookings.enterPassword')); return; }
                setDeleting(true);
                setDeleteError('');
                try {
                  const res = await fetch('/api/bookings', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: booking.id, password: deletePassword }),
                  });
                  if (res.status === 403) { setDeleteError(t('bookings.wrongPassword')); setDeleting(false); return; }
                  if (!res.ok) { setDeleteError(t('bookings.deleteFailed')); setDeleting(false); return; }
                  onDelete(booking.id);
                } catch {
                  setDeleteError(t('common.error'));
                }
                setDeleting(false);
              }}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {t('bookings.permanentDelete')}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingenPage() {
  const { t, ts, dateLocale } = useAdmin();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALLE'>('ALLE');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [allCampings, setAllCampings] = useState(staticCampings.map(c => ({ ...c, active: true })));
  const [createSuccess, setCreateSuccess] = useState<{ reference: string; paymentUrl: string; isNewAccount: boolean } | null>(null);

  // Create form state
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCaravanId, setCCaravanId] = useState('');
  const [cCampingId, setCCampingId] = useState('');
  const [cCheckIn, setCCheckIn] = useState('');
  const [cCheckOut, setCCheckOut] = useState('');
  const [cAdults, setCAdults] = useState(2);
  const [cChildren, setCChildren] = useState(0);
  const [cSpot, setCSpot] = useState('');
  const [cRequests, setCRequests] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [campingSearch, setCampingSearch] = useState('');
  const [campingDropdownOpen, setCampingDropdownOpen] = useState(false);
  const campingDropdownRef = useRef<HTMLDivElement>(null);

  // Close create modal on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreate) setShowCreate(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [showCreate]);

  const fetchBookings = useCallback(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => setBookings(data.bookings || []))
      .catch((e) => { console.error('Fetch error:', e); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCustomData(); fetchBookings();
    // Load caravans + campings for create form
    fetch('/api/admin/caravans').then(r => r.json()).then(d => setCustomCaravans(d.caravans || [])).catch((e) => console.error('Fetch error:', e));
    fetch('/api/campings').then(r => r.json()).then(d => { if (d.campings?.length) setAllCampings(d.campings); }).catch((e) => console.error('Fetch error:', e));

    // Close camping dropdown on outside click
    const handleClick = (e: MouseEvent) => {
      if (campingDropdownRef.current && !campingDropdownRef.current.contains(e.target as Node)) {
        setCampingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [fetchBookings]);

  const handleStatusChange = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleNotesChange = (id: string, adminNotes: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, admin_notes: adminNotes } : b));
  };

  const handleDelete = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setExpandedId(null);
  };

  // Create booking helpers – deduplicate: custom overrides static by id
  const allCaravans: Caravan[] = (() => {
    const map = new Map<string, Caravan>();
    for (const c of staticCaravans) map.set(c.id, c);
    for (const c of customCaravans) map.set(c.id, c);
    return Array.from(map.values());
  })();
  const selectedCaravan = cCaravanId ? allCaravans.find(c => c.id === cCaravanId) : null;
  const cNights = (() => {
    if (!cCheckIn || !cCheckOut) return 0;
    const d = Math.round((new Date(cCheckOut).getTime() - new Date(cCheckIn).getTime()) / 86400000);
    return d > 0 ? d : 0;
  })();
  const cTotalPrice = selectedCaravan && cNights > 0
    ? Math.floor(cNights / 7) * selectedCaravan.pricePerWeek + (cNights % 7) * selectedCaravan.pricePerDay
    : 0;
  const cBorgAmount = selectedCaravan?.deposit || 0;

  const handleCreate = async () => {
    if (!cName || !cEmail || !cPhone || !cCaravanId || !cCampingId || !cCheckIn || !cCheckOut || cNights <= 0) {
      setCreateError(t('bookings.createMissingFields'));
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: cName, guestEmail: cEmail, guestPhone: cPhone,
          caravanId: cCaravanId, campingId: cCampingId,
          checkIn: cCheckIn, checkOut: cCheckOut, nights: cNights,
          totalPrice: cTotalPrice, borgAmount: cBorgAmount,
          adults: cAdults, children: cChildren,
          spotNumber: cSpot || undefined, specialRequests: cRequests || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || t('common.error')); setCreating(false); return; }
      setCreateSuccess({ reference: data.reference, paymentUrl: data.paymentUrl, isNewAccount: data.isNewAccount });
      fetchBookings();
    } catch {
      setCreateError(t('common.error'));
    }
    setCreating(false);
  };

  const resetCreateForm = () => {
    setShowCreate(false);
    setCreateSuccess(null);
    setCName(''); setCEmail(''); setCPhone(''); setCCaravanId(''); setCCampingId('');
    setCCheckIn(''); setCCheckOut(''); setCAdults(2); setCChildren(0);
    setCSpot(''); setCRequests(''); setCreateError('');
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
        <Loader2 className="w-8 h-8 animate-spin text-primary-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('bookings.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALLE')}
            className="pl-10 pr-8 py-2.5 bg-white rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="ALLE">{t('status.allStatuses')}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary-dark/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('bookings.createNew')}
        </button>
      </div>

      {/* ===== CREATE BOOKING MODAL ===== */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-foreground">{t('bookings.createTitle')}</h2>
              <button onClick={resetCreateForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccess ? (
              <div className="p-6 space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{t('bookings.createSuccessTitle')}</h3>
                  <p className="text-sm text-muted">{t('bookings.createSuccessDesc')}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">{t('bookings.reference')}</span>
                    <span className="text-sm font-bold text-foreground">{createSuccess.reference}</span>
                  </div>
                  {createSuccess.isNewAccount && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {t('bookings.accountCreated')}
                    </div>
                  )}
                  {createSuccess.paymentUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted font-semibold uppercase">{t('bookings.paymentLink')}</p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={createSuccess.paymentUrl}
                          className="flex-1 text-xs bg-white border rounded-lg px-3 py-2 truncate"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(createSuccess.paymentUrl)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-muted"
                          title="Kopiëren"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={createSuccess.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-100 text-muted"
                          title="Openen"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">{t('bookings.emailSentNote')}</p>
                </div>

                <button onClick={resetCreateForm} className="w-full py-3 bg-primary-dark text-white rounded-xl font-semibold text-sm hover:bg-primary-dark/90 transition-colors">
                  {t('bookings.close')}
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Guest details */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><User className="w-4 h-4 text-primary-dark" />{t('bookings.guestDetails')}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={cName} onChange={e => setCName(e.target.value)} placeholder={t('bookings.namePlaceholder')} className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark" />
                    <input value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder={t('bookings.emailPlaceholder')} type="email" className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark" />
                    <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder={t('bookings.phonePlaceholder')} type="tel" className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark" />
                  </div>
                </div>

                {/* Caravan & Camping */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><CarFront className="w-4 h-4 text-primary-dark" />{t('bookings.caravanCamping')}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <select value={cCaravanId} onChange={e => setCCaravanId(e.target.value)} className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark appearance-none">
                      <option value="">{t('bookings.selectCaravan')}</option>
                      {allCaravans.map(c => <option key={c.id} value={c.id}>{c.name} — {c.maxPersons}p — €{c.pricePerWeek}/wk</option>)}
                    </select>
                    <div className="relative" ref={campingDropdownRef}>
                      <input
                        type="text"
                        value={campingSearch}
                        onChange={e => { setCampingSearch(e.target.value); setCampingDropdownOpen(true); }}
                        onFocus={() => setCampingDropdownOpen(true)}
                        placeholder={cCampingId ? allCampings.find(c => c.id === cCampingId)?.name || t('bookings.selectCamping') : t('bookings.selectCamping')}
                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
                      />
                      {cCampingId && !campingSearch && (
                        <button onClick={() => { setCCampingId(''); setCampingSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">&times;</button>
                      )}
                      {campingDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                          {allCampings.filter(c => c.active !== false).filter(c => {
                            if (!campingSearch) return true;
                            const q = campingSearch.toLowerCase();
                            return c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
                          }).map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setCCampingId(c.id); setCampingSearch(''); setCampingDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/10 cursor-pointer ${cCampingId === c.id ? 'bg-primary/5 font-medium' : ''}`}
                            >
                              {c.name} — {c.location}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input value={cSpot} onChange={e => setCSpot(e.target.value)} placeholder={t('bookings.spotPlaceholder')} className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark" />
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-dark" />{t('bookings.dates')}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted mb-1 block">{t('bookings.checkIn')}</label>
                      <input type="date" value={cCheckIn} onChange={e => setCCheckIn(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark" />
                    </div>
                    <div>
                      <label className="text-xs text-muted mb-1 block">{t('bookings.checkOut')}</label>
                      <input type="date" value={cCheckOut} onChange={e => setCCheckOut(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark" />
                    </div>
                  </div>
                  {cNights > 0 && <p className="text-xs text-muted mt-2">{cNights} {cNights === 1 ? 'nacht' : 'nachten'}</p>}
                </div>

                {/* Travelers */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><User className="w-4 h-4 text-primary-dark" />{t('bookings.travelers')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted mb-1 block">{t('bookings.adults')}</label>
                      <select value={cAdults} onChange={e => setCAdults(Number(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark appearance-none">
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted mb-1 block">{t('bookings.children')}</label>
                      <select value={cChildren} onChange={e => setCChildren(Number(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark appearance-none">
                        {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Special requests */}
                <div>
                  <label className="text-xs text-muted mb-1 block">{t('bookings.specialRequests')}</label>
                  <textarea value={cRequests} onChange={e => setCRequests(e.target.value)} rows={2} placeholder={t('bookings.requestsPlaceholder')} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none" />
                </div>

                {/* Price summary */}
                {cTotalPrice > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">{t('bookings.totalPrice')}</span>
                      <span className="text-lg font-bold text-foreground">{formatCurrency(cTotalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">{t('bookings.borgLabel')}</span>
                      <span className="text-sm text-muted">{formatCurrency(cBorgAmount)}</span>
                    </div>
                    <p className="text-xs text-muted pt-1 border-t border-gray-200">{t('bookings.autoCalcNote')}</p>
                  </div>
                )}

                {/* Error */}
                {createError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {createError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={resetCreateForm} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-muted hover:bg-gray-50 transition-colors">
                    {t('bookings.cancel')}
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !cName || !cEmail || !cPhone || !cCaravanId || !cCampingId || !cCheckIn || !cCheckOut || cNights <= 0}
                    className="flex-1 py-3 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary-dark/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creating ? t('bookings.creating') : t('bookings.createBooking')}
                  </button>
                </div>

                <p className="text-xs text-muted text-center">{t('bookings.createInfoNote')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        {filtered.length} {t('bookings.bookingsFound', { count: String(filtered.length), s: filtered.length !== 1 ? 'en' : '' })}
      </p>

      <div className="space-y-1.5 sm:space-y-2">
        {filtered.map((booking) => {
          const caravan = getBookingCaravan(booking);
          const camping = getBookingCamping(booking);
          const isExpanded = expandedId === booking.id;

          return (
            <div key={booking.id} className="bg-white rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                className="w-full px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-2 sm:gap-4 text-left hover:bg-surface transition-colors cursor-pointer"
              >
                <div className="text-center bg-surface rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 shrink-0 hidden sm:block">
                  <p className="text-lg font-bold text-primary-dark">
                    {new Date(booking.check_in).getDate()}
                  </p>
                  <p className="text-xs text-muted uppercase">
                    {new Date(booking.check_in).toLocaleDateString(dateLocale, { month: 'short' })}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{booking.guest_name}</p>
                    <span className="text-xs text-muted">{booking.reference}</span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {caravan?.name} → {camping?.name}{booking.spot_number ? ` (${booking.spot_number})` : ''} &nbsp;|&nbsp; {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(booking.total_price))}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(booking.status)}`}
                  >
                    {ts(booking.status)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 sm:px-5 sm:pb-5">
                  <BookingDetail
                    booking={booking}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-lg">{t('bookings.noBookings')}</p>
            <p className="text-sm mt-1">{t('bookings.adjustSearch')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
