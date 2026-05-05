'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Info,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import { usePageActions } from '@/app/admin/layout';
import { useLastActivity, LastEditedBadge } from '@/components/LastEditedBy';
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
import { holdedProformaAppUrl } from '@/lib/holded-urls';
import { useUrlState } from '@/lib/use-url-state';

const STATUS_OPTIONS: BookingStatus[] = [
  'NIEUW', 'BEVESTIGD', 'AANBETAALD', 'VOLLEDIG_BETAALD', 'ACTIEF', 'AFGEROND', 'GEANNULEERD',
];

function SectionToggle({ icon, label, sectionKey, openSection, toggle, children }: {
  icon: React.ReactNode;
  label: string;
  sectionKey: string;
  openSection: string | null;
  toggle: (key: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = openSection === sectionKey;
  return (
    <div className="border-t border-gray-100">
      <button onClick={() => toggle(sectionKey)} className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 text-left hover:bg-gray-50/50 transition-colors cursor-pointer">
        <span className="text-muted">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted flex-1">{label}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
      </button>
      {isOpen && <div className="px-3 sm:px-4 pb-3">{children}</div>}
    </div>
  );
}

function BookingDetail({ booking, onStatusChange, onNotesChange, onDelete, allCaravans, onCaravanChange }: {
  booking: Booking;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
  allCaravans: Caravan[];
  onCaravanChange: (id: string, caravanId: string | null) => void;
}) {
  const { t, ts, role } = useAdmin();
  const { toast } = useToast();
  const caravan = getBookingCaravan(booking);
  const camping = getBookingCamping(booking);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [newStatus, setNewStatus] = useState(booking.status);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
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
  const [depositConfirming, setDepositConfirming] = useState(false);
  const [selectedCaravanId, setSelectedCaravanId] = useState<string>(booking.caravan_id || '');
  const [caravanSaving, setCaravanSaving] = useState(false);
  const [borgReturnMethod, setBorgReturnMethod] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Extras management state
  const [showExtras, setShowExtras] = useState(false);
  const [extraBedlinnen, setExtraBedlinnen] = useState(false);
  const [extraFridge, setExtraFridge] = useState(false);
  const [extraAirco, setExtraAirco] = useState(false);
  const [extraBikes, setExtraBikes] = useState(0);
  const [extraMountainbikes, setExtraMountainbikes] = useState(0);
  const [savingExtras, setSavingExtras] = useState(false);
  const [extrasSuccess, setExtrasSuccess] = useState(false);

  // Collapsible sections
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = (key: string) => setOpenSection(prev => prev === key ? null : key);

  // Email history (Resend) + Holded re-send
  const [emails, setEmails] = useState<Array<{ id: string; to: string[]; from: string; subject: string; createdAt: string; status: string; forThisBooking?: boolean }>>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [sendingHolded, setSendingHolded] = useState(false);
  const fetchEmails = useCallback(async () => {
    setLoadingEmails(true);
    try {
      const res = await fetch(`/api/admin/emails?bookingId=${booking.id}`);
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setLoadingEmails(false);
    }
  }, [booking.id]);
  // Load email history once on mount so the "payment-link mail sent" badge in the deposit block
  // is correct without requiring the user to open the emails section first.
  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const handleSendHoldedInvoice = useCallback(async (paymentId: string) => {
    if (!confirm('Holded pro forma handmatig aanmaken? (Wordt niet naar de klant gemaild — alleen voor onze administratie.)')) return;
    setSendingHolded(true);
    try {
      const res = await fetch('/api/admin/holded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onbekende fout');
      toast('Holded pro forma aangemaakt', 'success');
      // Refresh payments + emails
      const pRes = await fetch(`/api/payments?bookingId=${booking.id}`);
      const pData = await pRes.json();
      setPayments(pData.payments || []);
      fetchEmails();
    } catch (err) {
      toast(`Mislukt: ${err instanceof Error ? err.message : err}`, 'error');
    } finally {
      setSendingHolded(false);
    }
  }, [booking.id, toast, fetchEmails]);

  const depositAlreadyPaid = payments.some(p => p.type === 'AANBETALING' && p.status === 'BETAALD');

  // Direct status-mutatie via klik op de status-badge. Idempotent — geen
  // payment-records aangemaakt; dat hoort bij /admin/betalingen Markeer-acties.
  // Voor de meeste gevallen is dit alleen een correctie/sync van een status.
  const handleQuickStatusChange = async (next: BookingStatus) => {
    if (next === booking.status) { setStatusMenuOpen(false); return; }
    setStatusUpdating(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, status: next }),
      });
      if (!res.ok) { toast(t('common.actionFailed'), 'error'); return; }
      onStatusChange(booking.id, next);
      setNewStatus(next);
      toast(t('common.saved'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setStatusUpdating(false);
      setStatusMenuOpen(false);
    }
  };

  const handleConfirmDeposit = async () => {
    setDepositConfirming(true);
    try {
      // Create a paid payment record for the deposit
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          type: 'AANBETALING',
          amount: Number(booking.deposit_amount),
          status: 'BETAALD',
          method: 'bank',
        }),
      });
      if (!res.ok) { toast(t('bookings.depositFailed'), 'error'); setDepositConfirming(false); return; }
      // Update booking status to AANBETAALD
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, status: 'AANBETAALD' }),
      });
      onStatusChange(booking.id, 'AANBETAALD');
      setNewStatus('AANBETAALD');
      // Refresh payments
      const pRes = await fetch(`/api/payments?bookingId=${booking.id}`);
      const pData = await pRes.json();
      setPayments(pData.payments || []);
      toast(t('bookings.depositConfirmed'), 'success');
    } catch {
      toast(t('bookings.depositFailed'), 'error');
    }
    setDepositConfirming(false);
  };

  const handleCheckPaymentStatus = async () => {
    setCheckingPayment(true);
    try {
      const pRes = await fetch(`/api/payments?bookingId=${booking.id}`);
      const pData = await pRes.json();
      setPayments(pData.payments || []);
      const depositPaid = (pData.payments || []).some((p: Payment) => p.type === 'AANBETALING' && p.status === 'BETAALD');
      if (depositPaid) {
        toast(t('bookings.paymentReceived'), 'success');
        onStatusChange(booking.id, 'AANBETAALD');
        setNewStatus('AANBETAALD');
      } else {
        toast(t('bookings.paymentNotYetReceived'), 'info');
      }
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setCheckingPayment(false);
  };

  useEffect(() => {
    fetch(`/api/payments?bookingId=${booking.id}`)
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments || []);
      })
      .catch((e) => { console.error('Fetch error:', e); })
      .finally(() => setLoadingPayments(false));
    fetch(`/api/borg?booking_id=${booking.id}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.checklists || []);
        const uitcheck = list.find((c: { type: string }) => c.type === 'UITCHECKEN');
        if (uitcheck?.borg_return_method) setBorgReturnMethod(uitcheck.borg_return_method);
      })
      .catch(() => {});
  }, [booking.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Status wordt niet meer hier opgeslagen — alleen via Markeer-acties
      // op /admin/betalingen. Save-knop is alleen voor notes-changes.
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
    <div className="bg-surface rounded-2xl mt-2 overflow-hidden">
      {/* ── Compact Summary (always visible) ── */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Klikbare status-badge — wijzigt booking.status direct */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('bookings.status') || 'Status'}</span>
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(o => !o)}
              disabled={statusUpdating}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(newStatus)} hover:ring-2 hover:ring-primary/30 cursor-pointer disabled:opacity-50`}
              title="Klik om status te wijzigen"
              aria-haspopup="menu"
              aria-expanded={statusMenuOpen}
            >
              {statusUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
              {ts(newStatus)}
              <ChevronDown className="w-3 h-3" />
            </button>
            {statusMenuOpen && (
              <>
                <button
                  aria-label="Sluit menu"
                  onClick={() => setStatusMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                  tabIndex={-1}
                />
                <div role="menu" className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl ring-1 ring-black/5 py-1 min-w-[180px]">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      role="menuitemradio"
                      aria-checked={newStatus === s}
                      onClick={() => handleQuickStatusChange(s)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50 ${newStatus === s ? 'font-semibold' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(s).split(' ').filter(c => c.startsWith('bg-')).join(' ')}`} />
                      <span className="flex-1">{ts(s)}</span>
                      {newStatus === s && <span className="text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">{booking.guest_name}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <CarFront className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="text-sm text-foreground truncate">{caravan?.name || booking.caravan_id}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="text-sm text-muted truncate">{camping?.name || booking.camping_id}</span>
            {booking.spot_number && <span className="text-xs font-semibold text-primary">#{booking.spot_number}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="text-xs text-muted">{formatDate(booking.check_in)} → {formatDate(booking.check_out)} ({booking.nights}n)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold">{formatCurrency(Number(booking.total_price))}</span>
          <span className="text-muted">|</span>
          <span className="text-muted">{t('bookings.deposit30')}: {formatCurrency(Number(booking.deposit_amount))}</span>
          {depositAlreadyPaid && <span className="text-green-600 font-medium">✓ {t('bookings.depositAlreadyPaid')}</span>}
        </div>
        {booking.special_requests && (
          <div className="flex flex-wrap gap-1">
            {booking.special_requests.split(' | ').filter(Boolean).map((extra, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">📦 {extra}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Accordion Sections ── */}
      {/* GUEST DETAILS */}
      <SectionToggle icon={<User className="w-4 h-4" />} label={t('bookings.guestDetails')} sectionKey="guest" openSection={openSection} toggle={toggleSection}>
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
            {(booking.guest_street || booking.guest_postal_code || booking.guest_city) ? (
              <div className="flex items-start gap-1.5 text-xs text-muted mt-1">
                <MapPin className="w-3 h-3 mt-0.5" />
                <span>
                  {booking.guest_street}
                  {booking.guest_postal_code || booking.guest_city ? <><br />{booking.guest_postal_code} {booking.guest_city}</> : null}
                  {booking.guest_country ? <>, {booking.guest_country}</> : null}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-amber-700 mt-1 italic">⚠️ Adres ontbreekt — wordt opgevraagd bij betaling</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted">
              <strong>{booking.adults}</strong> {t('bookings.adults')}, <strong>{booking.children}</strong> {t('bookings.children')}
            </p>
          </div>
        </div>
      </SectionToggle>

      {/* STAY */}
      <SectionToggle icon={<Calendar className="w-4 h-4" />} label={t('bookings.stay')} sectionKey="stay" openSection={openSection} toggle={toggleSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <CarFront className="w-4 h-4 text-muted mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCaravanId}
                  onChange={(e) => setSelectedCaravanId(e.target.value)}
                  className="text-sm font-medium text-foreground bg-white rounded-lg px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[200px]"
                >
                  <option value="">— Geen caravan —</option>
                  {allCaravans.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.reference || c.id})</option>
                  ))}
                </select>
                {selectedCaravanId !== (booking.caravan_id || '') && (
                  <button
                    onClick={async () => {
                      setCaravanSaving(true);
                      try {
                        const res = await fetch('/api/bookings', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: booking.id, caravanId: selectedCaravanId || null }),
                        });
                        if (!res.ok) { toast(t('common.actionFailed'), 'error'); setCaravanSaving(false); return; }
                        onCaravanChange(booking.id, selectedCaravanId || null);
                        toast(t('common.saved'), 'success');
                      } catch {
                        toast(t('common.actionFailed'), 'error');
                      }
                      setCaravanSaving(false);
                    }}
                    disabled={caravanSaving}
                    className="flex items-center gap-1 px-2 py-1 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {caravanSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Opslaan
                  </button>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">{caravan?.reference}</p>
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
        <div className="bg-white rounded-xl p-3 text-xs text-muted mt-3">
          <p className="flex flex-wrap gap-x-2 gap-y-0.5">
            <strong>{t('bookings.checkIn')}:</strong> {formatDate(booking.check_in)} &nbsp;|&nbsp;
            <strong>{t('bookings.checkOut')}:</strong> {formatDate(booking.check_out)} &nbsp;|&nbsp;
            <strong>{t('bookings.nightsLabel')}:</strong> {booking.nights}
            {booking.spot_number && (<>&nbsp;|&nbsp; <strong>{t('bookings.spotNumber')}:</strong> <span className="text-primary font-semibold">{booking.spot_number}</span></>)}
          </p>
        </div>
      </SectionToggle>

      {/* FINANCIAL */}
      <SectionToggle icon={<CreditCard className="w-4 h-4" />} label={t('bookings.financial')} sectionKey="financial" openSection={openSection} toggle={toggleSection}>
        {/* Payment progress tracker */}
        {!loadingPayments && (() => {
          const depositDone = depositAlreadyPaid || ['AANBETAALD', 'VOLLEDIG_BETAALD', 'ACTIEF', 'AFGEROND'].includes(booking.status);
          const restDone = ['VOLLEDIG_BETAALD', 'ACTIEF', 'AFGEROND'].includes(booking.status);
          const borgDone = payments.some(p => p.type === 'BORG' && p.status === 'BETAALD');
          const borgRetourDone = payments.some(p => p.type === 'BORG_RETOUR');
          const steps = [
            { label: t('bookings.deposit30'), done: depositDone },
            { label: t('bookings.remainingAmount'), done: restDone },
            { label: t('bookings.securityDeposit'), done: borgDone },
            { label: t('bookings.borgReturnLabel'), done: borgRetourDone },
          ];
          return (
            <div className="flex items-center gap-0 mb-3 bg-white rounded-xl p-3 overflow-x-auto">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center min-w-[56px]">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step.done ? '✓' : (i + 1)}
                    </div>
                    <span className={`text-[10px] mt-1 text-center leading-tight ${step.done ? 'text-green-600 font-medium' : 'text-muted'}`}>{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 -mt-4 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          );
        })()}
        <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted">{t('bookings.totalPrice')}</span><span className="font-semibold">{formatCurrency(Number(booking.total_price))}</span></div>
          <div className="flex justify-between"><span className="text-muted">{t('bookings.deposit30')}</span><span>{formatCurrency(Number(booking.deposit_amount))}</span></div>
          <div className="flex justify-between"><span className="text-muted">{t('bookings.remainingAmount')}</span><span>{formatCurrency(Number(booking.remaining_amount))}</span></div>
          {booking.special_requests && (() => {
            const weeks = Math.ceil(booking.nights / 7);
            const extras = booking.special_requests.split(' | ').filter(Boolean);
            if (extras.length === 0) return null;
            const extraPrices: { name: string; cost: number }[] = [];
            for (const extra of extras) {
              const lower = extra.toLowerCase();
              if (lower.includes('bedlinnen')) extraPrices.push({ name: `🛏️ ${extra}`, cost: weeks * 70 });
              else if (lower.includes('koelkast')) extraPrices.push({ name: `🧊 ${extra}`, cost: weeks * 40 });
              else if (lower.includes('airco')) extraPrices.push({ name: `❄️ ${extra}`, cost: weeks * 50 });
              else if (lower.includes('fiets') && !lower.includes('mountain')) {
                const match = extra.match(/(\d+)x/);
                const qty = match ? parseInt(match[1]) : 1;
                extraPrices.push({ name: `🚲 ${extra}`, cost: qty * weeks * 50 });
              } else if (lower.includes('mountainbike')) {
                const match = extra.match(/(\d+)x/);
                const qty = match ? parseInt(match[1]) : 1;
                extraPrices.push({ name: `🚵 ${extra}`, cost: qty * weeks * 50 });
              } else {
                extraPrices.push({ name: `📦 ${extra}`, cost: 0 });
              }
            }
            const totalExtras = extraPrices.reduce((sum, e) => sum + e.cost, 0);
            return (
              <div className="pt-1.5 border-t border-gray-100 space-y-1">
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Extra&apos;s ({weeks}w)</p>
                {extraPrices.map((e, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted">{e.name}</span>
                    {e.cost > 0 && <span className="text-amber-700 font-medium">{formatCurrency(e.cost)}</span>}
                  </div>
                ))}
                {totalExtras > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted">Totaal extra&apos;s</span>
                    <span className="text-amber-700">{formatCurrency(totalExtras)}</span>
                  </div>
                )}
              </div>
            );
          })()}
          <div className="flex justify-between pt-1.5 border-t border-gray-100"><span className="text-muted">{t('bookings.securityDeposit')}</span><span>{formatCurrency(Number(booking.borg_amount))}</span></div>
          {(() => {
            const borgRetour = payments.find(p => p.type === 'BORG_RETOUR');
            if (borgRetour) {
              return (
                <div className="flex justify-between">
                  <span className="text-emerald-600 text-xs font-medium">✅ Borg terug</span>
                  <span className="text-emerald-600 text-xs font-semibold">€{Number(borgRetour.amount).toFixed(0)} {borgReturnMethod ? `(${borgReturnMethod === 'contant' ? '💵' : '🏦'})` : ''}</span>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Deposit payment via Holded */}
        {!loadingPayments && !depositAlreadyPaid && (() => {
          const depositPayment = payments.find(p => p.type === 'AANBETALING');
          const holdedSent = depositPayment?.holded_status === 'IN_HOLDED' && !!depositPayment.holded_invoice_id;
          const invoiceId = depositPayment?.holded_invoice_id;
          const holdedHref = invoiceId
            ? (invoiceId.startsWith('http') ? invoiceId : holdedProformaAppUrl(invoiceId))
            : null;
          const paymentLinkMail = emails.find(e =>
            /betaal|payment|factuur|invoice|aanbetaling|deposit/i.test(e.subject),
          );
          return (
            <div className="mt-3 border border-blue-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b border-blue-200">
                <h5 className="text-xs font-semibold text-blue-900 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Aanbetaling — Holded pro forma</h5>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-blue-100">
                  <span className="text-xs font-medium text-gray-700">{t('bookings.depositAmountToPay')}</span>
                  <span className="text-base font-bold text-blue-700">{formatCurrency(Number(booking.deposit_amount))}</span>
                </div>

                {holdedSent ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-800 rounded-lg px-3 py-2">
                      <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                      <p className="text-xs font-medium flex-1">Pro forma aangemaakt — wachten op betaling</p>
                    </div>
                    {paymentLinkMail && (
                      <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-3 py-1.5 text-[11px]">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">Betaal-mail verstuurd: <strong>{paymentLinkMail.subject}</strong> ({paymentLinkMail.status})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {holdedHref && (
                        <a href={holdedHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50">
                          <ExternalLink className="w-3.5 h-3.5" /> Open in Holded
                        </a>
                      )}
                      {invoiceId && !invoiceId.startsWith('http') && (
                        <a href={`/api/admin/holded/pdf?invoiceId=${invoiceId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50">
                          <FileText className="w-3.5 h-3.5" /> Pro forma PDF
                        </a>
                      )}
                      <button onClick={handleCheckPaymentStatus} disabled={checkingPayment} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 cursor-pointer disabled:opacity-50">
                        {checkingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        {checkingPayment ? t('bookings.checkingStatus') : t('bookings.checkPaymentStatus')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-gray-50 text-gray-700 rounded-lg px-3 py-2 border border-gray-200">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-500" />
                    <p className="text-xs leading-snug">
                      Pro forma wordt automatisch aangemaakt zodra de klant haar adresgegevens invult op de betaalpagina (of na betaling als failsafe). Holded is alleen voor onze administratie — wordt niet naar de klant gemaild.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 py-0.5"><div className="flex-1 h-px bg-gray-200" /><span className="text-[10px] text-gray-400 uppercase">of</span><div className="flex-1 h-px bg-gray-200" /></div>
                <button onClick={handleConfirmDeposit} disabled={depositConfirming} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 cursor-pointer disabled:opacity-50">
                  {depositConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {depositConfirming ? t('bookings.confirmingDeposit') : t('bookings.manualConfirmDeposit')}
                </button>
              </div>
            </div>
          );
        })()}

        {depositAlreadyPaid && (
          <div className="mt-3 flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="text-xs font-semibold">{t('bookings.depositAlreadyPaid')}</p>
          </div>
        )}
      </SectionToggle>

      {/* PAYMENTS */}
      <SectionToggle icon={<FileText className="w-4 h-4" />} label={`${t('bookings.paymentsTitle')} (${payments.length})`} sectionKey="payments" openSection={openSection} toggle={toggleSection}>
        {loadingPayments ? (
          <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted">{t('bookings.noPayments')}</p>
        ) : (
          <div className="space-y-1.5">
            {payments.map((p) => {
              const holdedBadge = p.status === 'BETAALD'
                ? { label: '🟢 Aanbetaling betaald', cls: 'bg-green-50 text-green-700 border-green-200' }
                : p.holded_status === 'IN_HOLDED'
                  ? { label: '🟡 Pro forma via Holded verzonden', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
                  : p.holded_status === 'HANDMATIG'
                    ? { label: '🔵 Handmatig in Holded', cls: 'bg-blue-50 text-blue-700 border-blue-200' }
                    : { label: '⚪ Geen Holded pro forma', cls: 'bg-gray-50 text-gray-600 border-gray-200' };
              return (
                <div key={p.id} className="bg-white rounded-lg p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-xs">{p.type.replace('_', ' ')} &ndash; {formatCurrency(Number(p.amount))}</p>
                      <p className="text-[10px] text-muted">
                        {p.method === 'ideal' || p.method === 'stripe' ? 'Holded' : p.method === 'bank' ? t('common.bank') : t('common.cash')}
                        {p.paid_at && ` • ${formatDateTime(p.paid_at)}`}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getPaymentStatusColor(p.status)}`}>{ts(p.status)}</span>
                  </div>
                  {p.type === 'AANBETALING' && (
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${holdedBadge.cls}`}>{holdedBadge.label}</span>
                      {p.holded_invoice_id && (
                        <a
                          href={p.holded_invoice_id.startsWith('http') ? p.holded_invoice_id : holdedProformaAppUrl(p.holded_invoice_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in Holded
                        </a>
                      )}
                      {p.holded_invoice_id && !p.holded_invoice_id.startsWith('http') && (
                        <a
                          href={`/api/admin/holded/pdf?invoiceId=${p.holded_invoice_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <FileText className="w-3 h-3" /> PDF
                        </a>
                      )}
                      {p.status !== 'BETAALD' && p.holded_status !== 'IN_HOLDED' && (
                        <button
                          onClick={() => handleSendHoldedInvoice(p.id)}
                          disabled={sendingHolded}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-white bg-primary-dark hover:bg-[#1E40AF] px-2 py-0.5 rounded-full disabled:opacity-50 cursor-pointer"
                          title="Failsafe — proforma wordt normaal automatisch aangemaakt"
                        >
                          {sendingHolded ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Pro forma handmatig aanmaken
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionToggle>

      {/* SENT EMAILS (Resend history) */}
      <SectionToggle icon={<Mail className="w-4 h-4" />} label={`Verzonden e-mails${emails.length ? ` (${emails.length})` : ''}`} sectionKey="emails" openSection={openSection} toggle={toggleSection}>
        {loadingEmails ? (
          <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" /> Laden…</div>
        ) : emails.length === 0 ? (
          <p className="text-sm text-muted">Nog geen e-mails verstuurd voor deze boeking.</p>
        ) : (
          <div className="space-y-1.5">
            {emails.map((e) => {
              const statusCls = e.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200'
                : e.status === 'bounced' || e.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200'
                : e.status === 'opened' || e.status === 'clicked' ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-50 text-gray-700 border-gray-200';
              return (
                <div key={e.id} className={`rounded-lg p-2.5 text-sm ${e.forThisBooking ? 'bg-blue-50 border border-blue-200' : 'bg-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-xs truncate">
                        {e.forThisBooking && <span className="inline-block mr-1 text-[9px] font-bold text-blue-700 bg-blue-100 px-1 rounded">DEZE BOEKING</span>}
                        {e.subject}
                      </p>
                      <p className="text-[10px] text-muted truncate">
                        Naar {e.to.join(', ')} • {formatDateTime(e.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusCls} shrink-0`}>{e.status || 'onbekend'}</span>
                  </div>
                </div>
              );
            })}
            <button onClick={fetchEmails} className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
              <RefreshCw className="w-3 h-3" /> Vernieuwen
            </button>
          </div>
        )}
      </SectionToggle>

      {/* NOTES + ACTIONS — status wordt nu geregeld via 'Markeer'-acties op /admin/betalingen */}
      <div className="p-3 sm:p-4 border-t border-gray-100 space-y-3">
        <div>
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">{role === 'admin' ? t('bookings.adminNotes') : t('bookings.staffNotes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-2 py-1.5 bg-white rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-dark" placeholder={t('bookings.notesPlaceholder')} />
        </div>

        {/* Action row: save, discount, extras, delete */}
        <div className="flex items-center gap-2 flex-wrap">
          {notes !== (booking.admin_notes || '') && (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-dark text-white rounded-lg text-xs font-medium hover:bg-[#1E40AF] cursor-pointer disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t('common.save')}
            </button>
          )}
          <button onClick={() => { setShowDiscount(!showDiscount); setDiscountError(''); setDiscountSuccess(false); }} className="flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer px-2 py-1.5 rounded-lg hover:bg-primary/5">
            <Tag className="w-3.5 h-3.5" />
            {t('bookings.applyDiscount')}
          </button>
          <button onClick={() => { setShowExtras(!showExtras); setExtrasSuccess(false); }} className="flex items-center gap-1.5 text-xs font-medium text-amber-700 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-amber-50">
            <Plus className="w-3.5 h-3.5" />
            Extra&apos;s
          </button>
          {role === 'admin' && (
            <button onClick={() => { setShowDeleteConfirm(true); setDeletePassword(''); setDeleteError(''); }} className="flex items-center gap-1.5 px-2 py-1.5 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 cursor-pointer ml-auto">
              <Trash2 className="w-3.5 h-3.5" />
              {t('bookings.deleteBooking')}
            </button>
          )}
        </div>

        {/* Discount panel */}
        {showDiscount && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
            {discountSuccess ? (
              <div className="text-sm text-primary font-medium">{t('bookings.discountApplied')}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted block mb-1">{t('bookings.discountAmount')}</label>
                    <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="50" className="w-full px-2 py-1.5 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted block mb-1">{t('bookings.discountReason')}</label>
                    <input type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="ADMIN" className="w-full px-2 py-1.5 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted block mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> {t('auth.password')}</label>
                    <input type="password" value={discountPassword} onChange={e => setDiscountPassword(e.target.value)} placeholder={t('dashboard.adminPassword')} className="w-full px-2 py-1.5 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
                        body: JSON.stringify({ password: discountPassword, action: 'applyToBooking', bookingId: booking.id, discountCode: discountCode || 'ADMIN', discountAmount: parseFloat(discountAmount) }),
                      });
                      if (res.status === 403) { setDiscountError(t('bookings.wrongPassword')); setDiscountSaving(false); return; }
                      if (!res.ok) { setDiscountError(t('bookings.discountFailed')); setDiscountSaving(false); return; }
                      setDiscountSuccess(true);
                      fetch(`/api/payments?bookingId=${booking.id}`).then(r => r.json()).then(d => setPayments(d.payments || [])).catch((e) => console.error('Fetch error:', e));
                    } catch { setDiscountError(t('common.error')); }
                    setDiscountSaving(false);
                  }}
                  disabled={discountSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {discountSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                  {t('bookings.applyDiscountBtn')}
                </button>
              </>
            )}
          </div>
        )}

        {/* Extras panel */}
        {showExtras && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            {extrasSuccess ? (
              <div className="flex items-center gap-2 text-xs text-green-700 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Extra&apos;s toegevoegd en klant is per e-mail geïnformeerd</div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg cursor-pointer text-xs"><input type="checkbox" checked={extraBedlinnen} onChange={e => setExtraBedlinnen(e.target.checked)} className="rounded" /><span className="flex-1">🛏️ Bedlinnen (4 sets)</span><span className="font-semibold text-amber-700">€70/w</span></label>
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg cursor-pointer text-xs"><input type="checkbox" checked={extraFridge} onChange={e => setExtraFridge(e.target.checked)} className="rounded" /><span className="flex-1">🧊 Grote koelkast</span><span className="font-semibold text-amber-700">€40/w</span></label>
                  <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg cursor-pointer text-xs"><input type="checkbox" checked={extraAirco} onChange={e => setExtraAirco(e.target.checked)} className="rounded" /><span className="flex-1">❄️ Mobiele airco</span><span className="font-semibold text-amber-700">€50/w</span></label>
                  <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg text-xs">
                    <span className="flex-1">🚲 Fietsen</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setExtraBikes(Math.max(0, extraBikes - 1))} className="w-5 h-5 rounded bg-gray-100 text-gray-600 text-xs flex items-center justify-center cursor-pointer">-</button>
                      <span className="font-medium w-3 text-center">{extraBikes}</span>
                      <button onClick={() => setExtraBikes(Math.min(4, extraBikes + 1))} className="w-5 h-5 rounded bg-gray-100 text-gray-600 text-xs flex items-center justify-center cursor-pointer">+</button>
                    </div>
                    <span className="font-semibold text-amber-700">€50/w + €200 borg</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg text-xs">
                    <span className="flex-1">🚵 Mountainbikes</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setExtraMountainbikes(Math.max(0, extraMountainbikes - 1))} className="w-5 h-5 rounded bg-gray-100 text-gray-600 text-xs flex items-center justify-center cursor-pointer">-</button>
                      <span className="font-medium w-3 text-center">{extraMountainbikes}</span>
                      <button onClick={() => setExtraMountainbikes(Math.min(4, extraMountainbikes + 1))} className="w-5 h-5 rounded bg-gray-100 text-gray-600 text-xs flex items-center justify-center cursor-pointer">+</button>
                    </div>
                    <span className="font-semibold text-amber-700">€50/w + €200 borg</span>
                  </div>
                </div>
                {(extraBedlinnen || extraFridge || extraAirco || extraBikes > 0 || extraMountainbikes > 0) && (() => {
                  const weeks = Math.ceil(booking.nights / 7);
                  let addedCost = 0;
                  if (extraBedlinnen) addedCost += weeks * 70;
                  if (extraFridge) addedCost += weeks * 40;
                  if (extraAirco) addedCost += weeks * 50;
                  addedCost += extraBikes * weeks * 50;
                  addedCost += extraMountainbikes * weeks * 50;
                  const addedBorg = (extraBikes + extraMountainbikes) * 200;
                  const newTotal = Number(booking.total_price) + addedCost;
                  return (
                    <div className="bg-white rounded-lg p-2 border border-amber-200 text-xs space-y-0.5">
                      <div className="flex justify-between"><span className="text-muted">Extra kosten ({weeks}w)</span><span className="font-semibold text-amber-700">+{formatCurrency(addedCost)}</span></div>
                      {addedBorg > 0 && <div className="flex justify-between"><span className="text-muted">Extra borg</span><span className="font-semibold text-amber-700">+{formatCurrency(addedBorg)}</span></div>}
                      <div className="flex justify-between pt-1 border-t border-amber-100"><span className="font-medium">Nieuw totaal</span><span className="font-bold">{formatCurrency(newTotal)}</span></div>
                    </div>
                  );
                })()}
                <button
                  onClick={async () => {
                    const selected = [];
                    const weeks = Math.ceil(booking.nights / 7);
                    let addedCost = 0;
                    if (extraBedlinnen) { selected.push('Bedlinnen (4 sets)'); addedCost += weeks * 70; }
                    if (extraFridge) { selected.push('Grote koelkast'); addedCost += weeks * 40; }
                    if (extraAirco) { selected.push('Mobiele airco'); addedCost += weeks * 50; }
                    if (extraBikes > 0) { selected.push(`${extraBikes}x Fiets`); addedCost += extraBikes * weeks * 50; }
                    if (extraMountainbikes > 0) { selected.push(`${extraMountainbikes}x Mountainbike`); addedCost += extraMountainbikes * weeks * 50; }
                    if (selected.length === 0) { toast('Selecteer minstens één extra', 'error'); return; }
                    const addedBorg = (extraBikes + extraMountainbikes) * 200;
                    const newTotal = Number(booking.total_price) + addedCost;
                    const newDeposit = Math.round(newTotal * 0.25);
                    const newRemaining = newTotal - newDeposit;
                    const newBorg = Number(booking.borg_amount) + addedBorg;
                    setSavingExtras(true);
                    try {
                      const res = await fetch('/api/admin/bookings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'add-extras', bookingId: booking.id, extras: selected.join(' | '), totalPrice: newTotal, depositAmount: newDeposit, remainingAmount: newRemaining, borgAmount: newBorg }),
                      });
                      const data = await res.json();
                      if (data.success) { setExtrasSuccess(true); toast("Extra's succesvol toegevoegd", 'success'); setExtraBedlinnen(false); setExtraFridge(false); setExtraAirco(false); setExtraBikes(0); setExtraMountainbikes(0); }
                      else { toast(data.error || "Extra's toevoegen mislukt", 'error'); }
                    } catch { toast("Extra's toevoegen mislukt", 'error'); }
                    setSavingExtras(false);
                  }}
                  disabled={savingExtras || (!extraBedlinnen && !extraFridge && !extraAirco && extraBikes === 0 && extraMountainbikes === 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 hover:bg-amber-700"
                >
                  {savingExtras ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Toevoegen &amp; klant informeren
                </button>
              </>
            )}
          </div>
        )}

        {/* Delete confirm modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('bookings.deleteConfirm')}</p>
                  <p className="text-xs text-red-600 mt-0.5">{t('bookings.deleteWarning')}</p>
                </div>
              </div>
              {deleteError && <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Lock className="w-4 h-4 text-red-400" />
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder={t('dashboard.adminPassword')} className="flex-1 bg-transparent text-sm focus:outline-none" autoFocus />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 cursor-pointer">{t('common.cancel')}</button>
                <button
                  onClick={async () => {
                    if (!deletePassword) { setDeleteError(t('bookings.enterPassword')); return; }
                    setDeleting(true); setDeleteError('');
                    try {
                      const res = await fetch('/api/bookings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: booking.id, password: deletePassword }) });
                      if (res.status === 403) { setDeleteError(t('bookings.wrongPassword')); setDeleting(false); return; }
                      if (!res.ok) { setDeleteError(t('bookings.deleteFailed')); setDeleting(false); return; }
                      onDelete(booking.id);
                    } catch { setDeleteError(t('common.error')); }
                    setDeleting(false);
                  }}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 cursor-pointer disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {t('bookings.permanentDelete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingenPage() {
  const { t, ts, dateLocale } = useAdmin();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  // Filter/search state in URL — overleeft refresh, bookmark-baar.
  const [search, setSearch] = useUrlState('q', '');
  const [statusFilterRaw, setStatusFilter] = useUrlState('status', 'ALLE');
  const statusFilter = statusFilterRaw as BookingStatus | 'ALLE';
  const [dateFrom, setDateFrom] = useUrlState('from', '');
  const [dateTo, setDateTo] = useUrlState('to', '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [allCampings, setAllCampings] = useState(staticCampings.map(c => ({ ...c, active: true })));
  const [createSuccess, setCreateSuccess] = useState<{ reference: string; paymentUrl: string; isNewAccount: boolean } | null>(null);
  const [showLegend, setShowLegend] = useState(false);

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

  usePageActions(
    useMemo(() => (
      <>
        <button onClick={fetchBookings} className="p-2 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={() => setShowCreate(true)} className="p-2 bg-primary-dark text-white rounded-xl hover:bg-primary-dark/90 transition-colors cursor-pointer" title={t('bookings.createNew')}>
          <Plus className="w-4 h-4" />
        </button>
      </>
    ), [fetchBookings, t])
  );

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
      if (dateFrom && new Date(b.check_in) < new Date(dateFrom)) return false;
      if (dateTo && new Date(b.check_in) > new Date(dateTo)) return false;
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

  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const lastActivity = useLastActivity('booking', paginated.map(b => b.id));

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, search, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filter row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('bookings.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>
        <div className="relative hidden sm:block">
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
        <div className="relative shrink-0">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title={t('bookings.dateFrom')}
            className="w-10 sm:w-auto pl-9 pr-1 sm:pr-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark text-transparent sm:text-muted [&:not(:placeholder-shown)]:sm:text-foreground cursor-pointer"
          />
        </div>
        <div className="relative shrink-0">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title={t('bookings.dateTo')}
            className="w-10 sm:w-auto pl-9 pr-1 sm:pr-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark text-transparent sm:text-muted [&:not(:placeholder-shown)]:sm:text-foreground cursor-pointer"
          />
        </div>
        <button
          onClick={() => { fetchBookings(); }}
          className="p-2.5 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer shrink-0"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile status filter */}
      <div className="sm:hidden">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALLE')}
          className="w-full px-3 py-2.5 bg-white rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="ALLE">{t('status.allStatuses')}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
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
                {selectedCaravan && cNights > 0 && (
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
                  <button onClick={resetCreateForm} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-muted hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('bookings.cancel')}
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !cName || !cEmail || !cPhone || !cCaravanId || !cCampingId || !cCheckIn || !cCheckOut || cNights <= 0}
                    className="flex-1 py-3 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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

      <div className="flex items-center gap-2">
        <p className="text-xs text-muted flex-1">
          {t('bookings.bookingsFound', { count: String(filtered.length), s: filtered.length !== 1 ? 'en' : '' })}
        </p>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          {t('bookings.statusLegend')}
          {showLegend ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showLegend && (
        <div className="bg-white rounded-xl p-3 sm:p-4 text-xs space-y-1.5">
          <p className="font-semibold text-muted uppercase tracking-wider text-[11px] mb-2">{t('bookings.statusFlow')}</p>
          {([
            ['NIEUW', 'statusDescNieuw', 'bg-blue-100 text-blue-700'],
            ['BEVESTIGD', 'statusDescBevestigd', 'bg-purple-100 text-purple-700'],
            ['AANBETAALD', 'statusDescAanbetaald', 'bg-amber-100 text-amber-700'],
            ['VOLLEDIG_BETAALD', 'statusDescVolledigBetaald', 'bg-green-100 text-green-700'],
            ['ACTIEF', 'statusDescActief', 'bg-emerald-100 text-emerald-700'],
            ['AFGEROND', 'statusDescAfgerond', 'bg-gray-100 text-gray-700'],
            ['GEANNULEERD', 'statusDescGeannuleerd', 'bg-red-100 text-red-700'],
          ] as const).map(([status, descKey, color]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${color}`}>
                {ts(status)}
              </span>
              <span className="text-muted">{t(`bookings.${descKey}`)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5 sm:space-y-2">
        {paginated.map((booking) => {
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
                    {lastActivity[booking.id] && (
                      <LastEditedBadge actor={lastActivity[booking.id].actor} createdAt={lastActivity[booking.id].created_at} />
                    )}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {caravan?.name} → {camping?.name}{booking.spot_number ? ` (${booking.spot_number})` : ''} &nbsp;|&nbsp; {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(booking.total_price))}</p>
                  </div>
                  {(() => {
                    const ds = booking.deposit_status;
                    const depositBadge = ds === 'BETAALD'
                      ? { label: '🟢 Betaald', cls: 'bg-green-100 text-green-700' }
                      : ds === 'MISLUKT'
                        ? { label: '🔴 Mislukt', cls: 'bg-red-100 text-red-700' }
                        : ds === 'TERUGBETAALD'
                          ? { label: '↩︎ Terugbetaald', cls: 'bg-gray-100 text-gray-700' }
                          : { label: '🟡 Wacht op betaling', cls: 'bg-amber-100 text-amber-800' };
                    return (
                      <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${depositBadge.cls}`} title="Status van de aanbetaling">
                        {depositBadge.label}
                      </span>
                    );
                  })()}
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
                    allCaravans={allCaravans}
                    onCaravanChange={(id, caravanId) => {
                      setBookings(prev => prev.map(b => b.id === id ? { ...b, caravan_id: caravanId || '' } : b));
                    }}
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
