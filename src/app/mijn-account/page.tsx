'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Calendar, CreditCard, ClipboardCheck, ChevronRight,
  MapPin, Users, Phone, Mail, Edit3, Check, X, Loader2, AlertCircle,
  Clock, CheckCircle, ArrowRight, FileText, Sun, Shield, Star,
  CheckCircle2, AlertTriangle, XCircle, Minus, MessageSquare,
  ThumbsUp, ThumbsDown, Trash2, ExternalLink, ChevronDown,
  Home, Settings, Plus, Eye, Plane, TreePalm, ScrollText, Compass, Lightbulb,
} from 'lucide-react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { campings as staticCampings, type Camping } from '@/data/campings';
import { destinations } from '@/data/destinations';
import { getActivitiesForLocation, getCategoryLabel, generalTips, groupActivitiesByCategory } from '@/data/activities';
import type { Activity } from '@/data/activities';
import { useLanguage } from '@/i18n/context';
import type { Locale } from '@/i18n/context';
import { GOOGLE_REVIEW_URL } from '@/lib/constants';

// ===== TYPES =====
interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at?: string;
}

interface Booking {
  id: string;
  reference: string;
  status: string;
  guest_name: string;
  caravan_id: string;
  camping_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  deposit_amount: number;
  remaining_amount: number;
  borg_amount: number;
  adults: number;
  children: number;
  created_at: string;
}

interface Payment {
  id: string;
  booking_id: string;
  type: string;
  amount: number;
  status: string;
  paid_at: string | null;
}

interface BorgItem {
  category: string;
  item: string;
  status: 'nvt' | 'goed' | 'beschadigd' | 'ontbreekt';
  notes: string;
}

interface BorgChecklist {
  id: string;
  booking_id: string;
  type: string;
  status: string;
  items: BorgItem[];
  general_notes: string | null;
  staff_name: string | null;
  customer_agreed: boolean;
  customer_agreed_at: string | null;
  customer_notes: string | null;
  token: string;
  completed_at: string | null;
  created_at: string;
  booking_ref: string;
  caravan_id: string;
  check_in?: string;
  check_out?: string;
  borg_amount?: string;
}

type Tab = 'overzicht' | 'boekingen' | 'betalingen' | 'borg' | 'tips' | 'voorwaarden' | 'profiel';

// ===== HELPERS =====
const localeMap: Record<Locale, string> = { nl: 'nl-NL', en: 'en-GB', es: 'es-ES' };

const statusColors: Record<string, string> = {
  NIEUW: 'bg-primary-100 text-primary-dark',
  BEVESTIGD: 'bg-primary-light text-primary-dark',
  BETAALD: 'bg-primary-light text-primary-dark',
  AANBETAALD: 'bg-primary-light text-primary',
  GEANNULEERD: 'bg-danger/10 text-danger',
  AFGEROND: 'bg-surface-alt text-foreground-light',
  OPENSTAAND: 'bg-primary-light text-primary',
  OPEN: 'bg-primary-100 text-primary-dark',
  IN_BEHANDELING: 'bg-primary-100 text-primary-dark',
  AFGEROND_GOED: 'bg-primary-light text-primary-dark',
  KLANT_AKKOORD: 'bg-primary-light text-primary-dark',
  KLANT_BEZWAAR: 'bg-danger/10 text-danger',
};

const borgItemIcons: Record<string, React.ReactNode> = {
  nvt: <Minus size={14} className="text-muted" />,
  goed: <CheckCircle2 size={14} className="text-primary" />,
  beschadigd: <AlertTriangle size={14} className="text-primary" />,
  ontbreekt: <XCircle size={14} className="text-danger" />,
};

function formatDate(d: string, locale: string = 'nl-NL') {
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatPrice(n: number, locale: string = 'nl-NL') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n);
}
function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ===== MAIN COMPONENT =====
export default function MijnAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
        </div>
      </div>
    }>
      <MijnAccountContent />
    </Suspense>
  );
}

function MijnAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const dateLoc = localeMap[locale];
  const fd = (d: string) => formatDate(d, dateLoc);
  const fp = (n: number) => formatPrice(n, dateLoc);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [borgChecklists, setBorgChecklists] = useState<BorgChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const initialTab = (searchParams.get('tab') as Tab) || 'overzicht';
  const [tab, setTab] = useState<Tab>(initialTab);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // GDPR
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteEmailSent, setDeleteEmailSent] = useState(false);

  // Borg response
  const [respondingBorgId, setRespondingBorgId] = useState<string | null>(null);
  const [borgNotes, setBorgNotes] = useState('');
  const [submittingBorg, setSubmittingBorg] = useState(false);
  const [expandedBorgId, setExpandedBorgId] = useState<string | null>(null);

  // Payment
  const [payingId, setPayingId] = useState<string | null>(null);

  // Cancel booking
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<{ refundPercentage: number; refundMessage: string } | null>(null);

  // Newsletter subscription
  const [newsletterUnsubscribed, setNewsletterUnsubscribed] = useState(false);
  const [togglingNewsletter, setTogglingNewsletter] = useState(false);

  // Custom caravans (must be before any early returns to satisfy Rules of Hooks)
  const [customCaravansData, setCustomCaravansData] = useState<Caravan[]>([]);
  const [campings, setCampings] = useState<Camping[]>(staticCampings);
  const redirectingRef = useRef(false);
  useEffect(() => {
    fetch('/api/admin/caravans')
      .then(res => res.json())
      .then(data => setCustomCaravansData(data.caravans || []))
      .catch(() => {});
    // Fetch campings from DB (admin-managed)
    fetch('/api/campings')
      .then(res => res.json())
      .then(data => { if (data.campings?.length) setCampings(data.campings); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (redirectingRef.current) return;
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { redirectingRef.current = true; router.push('/account'); return; }
      const data = await res.json();
      setCustomer(data.customer);
      setBookings(data.bookings || []);
      setPayments(data.payments || []);
      setBorgChecklists(data.borgChecklists || []);
      setEditName(data.customer.name);
      setEditPhone(data.customer.phone || '');
      setNewsletterUnsubscribed(data.customer.newsletter_unsubscribed || false);
    } catch {
      if (!redirectingRef.current) { redirectingRef.current = true; router.push('/account'); }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sync tab with URL
  useEffect(() => {
    const urlTab = searchParams.get('tab') as Tab;
    if (urlTab && ['overzicht', 'boekingen', 'betalingen', 'borg', 'voorwaarden', 'profiel'].includes(urlTab)) {
      setTab(urlTab);
    }
  }, [searchParams]);

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    const url = newTab === 'overzicht' ? '/mijn-account' : `/mijn-account?tab=${newTab}`;
    window.history.replaceState(null, '', url);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/account');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      if (res.ok) {
        setCustomer(prev => prev ? { ...prev, name: editName, phone: editPhone } : null);
        setEditingProfile(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.confirmationSent) {
        setDeleteEmailSent(true);
      } else if (data.deleted) {
        router.push('/account');
      }
    } catch {
      // ignore
    }
    setDeleting(false);
  };

  const handleBorgResponse = async (token: string, agreed: boolean) => {
    setSubmittingBorg(true);
    try {
      const res = await fetch(`/api/borg/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed, notes: borgNotes || undefined }),
      });
      if (res.ok) {
        setBorgChecklists(prev => prev.map(bc =>
          bc.token === token ? { ...bc, customer_agreed: agreed, customer_notes: borgNotes, status: agreed ? 'KLANT_AKKOORD' : 'KLANT_BEZWAAR' } : bc
        ));
        setRespondingBorgId(null);
        setBorgNotes('');
      }
    } catch { /* ignore */ }
    setSubmittingBorg(false);
  };

  const handlePayment = async (paymentId: string) => {
    setPayingId(paymentId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch { /* ignore */ }
    setPayingId(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBookingId(bookingId);
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCancelResult({ refundPercentage: data.refundPercentage, refundMessage: data.refundMessage });
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'GEANNULEERD' } : b));
      } else {
        alert(data.error || 'Er is een fout opgetreden');
      }
    } catch {
      alert('Er is een fout opgetreden');
    } finally {
      setCancellingBookingId(null);
      setCancelConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted mt-3">{t('myAccount.loadingData')}</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const statusLabelsNL: Record<string, string> = {
    NIEUW: t('myAccount.statusNieuw'),
    BEVESTIGD: t('myAccount.statusBevestigd'),
    BETAALD: t('myAccount.statusBetaald'),
    AANBETAALD: t('myAccount.statusAanbetaald'),
    GEANNULEERD: t('myAccount.statusGeannuleerd'),
    AFGEROND: t('myAccount.statusAfgerond'),
    OPENSTAAND: t('myAccount.statusOpenstaand'),
    OPEN: t('myAccount.statusInVoorbereiding'),
    IN_BEHANDELING: t('myAccount.statusWordtIngevuld'),
    KLANT_AKKOORD: t('myAccount.statusAkkoord'),
    KLANT_BEZWAAR: t('myAccount.statusBezwaar'),
  };

  const paymentTypeLabels: Record<string, string> = {
    AANBETALING: t('myAccount.payTypeDeposit'),
    RESTBETALING: t('myAccount.payTypeRemaining'),
    BORG: t('myAccount.payTypeBorg'),
  };

  const getCaravan = (id: string) => staticCaravans.find(c => c.id === id) || customCaravansData.find(c => c.id === id);
  const getCamping = (id: string) => campings.find(c => c.id === id);
  const activeBookings = bookings.filter(b => !['GEANNULEERD', 'AFGEROND'].includes(b.status));
  const openPayments = payments.filter(p => p.status === 'OPENSTAAND');
  const upcomingBooking = activeBookings.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime()).find(b => new Date(b.check_in) > new Date());
  const openBorg = borgChecklists.filter(bc => bc.status === 'AFGEROND');
  const firstName = customer.name.split(' ')[0];

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overzicht', label: t('myAccount.tabOverview'), icon: <Home size={18} /> },
    { key: 'boekingen', label: t('myAccount.tabBookings'), icon: <Calendar size={18} />, badge: activeBookings.length || undefined },
    { key: 'betalingen', label: t('myAccount.tabPayments'), icon: <CreditCard size={18} />, badge: openPayments.length || undefined },
    { key: 'borg', label: t('myAccount.tabBorg'), icon: <Shield size={18} />, badge: openBorg.length || undefined },
    { key: 'tips', label: 'Tips', icon: <Compass size={18} /> },
    { key: 'voorwaarden', label: t('myAccount.tabTerms'), icon: <ScrollText size={18} /> },
    { key: 'profiel', label: t('myAccount.tabProfile'), icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ===== SIDEBAR (desktop) ===== */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 space-y-4">
              {/* User card */}
              <div className="bg-white rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground text-sm truncate">{customer.name}</h2>
                    <p className="text-xs text-muted truncate">{customer.email}</p>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 bg-[#FAFAF9] rounded-xl p-2.5">
                  {[
                    { n: bookings.length, label: t('myAccount.statBookings') },
                    { n: payments.filter(p => p.status === 'BETAALD').length, label: t('myAccount.statPaid') },
                    { n: borgChecklists.length, label: t('myAccount.statChecklists') },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-base font-bold text-foreground">{s.n}</div>
                      <div className="text-xs text-muted leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nav items */}
              <nav className="bg-white rounded-2xl p-2 space-y-0.5">
                {tabs.map(tb => (
                  <button
                    key={tb.key}
                    onClick={() => switchTab(tb.key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      tab === tb.key
                        ? 'bg-primary/8 text-primary'
                        : 'text-foreground-light'
                    }`}
                  >
                    <span className={tab === tb.key ? 'text-primary' : 'text-muted'}>{tb.icon}</span>
                    {tb.label}
                    {tb.badge ? (
                      <span className="ml-auto w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{tb.badge}</span>
                    ) : null}
                  </button>
                ))}
              </nav>

              {/* Sidebar actions */}
              <div className="bg-white rounded-2xl p-2 space-y-0.5">
                <Link href="/boeken" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-primary transition-colors">
                  <Plus size={18} />
                  {t('myAccount.newBooking')}
                </Link>
                <Link href="/contact" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground-light transition-colors">
                  <Mail size={18} className="text-muted" />
                  {t('myAccount.contactUs')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground-light transition-colors"
                >
                  <LogOut size={18} className="text-muted" />
                  {t('myAccount.logout')}
                </button>
              </div>
            </div>
          </aside>

          {/* ===== MOBILE TAB BAR ===== */}
          <div className="lg:hidden">
            {/* Mobile user greeting */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">{t('myAccount.hello').replace('{name}', firstName)}</h2>
                  <p className="text-xs text-muted">{customer.email}</p>
                </div>
              </div>
            </div>
            {/* Scrollable tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
              {tabs.map(tb => (
                <button
                  key={tb.key}
                  onClick={() => switchTab(tb.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    tab === tb.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-foreground-light'
                  }`}
                >
                  {tb.icon}
                  <span>{tb.label}</span>
                  {tb.badge ? (
                    <span className={`ml-0.5 w-4 h-4 text-xs font-bold rounded-full flex items-center justify-center ${
                      tab === tb.key ? 'bg-white/25 text-white' : 'bg-primary text-white'
                    }`}>{tb.badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >

              {/* ==================== OVERZICHT ==================== */}
              {tab === 'overzicht' && (
                <div className="space-y-5">
                  {/* Page heading (desktop) */}
                  <div className="hidden lg:block">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('myAccount.hello').replace('{name}', firstName)}</h1>
                    <p className="text-sm text-muted mt-1">{t('myAccount.dashboardWelcome')}</p>
                  </div>

                  {/* Upcoming trip hero card */}
                  {upcomingBooking && (() => {
                    const caravan = getCaravan(upcomingBooking.caravan_id);
                    const camping = getCamping(upcomingBooking.camping_id);
                    const days = daysUntil(upcomingBooking.check_in);
                    return (
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <div className="relative h-36 sm:h-44 bg-foreground">
                          {caravan?.photos?.[0] && (
                            <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover opacity-25" unoptimized />
                          )}
                          <div className="absolute inset-0 flex items-end justify-between p-5 sm:p-6">
                            <div>
                              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">{t('myAccount.upcomingTrip')}</p>
                              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{caravan?.name || 'Caravan'}</h3>
                              <div className="flex items-center gap-3 text-white/60 text-sm mt-1.5">
                                <span className="flex items-center gap-1"><MapPin size={12} />{camping?.name}</span>
                                <span className="flex items-center gap-1"><Calendar size={12} />{fd(upcomingBooking.check_in)}</span>
                              </div>
                            </div>
                            <div className="text-center bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                              <div className="text-3xl sm:text-4xl font-bold text-white leading-none">{days}</div>
                              <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-1">
                                {days === 1 ? t('myAccount.day') : t('myAccount.days')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-5 flex items-center justify-between bg-[#FAFAF9]/50">
                          <div className="flex items-center gap-3 text-sm text-muted flex-wrap">
                            <span>{fd(upcomingBooking.check_in)} → {fd(upcomingBooking.check_out)}</span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[upcomingBooking.status] || 'bg-surface-alt text-foreground-light'}`}>
                              {statusLabelsNL[upcomingBooking.status] || upcomingBooking.status}
                            </span>
                          </div>
                          <button onClick={() => switchTab('boekingen')} className="text-primary text-sm font-medium flex items-center gap-1 transition-all">
                            {t('myAccount.details')} <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Vacation countdown */}
                  {upcomingBooking && (() => {
                    const days = daysUntil(upcomingBooking.check_in);
                    if (days <= 0) return null;
                    const totalDays = Math.ceil((new Date(upcomingBooking.check_in).getTime() - new Date(upcomingBooking.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    const pct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - days) / totalDays) * 100)) : 0;
                    const hours = Math.floor((new Date(upcomingBooking.check_in).getTime() - Date.now()) / (1000 * 60 * 60)) % 24;
                    const weeks = Math.floor(days / 7);
                    const remainingDays = days % 7;

                    return (
                      <div className="bg-white rounded-2xl border border-primary/15 p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <TreePalm size={20} className="text-primary" />
                          <h3 className="font-bold text-foreground text-sm">{t('myAccount.countdownTitle')}</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                          {[
                            { value: weeks, label: t('myAccount.weeks') },
                            { value: remainingDays, label: days === 1 ? t('myAccount.day') : t('myAccount.daysLabel') },
                            { value: hours, label: t('myAccount.hours') },
                          ].map((item, i) => (
                            <div key={i} className="text-center bg-white rounded-xl p-3 shadow-sm">
                              <div className="text-2xl sm:text-3xl font-bold text-primary leading-none">{item.value}</div>
                              <div className="text-xs text-muted font-medium uppercase tracking-wider mt-1.5">{item.label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                            <span>{t('myAccount.countdownProgress')}</span>
                            <span className="font-semibold text-primary">{pct}%</span>
                          </div>
                          <div className="h-2 bg-stone-200/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <p className="text-xs text-muted mt-2 flex items-center gap-1">
                          <Plane size={12} className="text-primary" />
                          {t('myAccount.arrivalOn').replace('{date}', fd(upcomingBooking.check_in))}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Prominent borg notification banner */}
                  {openBorg.length > 0 && (
                    <div className="bg-primary-50 rounded-2xl border-2 border-primary/25 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
                          <Shield size={24} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-base mb-1">{t('myAccount.borgAlertTitle')}</h3>
                          <p className="text-sm text-muted mb-3">{t('myAccount.borgAlertDesc').replace('{count}', String(openBorg.length))}</p>
                          <button
                            onClick={() => switchTab('borg')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                          >
                            <ClipboardCheck size={16} />
                            {t('myAccount.borgAlertAction')}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  {(openPayments.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {openPayments.length > 0 && (
                        <button onClick={() => switchTab('betalingen')} className="bg-white rounded-2xl p-4 flex items-center gap-3 text-left border border-primary/15 transition-all group">
                          <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center shrink-0">
                            <CreditCard size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground text-sm">{t('myAccount.openPayments').replace('{count}', String(openPayments.length))}</div>
                            <div className="text-xs text-muted">{fp(openPayments.reduce((s, p) => s + Number(p.amount), 0))}</div>
                          </div>
                          <ArrowRight size={16} className="text-primary shrink-0 transition-transform" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link href="/boeken" className="bg-white rounded-2xl p-4 text-center transition-all group">
                      <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center mx-auto mb-2.5 transition-colors">
                        <Plus size={20} className="text-primary" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">{t('myAccount.newBooking')}</div>
                      <div className="text-xs text-muted mt-0.5">{t('myAccount.season2026')}</div>
                    </Link>
                    <button onClick={() => switchTab('boekingen')} className="bg-white rounded-2xl p-4 text-center transition-all group">
                      <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center mx-auto mb-2.5 transition-colors">
                        <Eye size={20} className="text-primary" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">{t('myAccount.myBookings')}</div>
                      <div className="text-xs text-muted mt-0.5">{bookings.length} {t('myAccount.totalCount')}</div>
                    </button>
                    <button onClick={() => switchTab('betalingen')} className="bg-white rounded-2xl p-4 text-center transition-all group">
                      <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center mx-auto mb-2.5 transition-colors">
                        <CreditCard size={20} className="text-primary" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">{t('myAccount.paymentsTitle')}</div>
                      <div className="text-xs text-muted mt-0.5">{payments.filter(p => p.status === 'BETAALD').length} {t('myAccount.statPaid').toLowerCase()}</div>
                    </button>
                    <Link href="/contact" className="bg-white rounded-2xl p-4 text-center transition-all group">
                      <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center mx-auto mb-2.5 transition-colors">
                        <Mail size={20} className="text-primary" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">{t('myAccount.contactUs')}</div>
                      <div className="text-xs text-muted mt-0.5">{t('myAccount.needHelp')}</div>
                    </Link>
                  </div>

                  {/* Empty state */}
                  {bookings.length === 0 && (
                    <div className="bg-white rounded-2xl p-10 sm:p-14 text-center">
                      <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Sun size={28} className="text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground text-lg">{t('myAccount.noBookingsTitle')}</h3>
                      <p className="text-sm text-muted mt-2 mb-6 max-w-sm mx-auto">
                        {t('myAccount.noBookingsDesc')}
                      </p>
                      <Link href="/boeken" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        {t('myAccount.bookNow')} <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== BOEKINGEN ==================== */}
              {tab === 'boekingen' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{t('myAccount.myBookings')}</h2>
                    <span className="text-xs text-muted bg-white px-3 py-1 rounded-full">{bookings.length} {t('myAccount.totalCount')}</span>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <Calendar size={40} className="mx-auto text-muted mb-3" />
                      <p className="text-muted text-sm">{t('myAccount.noBookingsYet')}</p>
                      <Link href="/boeken" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold mt-4 transition-colors">
                        {t('myAccount.bookNow')} <ArrowRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    bookings.map(booking => {
                      const caravan = getCaravan(booking.caravan_id);
                      const camping = getCamping(booking.camping_id);
                      const isPast = new Date(booking.check_out) < new Date();
                      return (
                        <div key={booking.id} className={`bg-white rounded-2xl overflow-hidden transition-all ${isPast ? 'opacity-60' : ''}`}>
                          {/* Caravan image strip */}
                          {caravan?.photos?.[0] && !isPast && (
                            <div className="relative h-24 sm:h-28">
                              <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover" unoptimized />
                              <div className="absolute inset-0 bg-black/30" />
                              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                                <div>
                                  <h3 className="font-bold text-white text-sm">{caravan.name}</h3>
                                  <div className="text-white/70 text-xs flex items-center gap-1"><MapPin size={10} />{camping?.name || 'Camping'}</div>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[booking.status] || 'bg-surface-alt text-foreground-light'}`}>
                                  {statusLabelsNL[booking.status] || booking.status}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="p-4 sm:p-5">
                            {/* Compact header for past/no-image */}
                            {(isPast || !caravan?.photos?.[0]) && (
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted">{booking.reference}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[booking.status] || 'bg-surface-alt text-foreground-light'}`}>
                                      {statusLabelsNL[booking.status] || booking.status}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-foreground mt-1 text-sm">{caravan?.name || `Caravan`}</h3>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-foreground text-sm">{fp(Number(booking.total_price))}</div>
                                </div>
                              </div>
                            )}

                            {/* Details grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted">
                                <Calendar size={13} className="text-primary shrink-0" />
                                <span className="truncate">{fd(booking.check_in)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted">
                                <Calendar size={13} className="text-primary shrink-0" />
                                <span className="truncate">{fd(booking.check_out)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted">
                                <Clock size={13} className="text-primary shrink-0" />
                                <span>{booking.nights} {t('myAccount.nights')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted">
                                <Users size={13} className="text-primary shrink-0" />
                                <span>{booking.adults} {t('myAccount.adults')}{booking.children > 0 ? ` + ${booking.children} ${t('myAccount.children')}` : ''}</span>
                              </div>
                            </div>

                            {/* Payment progress */}
                            <div className="mt-4 pt-3">
                              {(() => {
                                const bookingPayments = payments.filter(p => p.booking_id === booking.id);
                                const paid = bookingPayments.filter(p => p.status === 'BETAALD').reduce((s, p) => s + Number(p.amount), 0);
                                const total = Number(booking.total_price);
                                const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                                return (
                                  <div>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                      <span className="text-muted">{t('myAccount.paidOf').replace('{paid}', fp(paid)).replace('{total}', fp(total))}</span>
                                      <span className="font-semibold text-foreground-light">{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Reference footer for image-cards */}
                            {!isPast && caravan?.photos?.[0] && (
                              <div className="mt-3 flex items-center justify-between">
                                <span className="font-mono text-xs text-muted">{booking.reference}</span>
                                <div className="flex items-center gap-3">
                                  {booking.status !== 'GEANNULEERD' && booking.status !== 'AFGEROND' && !isPast && (
                                    <button
                                      onClick={() => setCancelConfirmId(booking.id)}
                                      className="text-xs text-muted hover:text-danger transition-colors cursor-pointer"
                                    >
                                      Annuleren
                                    </button>
                                  )}
                                  <span className="text-sm font-bold text-foreground">{fp(Number(booking.total_price))}</span>
                                </div>
                              </div>
                            )}

                            {/* Cancel button for past/no-image cards */}
                            {(isPast || !caravan?.photos?.[0]) && booking.status !== 'GEANNULEERD' && booking.status !== 'AFGEROND' && !isPast && (
                              <div className="mt-3 pt-2">
                                <button
                                  onClick={() => setCancelConfirmId(booking.id)}
                                  className="text-xs text-muted hover:text-danger transition-colors cursor-pointer"
                                >
                                  Boeking annuleren
                                </button>
                              </div>
                            )}

                            {/* Google Review CTA for past bookings */}
                            {isPast && booking.status !== 'GEANNULEERD' && (
                              <div className="mt-4 pt-3 border-t border-border">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                    <Star size={14} className="text-amber-500 fill-amber-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted leading-snug">{t('myAccount.pastBookingReview')}</p>
                                  </div>
                                  <a
                                    href={GOOGLE_REVIEW_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    <Star size={11} className="fill-white" />
                                    {t('myAccount.pastBookingReviewBtn')}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ==================== BETALINGEN ==================== */}
              {tab === 'betalingen' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{t('myAccount.paymentsTitle')}</h2>
                  </div>

                  {/* Payment summary card */}
                  {payments.length > 0 && (
                    <div className="bg-white rounded-2xl p-5">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-muted mb-1">{t('myAccount.paid')}</div>
                          <div className="text-lg font-bold text-primary">
                            {fp(payments.filter(p => p.status === 'BETAALD').reduce((s, p) => s + Number(p.amount), 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">{t('myAccount.outstanding')}</div>
                          <div className="text-lg font-bold text-primary">
                            {fp(openPayments.reduce((s, p) => s + Number(p.amount), 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">{t('myAccount.totalAmount')}</div>
                          <div className="text-lg font-bold text-foreground">
                            {fp(payments.reduce((s, p) => s + Number(p.amount), 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {payments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <CreditCard size={40} className="mx-auto text-muted/30 mb-3" />
                      <p className="text-muted text-sm">{t('myAccount.noPayments')}</p>
                    </div>
                  ) : (
                    payments.map(payment => {
                      const booking = bookings.find(b => b.id === payment.booking_id);
                      return (
                        <div key={payment.id} className="bg-white rounded-2xl p-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            payment.status === 'BETAALD' ? 'bg-primary-50' : 'bg-primary-50'
                          }`}>
                            {payment.status === 'BETAALD' ? <CheckCircle size={18} className="text-primary" /> : <Clock size={18} className="text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground">{paymentTypeLabels[payment.type] || payment.type}</div>
                            <div className="text-xs text-muted">{booking?.reference || t('myAccount.booking')} &middot; {payment.paid_at ? fd(payment.paid_at) : t('myAccount.notPaidYet')}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm text-foreground">{fp(Number(payment.amount))}</div>
                            {payment.status === 'OPENSTAAND' ? (
                              <button
                                onClick={() => handlePayment(payment.id)}
                                disabled={payingId === payment.id}
                                className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                              >
                                {payingId === payment.id ? (
                                  <><Loader2 size={12} className="animate-spin" /> {t('myAccount.pleaseWait')}</>
                                ) : (
                                  <><CreditCard size={12} /> {t('myAccount.payViaIdeal')}</>
                                )}
                              </button>
                            ) : (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[payment.status] || 'bg-surface-alt text-foreground-light'}`}>
                                {statusLabelsNL[payment.status] || payment.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Payment instructions */}
                  {openPayments.length > 0 && (
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                      <h3 className="text-sm font-semibold text-foreground mb-2">{t('myAccount.payViaIdealTitle')}</h3>
                      <p className="text-xs text-foreground-light leading-relaxed">
                        {t('myAccount.payViaIdealDesc')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== BORG ==================== */}
              {tab === 'borg' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{t('myAccount.borgTitle')}</h2>
                    <p className="text-xs text-muted mt-0.5">{t('myAccount.borgSubtitle')}</p>
                  </div>

                  {borgChecklists.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 sm:p-10 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={28} className="text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground">{t('myAccount.noBorgTitle')}</h3>
                      <p className="text-sm text-muted mt-2 max-w-sm mx-auto">
                        {t('myAccount.noBorgDesc')}
                      </p>
                      <div className="mt-5 flex items-center justify-center gap-6 text-xs text-muted">
                        {[
                          { icon: <ClipboardCheck size={14} />, text: t('myAccount.checkInInspection') },
                          { icon: <Shield size={14} />, text: t('myAccount.checkOutInspection') },
                        ].map((s, i) => (
                          <span key={i} className="flex items-center gap-1.5">{s.icon} {s.text}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    borgChecklists.map(bc => {
                      const isExpanded = expandedBorgId === bc.id;
                      const items = bc.items || [];
                      const goedItems = items.filter(i => i.status === 'goed').length;
                      const beschadigdItems = items.filter(i => i.status === 'beschadigd').length;
                      const ontbreektItems = items.filter(i => i.status === 'ontbreekt').length;
                      const canRespond = bc.status === 'AFGEROND' && !bc.customer_agreed;
                      const hasResponded = bc.status === 'KLANT_AKKOORD' || bc.status === 'KLANT_BEZWAAR';
                      const caravan = getCaravan(bc.caravan_id);

                      // Group by category
                      const grouped: Record<string, BorgItem[]> = {};
                      items.forEach(item => {
                        if (!grouped[item.category]) grouped[item.category] = [];
                        grouped[item.category].push(item);
                      });

                      return (
                        <div key={bc.id} className="bg-white rounded-2xl overflow-hidden">
                          {/* Header */}
                          <button
                            onClick={() => setExpandedBorgId(isExpanded ? null : bc.id)}
                            className="w-full p-4 sm:p-5 flex items-center gap-3 transition-colors text-left"
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                              bc.type === 'INCHECKEN' ? 'bg-primary/10' : 'bg-primary-50'
                            }`}>
                              <ClipboardCheck size={20} className={bc.type === 'INCHECKEN' ? 'text-primary' : 'text-primary'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-foreground">
                                  {bc.type === 'INCHECKEN' ? t('myAccount.incheckInspection') : t('myAccount.uitcheckInspection')}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[bc.status] || 'bg-surface-alt text-foreground-light'}`}>
                                  {statusLabelsNL[bc.status] || bc.status}
                                </span>
                              </div>
                              <div className="text-xs text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>{bc.booking_ref}</span>
                                <span>{caravan?.name || bc.caravan_id}</span>
                                {canRespond && <span className="text-primary font-medium animate-pulse">{t('myAccount.actionRequired')}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {/* Mini summary */}
                              <div className="hidden sm:flex items-center gap-2 text-xs">
                                {goedItems > 0 && <span className="text-primary font-medium">{goedItems} {t('myAccount.ok')}</span>}
                                {beschadigdItems > 0 && <span className="text-primary font-medium">{beschadigdItems} {t('myAccount.damage')}</span>}
                                {ontbreektItems > 0 && <span className="text-danger font-medium">{ontbreektItems} {t('myAccount.misses')}</span>}
                              </div>
                              <ChevronDown size={18} className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 sm:p-5 space-y-4">
                                  {/* Summary cards */}
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-primary-50 rounded-xl p-3 text-center">
                                      <CheckCircle2 size={18} className="text-primary mx-auto" />
                                      <div className="text-lg font-bold text-primary-dark mt-1">{goedItems}</div>
                                      <div className="text-xs text-primary font-medium">{t('myAccount.inOrder')}</div>
                                    </div>
                                    <div className="bg-primary-50 rounded-xl p-3 text-center">
                                      <AlertTriangle size={18} className="text-primary mx-auto" />
                                      <div className="text-lg font-bold text-primary mt-1">{beschadigdItems}</div>
                                      <div className="text-xs text-primary font-medium">{t('myAccount.damaged')}</div>
                                    </div>
                                    <div className="bg-danger/5 rounded-xl p-3 text-center">
                                      <XCircle size={18} className="text-danger mx-auto" />
                                      <div className="text-lg font-bold text-danger mt-1">{ontbreektItems}</div>
                                      <div className="text-xs text-danger font-medium">{t('myAccount.missing')}</div>
                                    </div>
                                  </div>

                                  {/* Checklist items */}
                                  {Object.entries(grouped).map(([category, catItems]) => (
                                    <div key={category}>
                                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{category}</h4>
                                      <div className="space-y-1">
                                        {catItems.map(item => (
                                          <div key={item.item} className="flex items-start gap-2 py-1.5">
                                            {borgItemIcons[item.status]}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm text-foreground-light">{item.item}</span>
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                  item.status === 'goed' ? 'bg-primary-light text-primary-dark' :
                                                  item.status === 'beschadigd' ? 'bg-primary-light text-primary' :
                                                  item.status === 'ontbreekt' ? 'bg-danger/10 text-danger' :
                                                  'bg-surface-alt text-muted'
                                                }`}>
                                                  {item.status === 'nvt' ? t('myAccount.borgStatusNvt') :
                                                   item.status === 'goed' ? t('myAccount.borgStatusGoed') :
                                                   item.status === 'beschadigd' ? t('myAccount.borgStatusBeschadigd') :
                                                   item.status === 'ontbreekt' ? t('myAccount.borgStatusOntbreekt') : item.status}
                                                </span>
                                              </div>
                                              {item.notes && (
                                                <p className="text-xs text-muted mt-0.5 flex items-start gap-1">
                                                  <MessageSquare size={10} className="mt-0.5 shrink-0" />{item.notes}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Staff notes */}
                                  {bc.general_notes && (
                                    <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
                                      <h4 className="text-xs font-semibold text-primary-dark mb-1">{t('myAccount.staffNotes')}</h4>
                                      <p className="text-sm text-primary-dark">{bc.general_notes}</p>
                                    </div>
                                  )}

                                  {/* Customer already responded */}
                                  {hasResponded && (
                                    <div className={`rounded-xl p-4 border ${bc.customer_agreed ? 'bg-primary-50 border-primary-100' : 'bg-danger/5 border-danger/20'}`}>
                                      <div className="flex items-center gap-2 mb-1">
                                        {bc.customer_agreed ? <ThumbsUp size={16} className="text-primary" /> : <ThumbsDown size={16} className="text-danger" />}
                                        <h4 className="font-semibold text-sm">{bc.customer_agreed ? t('myAccount.youAgreed') : t('myAccount.youObjected')}</h4>
                                      </div>
                                      {bc.customer_agreed_at && (
                                        <p className="text-xs text-muted mb-1">{t('myAccount.respondedOn').replace('{date}', new Date(bc.customer_agreed_at).toLocaleString(dateLoc))}</p>
                                      )}
                                      {bc.customer_notes && (
                                        <p className="text-sm mt-2 bg-white/60 rounded-lg p-2">{bc.customer_notes}</p>
                                      )}
                                      {bc.customer_agreed && bc.borg_amount && (
                                        <p className="text-sm text-primary-dark mt-2">
                                          {t('myAccount.borgReturnNote').replace('{amount}', parseFloat(bc.borg_amount).toFixed(2))}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Customer response form */}
                                  {canRespond && (
                                    <div className="bg-primary/5 rounded-xl p-4 border-2 border-primary/20">
                                      <h4 className="font-bold text-foreground mb-1">{t('myAccount.yourAssessment')}</h4>
                                      <p className="text-xs text-muted mb-3">
                                        {(beschadigdItems > 0 || ontbreektItems > 0)
                                          ? t('myAccount.assessmentIssues')
                                          : t('myAccount.assessmentOk')}
                                      </p>
                                      <textarea
                                        value={respondingBorgId === bc.id ? borgNotes : ''}
                                        onFocus={() => setRespondingBorgId(bc.id)}
                                        onChange={(e) => { setRespondingBorgId(bc.id); setBorgNotes(e.target.value); }}
                                        rows={2}
                                        placeholder={t('myAccount.commentsOptional')}
                                        className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 mb-3"
                                      />
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                          onClick={() => handleBorgResponse(bc.token, true)}
                                          disabled={submittingBorg}
                                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold transition-colors text-sm disabled:opacity-50"
                                        >
                                          {submittingBorg ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                                          {t('myAccount.agree')}
                                        </button>
                                        <button
                                          onClick={() => handleBorgResponse(bc.token, false)}
                                          disabled={submittingBorg}
                                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-danger text-white rounded-xl font-semibold transition-colors text-sm disabled:opacity-50"
                                        >
                                          {submittingBorg ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                                          {t('myAccount.object')}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* View full page link */}
                                  <div className="pt-2">
                                    <Link
                                      href={`/borg/${bc.token}`}
                                      className="flex items-center gap-1.5 text-primary text-sm font-medium"
                                      target="_blank"
                                    >
                                      <ExternalLink size={13} />
                                      {t('myAccount.viewFullChecklist')}
                                    </Link>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}

                  {/* How borg works */}
                  <div className="bg-white rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-3">{t('myAccount.howBorgWorks')}</h3>
                    <div className="space-y-3">
                      {[
                        { step: '1', title: t('myAccount.borgStep1Title'), desc: t('myAccount.borgStep1Desc') },
                        { step: '2', title: t('myAccount.borgStep2Title'), desc: t('myAccount.borgStep2Desc') },
                        { step: '3', title: t('myAccount.borgStep3Title'), desc: t('myAccount.borgStep3Desc') },
                        { step: '4', title: t('myAccount.borgStep4Title'), desc: t('myAccount.borgStep4Desc') },
                      ].map(s => (
                        <div key={s.step} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-primary text-xs font-bold">{s.step}</div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{s.title}</div>
                            <div className="text-xs text-muted">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== VOORWAARDEN ==================== */}
              {tab === 'voorwaarden' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{t('myAccount.termsTitle')}</h2>
                    <p className="text-xs text-muted mt-0.5">{t('myAccount.termsSubtitle')}</p>
                  </div>

                  {/* Quick overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: <CreditCard size={18} />, title: t('myAccount.termsPayment'), desc: t('myAccount.termsPaymentDesc') },
                      { icon: <XCircle size={18} />, title: t('myAccount.termsCancellation'), desc: t('myAccount.termsCancellationDesc') },
                      { icon: <Shield size={18} />, title: t('myAccount.termsDeposit'), desc: t('myAccount.termsDepositDesc') },
                      { icon: <Clock size={18} />, title: t('myAccount.termsCheckInOut'), desc: t('myAccount.termsCheckInOutDesc') },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center shrink-0 text-primary">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                            <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Important rules */}
                  <div className="bg-white rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      {t('myAccount.termsImportant')}
                    </h3>
                    <div className="space-y-3">
                      {[
                        t('myAccount.termsRule1'),
                        t('myAccount.termsRule2'),
                        t('myAccount.termsRule3'),
                        t('myAccount.termsRule4'),
                        t('myAccount.termsRule5'),
                      ].map((rule, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                          <p className="text-sm text-foreground-light leading-relaxed">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cancellation policy */}
                  <div className="bg-white rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-primary" />
                      {t('myAccount.termsCancellationTitle')}
                    </h3>
                    <div className="space-y-2">
                      {[
                        { period: t('myAccount.termsCancelPeriod1'), pct: '100%', color: 'bg-primary/8 text-primary' },
                        { period: t('myAccount.termsCancelPeriod2'), pct: '50%', color: 'bg-primary/5 text-primary' },
                        { period: t('myAccount.termsCancelPeriod3'), pct: '0%', color: 'bg-danger/5 text-danger' },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${item.color}`}>
                          <span className="text-sm">{item.period}</span>
                          <span className="text-sm font-bold">{t('myAccount.termsCancelRefund').replace('{pct}', item.pct)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full terms link */}
                  <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{t('myAccount.termsFullTitle')}</h3>
                        <p className="text-xs text-muted mt-0.5">{t('myAccount.termsFullDesc')}</p>
                      </div>
                      <Link
                        href="/voorwaarden"
                        target="_blank"
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                      >
                        <ExternalLink size={14} />
                        {t('myAccount.termsReadFull')}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== TIPS ==================== */}
              {tab === 'tips' && (
                <div className="space-y-5">
                  {(() => {
                    const booking = upcomingBooking || activeBookings[0] || bookings[0];
                    const camping = booking ? getCamping(booking.camping_id) : null;
                    const location = camping?.location || 'Sant Pere Pescador';
                    const activities = getActivitiesForLocation(location);
                    const grouped = groupActivitiesByCategory(activities);
                    const categoryOrder: Activity['category'][] = ['strand', 'sport', 'natuur', 'cultuur', 'kinderen', 'culinair', 'uitstap'];
                    const sortedCategories = categoryOrder.filter(c => grouped[c]?.length);
                    // Find matching destination for link
                    const dest = destinations.find(d =>
                      d.name.toLowerCase() === location.toLowerCase() ||
                      location.toLowerCase().includes(d.name.toLowerCase()) ||
                      d.name.toLowerCase().includes(location.toLowerCase())
                    );

                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center shrink-0">
                            <Compass size={20} className="text-primary" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">Tips & activiteiten</h2>
                            <p className="text-sm text-muted">
                              Ontdek de mooiste plekken bij {location}
                              {dest && (
                                <> &mdash; <Link href={`/bestemmingen/${dest.slug}`} className="text-primary font-medium hover:underline">Meer over {dest.name} →</Link></>
                              )}
                            </p>
                          </div>
                        </div>

                        {booking && camping && (
                          <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3">
                            <MapPin size={18} className="text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{camping.name}</p>
                              <p className="text-xs text-muted">{camping.location} &middot; {booking.check_in ? new Date(booking.check_in).toLocaleDateString(dateLoc, { day: 'numeric', month: 'long' }) : ''} – {booking.check_out ? new Date(booking.check_out).toLocaleDateString(dateLoc, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-2xl overflow-hidden">
                          <div className="p-5 sm:p-6 space-y-4">
                            {sortedCategories.map((cat) => (
                              <div key={cat}>
                                <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-primary" />
                                  {getCategoryLabel(cat, locale)}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {grouped[cat].map((act) => (
                                    <div key={act.id} className="bg-[#FAFAF9] rounded-xl p-3 transition-colors group">
                                      <div className="flex items-start gap-2.5">
                                        <span className="text-lg mt-0.5 shrink-0">{act.icon}</span>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h5 className="text-sm font-semibold text-foreground leading-tight">{act.title}</h5>
                                            {act.distance && (
                                              <span className="text-xs text-muted bg-white px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                                {act.distance}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted mt-0.5 leading-relaxed">{act.description}</p>
                                          {act.tip && (
                                            <div className="mt-1.5 flex items-start gap-1.5 bg-primary/5 rounded-lg px-2 py-1.5">
                                              <Lightbulb size={11} className="text-primary mt-0.5 shrink-0" />
                                              <p className="text-xs text-primary-dark leading-relaxed">{act.tip}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* General tips */}
                            <div className="pt-4">
                              <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Star size={10} className="text-primary" />
                                Algemene tips Costa Brava
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {generalTips.slice(0, 4).map((act) => (
                                  <div key={act.id} className="bg-[#FAFAF9] rounded-xl p-3">
                                    <div className="flex items-start gap-2.5">
                                      <span className="text-lg mt-0.5 shrink-0">{act.icon}</span>
                                      <div className="min-w-0">
                                        <h5 className="text-sm font-semibold text-foreground leading-tight">{act.title}</h5>
                                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{act.description}</p>
                                        {act.tip && (
                                          <div className="mt-1.5 flex items-start gap-1.5 bg-primary/5 rounded-lg px-2 py-1.5">
                                            <Lightbulb size={11} className="text-primary mt-0.5 shrink-0" />
                                            <p className="text-xs text-primary-dark leading-relaxed">{act.tip}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ==================== PROFIEL ==================== */}
              {tab === 'profiel' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground tracking-tight mb-4">{t('myAccount.myProfile')}</h2>

                  {/* Profile card */}
                  <div className="bg-white rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{customer.name}</h3>
                          <p className="text-xs text-muted">{t('myAccount.customerSince').replace('{date}', customer.created_at ? new Date(customer.created_at).toLocaleDateString(dateLoc, { month: 'long', year: 'numeric' }) : '2026')}</p>
                        </div>
                      </div>
                      {!editingProfile && (
                        <button onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/8 px-3.5 py-2 rounded-lg transition-colors">
                          <Edit3 size={13} /> {t('myAccount.edit')}
                        </button>
                      )}
                    </div>

                    {editingProfile ? (
                      <div className="space-y-3 pt-3">
                        <div>
                          <label className="text-xs font-semibold text-foreground-light mb-1.5 block">{t('myAccount.name')}</label>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3.5 py-3 bg-surface border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground-light mb-1.5 block">{t('myAccount.phone')}</label>
                          <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3.5 py-3 bg-surface border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={handleSaveProfile} disabled={saving}
                            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('myAccount.save')}
                          </button>
                          <button onClick={() => { setEditingProfile(false); setEditName(customer.name); setEditPhone(customer.phone || ''); }}
                            className="px-5 py-2.5 bg-surface-alt text-foreground-light font-semibold rounded-xl text-sm transition-colors">
                            {t('myAccount.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-3">
                        {[
                          { icon: <User size={16} />, label: t('myAccount.name'), value: customer.name },
                          { icon: <Mail size={16} />, label: t('myAccount.email'), value: customer.email },
                          { icon: <Phone size={16} />, label: t('myAccount.phone'), value: customer.phone || '—' },
                        ].map(field => (
                          <div key={field.label} className="flex items-center gap-3 py-1.5">
                            <span className="text-muted">{field.icon}</span>
                            <div>
                              <div className="text-xs text-muted uppercase tracking-wider">{field.label}</div>
                              <div className="text-sm font-medium text-foreground">{field.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Newsletter subscription */}
                  <div className="bg-white rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                      <Mail size={16} className="text-primary" />
                      Nieuwsbrief
                    </h3>
                    <p className="text-xs text-muted mb-3 leading-relaxed">
                      Ontvang updates over evenementen, activiteiten en aanbiedingen aan de Costa Brava.
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-sm font-medium ${newsletterUnsubscribed ? 'text-muted' : 'text-primary'}`}>
                          {togglingNewsletter ? 'Even geduld...' : newsletterUnsubscribed ? 'Uitgeschreven' : 'Ingeschreven'}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          setTogglingNewsletter(true);
                          const newValue = !newsletterUnsubscribed;
                          try {
                            const res = await fetch('/api/auth/me', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ newsletterUnsubscribed: newValue }),
                            });
                            if (res.ok) {
                              setNewsletterUnsubscribed(newValue);
                            } else {
                              alert('Kon nieuwsbrief voorkeur niet opslaan. Probeer opnieuw.');
                            }
                          } catch {
                            alert('Netwerkfout. Probeer opnieuw.');
                          }
                          setTogglingNewsletter(false);
                        }}
                        disabled={togglingNewsletter}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                          !newsletterUnsubscribed ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          !newsletterUnsubscribed ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* GDPR / Danger zone */}
                  <div className="bg-white rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-1">{t('myAccount.privacyData')}</h3>
                    <p className="text-xs text-muted mb-3 leading-relaxed">
                      {t('myAccount.gdprText')}
                    </p>

                    {!showDeleteConfirm ? (
                      <button onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs text-danger/70 font-medium transition-colors flex items-center gap-1">
                        <Trash2 size={12} /> {t('myAccount.deleteAccount')}
                      </button>
                    ) : deleteEmailSent ? (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-2">
                        <div className="flex items-start gap-2">
                          <Mail size={16} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Bevestigingsmail verzonden</p>
                            <p className="text-xs text-muted mt-0.5">
                              We hebben een bevestigingslink naar <strong>{customer.email}</strong> gestuurd. Klik op de link in de e-mail om je account definitief te verwijderen.
                            </p>
                            <p className="text-xs text-muted mt-2">De link is 24 uur geldig.</p>
                          </div>
                        </div>
                        <button onClick={() => { setShowDeleteConfirm(false); setDeleteEmailSent(false); }}
                          className="text-xs text-muted font-medium transition-colors">
                          Sluiten
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-danger/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-danger">{t('myAccount.deleteConfirmTitle')}</p>
                            <p className="text-xs text-danger mt-0.5">{t('myAccount.deleteConfirmDesc')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleDeleteAccount} disabled={deleting}
                            className="flex-1 py-2.5 bg-danger text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            {t('myAccount.deleteConfirmYes')}
                          </button>
                          <button onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2.5 bg-white text-foreground-light text-xs font-semibold rounded-lg transition-colors">
                            {t('myAccount.deleteConfirmNo')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-4 pt-3 z-40" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2">
          <Link href="/boeken" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl">
            <Plus size={16} /> {t('myAccount.newBooking')}
          </Link>
          <button onClick={handleLogout} className="px-4 py-2.5 text-foreground-light rounded-xl text-sm transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
      {/* Bottom spacer for mobile */}
      <div className="h-24 lg:hidden" />

      {/* Cancel booking confirmation modal */}
      <AnimatePresence>
        {cancelConfirmId && !cancelResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setCancelConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <XCircle size={24} className="text-danger" />
              </div>
              <h3 className="text-lg font-bold text-foreground text-center mb-2">Boeking annuleren?</h3>
              {(() => {
                const booking = bookings.find(b => b.id === cancelConfirmId);
                if (!booking) return null;
                const checkIn = new Date(booking.check_in);
                const daysUntil = Math.ceil((checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                let refundText = '';
                let refundColor = '';
                if (daysUntil > 30) { refundText = '100% restitutie aanbetaling'; refundColor = 'text-primary'; }
                else if (daysUntil >= 14) { refundText = '50% restitutie aanbetaling'; refundColor = 'text-primary'; }
                else { refundText = 'Geen restitutie mogelijk'; refundColor = 'text-danger'; }
                return (
                  <div className="text-center space-y-2 mb-5">
                    <p className="text-sm text-muted">
                      Boeking <strong className="text-foreground">{booking.reference}</strong> ({daysUntil} dagen voor aankomst)
                    </p>
                    <p className={`text-sm font-semibold ${refundColor}`}>{refundText}</p>
                    <p className="text-xs text-muted">Dit kan niet ongedaan worden gemaakt.</p>
                  </div>
                );
              })()}
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelConfirmId(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-foreground bg-surface rounded-xl transition-colors cursor-pointer"
                >
                  Terug
                </button>
                <button
                  onClick={() => handleCancelBooking(cancelConfirmId)}
                  disabled={cancellingBookingId === cancelConfirmId}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-danger rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancellingBookingId === cancelConfirmId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  Annuleren
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel result modal */}
      <AnimatePresence>
        {cancelResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setCancelResult(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Boeking geannuleerd</h3>
              <p className="text-sm text-muted mb-4">{cancelResult.refundMessage}</p>
              <button
                onClick={() => setCancelResult(null)}
                className="w-full py-2.5 text-sm font-semibold text-white bg-primary rounded-xl transition-colors cursor-pointer"
              >
                Sluiten
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
