'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Calendar, CreditCard, ClipboardCheck, ChevronRight,
  MapPin, Users, Phone, Mail, Edit3, Check, X, Loader2, AlertCircle,
  Clock, CheckCircle, ArrowRight, FileText, Sun, Shield, Star,
  CheckCircle2, AlertTriangle, XCircle, Minus, MessageSquare,
  ThumbsUp, ThumbsDown, Trash2, ExternalLink, ChevronDown,
} from 'lucide-react';
import { caravans } from '@/data/caravans';
import { campings } from '@/data/campings';

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

type Tab = 'overzicht' | 'boekingen' | 'betalingen' | 'borg' | 'profiel';

// ===== HELPERS =====
const statusColors: Record<string, string> = {
  NIEUW: 'bg-blue-100 text-blue-700',
  BEVESTIGD: 'bg-emerald-100 text-emerald-700',
  BETAALD: 'bg-emerald-100 text-emerald-700',
  AANBETAALD: 'bg-amber-100 text-amber-700',
  GEANNULEERD: 'bg-red-100 text-red-700',
  AFGEROND: 'bg-gray-100 text-gray-600',
  OPENSTAAND: 'bg-amber-100 text-amber-700',
  OPEN: 'bg-blue-100 text-blue-700',
  IN_BEHANDELING: 'bg-blue-100 text-blue-700',
  AFGEROND_GOED: 'bg-emerald-100 text-emerald-700',
  KLANT_AKKOORD: 'bg-emerald-100 text-emerald-700',
  KLANT_BEZWAAR: 'bg-red-100 text-red-700',
};

const statusLabelsNL: Record<string, string> = {
  NIEUW: 'Nieuw',
  BEVESTIGD: 'Bevestigd',
  BETAALD: 'Betaald',
  AANBETAALD: 'Aanbetaald',
  GEANNULEERD: 'Geannuleerd',
  AFGEROND: 'Afgerond',
  OPENSTAAND: 'Openstaand',
  OPEN: 'In voorbereiding',
  IN_BEHANDELING: 'Wordt ingevuld',
  KLANT_AKKOORD: 'Akkoord',
  KLANT_BEZWAAR: 'Bezwaar',
};

const borgItemIcons: Record<string, React.ReactNode> = {
  nvt: <Minus size={14} className="text-gray-300" />,
  goed: <CheckCircle2 size={14} className="text-emerald-500" />,
  beschadigd: <AlertTriangle size={14} className="text-amber-500" />,
  ontbreekt: <XCircle size={14} className="text-red-500" />,
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatPrice(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}
function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ===== MAIN COMPONENT =====
export default function MijnAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [borgChecklists, setBorgChecklists] = useState<BorgChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overzicht');

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // GDPR
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Borg response
  const [respondingBorgId, setRespondingBorgId] = useState<string | null>(null);
  const [borgNotes, setBorgNotes] = useState('');
  const [submittingBorg, setSubmittingBorg] = useState(false);
  const [expandedBorgId, setExpandedBorgId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.push('/account'); return; }
      const data = await res.json();
      setCustomer(data.customer);
      setBookings(data.bookings || []);
      setPayments(data.payments || []);
      setBorgChecklists(data.borgChecklists || []);
      setEditName(data.customer.name);
      setEditPhone(data.customer.phone || '');
    } catch {
      router.push('/account');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      await fetch('/api/auth/me', { method: 'DELETE' });
      router.push('/account');
    } catch {
      setDeleting(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Je gegevens laden...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const getCaravan = (id: string) => caravans.find(c => c.id === id);
  const getCamping = (id: string) => campings.find(c => c.id === id);
  const activeBookings = bookings.filter(b => !['GEANNULEERD', 'AFGEROND'].includes(b.status));
  const openPayments = payments.filter(p => p.status === 'OPENSTAAND');
  const upcomingBooking = activeBookings.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime()).find(b => new Date(b.check_in) > new Date());
  const openBorg = borgChecklists.filter(bc => bc.status === 'AFGEROND');
  const firstName = customer.name.split(' ')[0];

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overzicht', label: 'Overzicht', icon: <User size={18} /> },
    { key: 'boekingen', label: 'Boekingen', icon: <Calendar size={18} />, badge: activeBookings.length || undefined },
    { key: 'betalingen', label: 'Betalingen', icon: <CreditCard size={18} />, badge: openPayments.length || undefined },
    { key: 'borg', label: 'Borg', icon: <Shield size={18} />, badge: openBorg.length || undefined },
    { key: 'profiel', label: 'Profiel', icon: <Edit3 size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-br from-primary-dark via-primary to-primary-light px-4 pt-6 pb-16 sm:pt-8 sm:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80"
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">Hallo, {firstName}!</h1>
                <p className="text-white/50 text-xs sm:text-sm">{customer.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs sm:text-sm transition-colors bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2">
              <LogOut size={14} />
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>

          {/* Quick stats bar */}
          {bookings.length > 0 && (
            <div className="flex gap-4 mt-5">
              {[
                { n: bookings.length, label: 'Boekingen' },
                { n: payments.filter(p => p.status === 'BETAALD').length, label: 'Betaald' },
                { n: borgChecklists.length, label: 'Checklists' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-white">{s.n}</div>
                  <div className="text-[10px] sm:text-xs text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== TAB BAR ===== */}
      <div className="-mt-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-white text-primary shadow-lg shadow-primary/10'
                    : 'bg-white/80 text-gray-500 hover:bg-white hover:shadow-sm'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge ? (
                  <span className="ml-0.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{t.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >

              {/* ==================== OVERZICHT ==================== */}
              {tab === 'overzicht' && (
                <div className="space-y-4">
                  {/* Upcoming trip hero card */}
                  {upcomingBooking && (() => {
                    const caravan = getCaravan(upcomingBooking.caravan_id);
                    const camping = getCamping(upcomingBooking.camping_id);
                    const days = daysUntil(upcomingBooking.check_in);
                    return (
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary to-primary-light">
                          {caravan?.photos?.[0] && (
                            <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover opacity-30" unoptimized />
                          )}
                          <div className="absolute inset-0 flex items-center justify-between px-5 sm:px-6">
                            <div>
                              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Aankomende reis</p>
                              <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{caravan?.name || 'Caravan'}</h3>
                              <div className="flex items-center gap-2 text-white/70 text-sm mt-1">
                                <MapPin size={13} />
                                <span>{camping?.name || 'Camping'}</span>
                              </div>
                            </div>
                            <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3">
                              <div className="text-3xl sm:text-4xl font-bold text-white">{days}</div>
                              <div className="text-[10px] text-white/70 font-medium uppercase tracking-wider">
                                {days === 1 ? 'dag' : 'dagen'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Calendar size={13} className="text-primary" /> {formatDate(upcomingBooking.check_in)}</span>
                            <span className="text-gray-300">→</span>
                            <span>{formatDate(upcomingBooking.check_out)}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[upcomingBooking.status] || 'bg-gray-100 text-gray-600'}`}>
                              {statusLabelsNL[upcomingBooking.status] || upcomingBooking.status}
                            </span>
                          </div>
                          <button onClick={() => setTab('boekingen')} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                            Details <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Alerts */}
                  {openPayments.length > 0 && (
                    <button onClick={() => setTab('betalingen')} className="w-full bg-amber-50 rounded-2xl p-4 flex items-center gap-3 text-left border border-amber-100 hover:border-amber-200 transition-colors">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <CreditCard size={18} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-amber-800 text-sm">{openPayments.length} openstaande betaling{openPayments.length > 1 ? 'en' : ''}</div>
                        <div className="text-xs text-amber-600">Totaal: {formatPrice(openPayments.reduce((s, p) => s + Number(p.amount), 0))}</div>
                      </div>
                      <ChevronRight size={18} className="text-amber-400 shrink-0" />
                    </button>
                  )}

                  {openBorg.length > 0 && (
                    <button onClick={() => setTab('borg')} className="w-full bg-blue-50 rounded-2xl p-4 flex items-center gap-3 text-left border border-blue-100 hover:border-blue-200 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Shield size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-blue-800 text-sm">{openBorg.length} borgchecklist{openBorg.length > 1 ? 's' : ''} wacht{openBorg.length === 1 ? '' : 'en'} op je akkoord</div>
                        <div className="text-xs text-blue-600">Bekijk inspectie en reageer</div>
                      </div>
                      <ChevronRight size={18} className="text-blue-400 shrink-0" />
                    </button>
                  )}

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/boeken" className="bg-primary rounded-2xl p-5 text-white text-center hover:bg-primary-dark transition-colors group">
                      <Sun size={24} className="mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-sm font-semibold">Nieuwe boeking</div>
                      <div className="text-[10px] text-white/50 mt-0.5">Seizoen 2026</div>
                    </Link>
                    <Link href="/contact" className="bg-white rounded-2xl p-5 text-gray-700 text-center hover:bg-gray-50 transition-colors border border-gray-100 group">
                      <Mail size={24} className="mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                      <div className="text-sm font-semibold">Contact opnemen</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Hulp nodig?</div>
                    </Link>
                  </div>

                  {/* Empty state */}
                  {bookings.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-gray-100">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sun size={28} className="text-primary" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">Nog geen boekingen</h3>
                      <p className="text-sm text-gray-500 mt-2 mb-5 max-w-sm mx-auto">
                        Plan je eerste caravanvakantie aan de Costa Brava! Kies uit 6 caravans bij 30+ campings.
                      </p>
                      <Link href="/boeken" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
                        Boek nu <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== BOEKINGEN ==================== */}
              {tab === 'boekingen' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-gray-800">Mijn boekingen</h2>
                    <span className="text-xs text-gray-400">{bookings.length} totaal</span>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-500 text-sm">Je hebt nog geen boekingen</p>
                      <Link href="/boeken" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold mt-4 hover:bg-primary-dark transition-colors">
                        Boek nu <ArrowRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    bookings.map(booking => {
                      const caravan = getCaravan(booking.caravan_id);
                      const camping = getCamping(booking.camping_id);
                      const isPast = new Date(booking.check_out) < new Date();
                      return (
                        <div key={booking.id} className={`bg-white rounded-2xl overflow-hidden border transition-colors ${isPast ? 'border-gray-100 opacity-75' : 'border-gray-100 hover:border-primary/20'}`}>
                          {/* Caravan image strip */}
                          {caravan?.photos?.[0] && !isPast && (
                            <div className="relative h-24 sm:h-28">
                              <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover" unoptimized />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                                <div>
                                  <h3 className="font-bold text-white text-sm">{caravan.name}</h3>
                                  <div className="text-white/70 text-xs flex items-center gap-1"><MapPin size={10} />{camping?.name || 'Camping'}</div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>
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
                                    <span className="font-mono text-[10px] text-gray-400">{booking.reference}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                                      {statusLabelsNL[booking.status] || booking.status}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-gray-800 mt-1 text-sm">{caravan?.name || `Caravan`}</h3>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-800 text-sm">{formatPrice(Number(booking.total_price))}</div>
                                </div>
                              </div>
                            )}

                            {/* Details grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Calendar size={13} className="text-primary shrink-0" />
                                <span className="truncate">{formatDate(booking.check_in)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <Calendar size={13} className="text-primary shrink-0" />
                                <span className="truncate">{formatDate(booking.check_out)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <Clock size={13} className="text-primary shrink-0" />
                                <span>{booking.nights} nachten</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <Users size={13} className="text-primary shrink-0" />
                                <span>{booking.adults} volw.{booking.children > 0 ? ` + ${booking.children} kind.` : ''}</span>
                              </div>
                            </div>

                            {/* Payment progress */}
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              {(() => {
                                const bookingPayments = payments.filter(p => p.booking_id === booking.id);
                                const paid = bookingPayments.filter(p => p.status === 'BETAALD').reduce((s, p) => s + Number(p.amount), 0);
                                const total = Number(booking.total_price);
                                const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                                return (
                                  <div>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                      <span className="text-gray-500">Betaald {formatPrice(paid)} van {formatPrice(total)}</span>
                                      <span className="font-semibold text-gray-700">{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Reference footer for image-cards */}
                            {!isPast && caravan?.photos?.[0] && (
                              <div className="mt-3 flex items-center justify-between">
                                <span className="font-mono text-[10px] text-gray-400">{booking.reference}</span>
                                <span className="text-sm font-bold text-gray-800">{formatPrice(Number(booking.total_price))}</span>
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
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-gray-800">Betalingen</h2>
                  </div>

                  {/* Payment summary card */}
                  {payments.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Betaald</div>
                          <div className="text-lg font-bold text-emerald-600">
                            {formatPrice(payments.filter(p => p.status === 'BETAALD').reduce((s, p) => s + Number(p.amount), 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Openstaand</div>
                          <div className="text-lg font-bold text-amber-600">
                            {formatPrice(openPayments.reduce((s, p) => s + Number(p.amount), 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Totaal</div>
                          <div className="text-lg font-bold text-gray-800">
                            {formatPrice(payments.reduce((s, p) => s + Number(p.amount), 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {payments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <CreditCard size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-500 text-sm">Geen betalingen gevonden</p>
                    </div>
                  ) : (
                    payments.map(payment => {
                      const booking = bookings.find(b => b.id === payment.booking_id);
                      return (
                        <div key={payment.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            payment.status === 'BETAALD' ? 'bg-emerald-50' : 'bg-amber-50'
                          }`}>
                            {payment.status === 'BETAALD' ? <CheckCircle size={18} className="text-emerald-500" /> : <Clock size={18} className="text-amber-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800">{payment.type}</div>
                            <div className="text-xs text-gray-400">{booking?.reference || 'Boeking'} &middot; {payment.paid_at ? formatDate(payment.paid_at) : 'Nog niet betaald'}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm text-gray-800">{formatPrice(Number(payment.amount))}</div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                              {statusLabelsNL[payment.status] || payment.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Payment instructions */}
                  {openPayments.length > 0 && (
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Betaalinstructies</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Maak het openstaande bedrag over naar <strong>NL00 ABNA 0000 0000 00</strong> o.v.v. je boekingsnummer.
                        Na ontvangst wordt de betaling automatisch geregistreerd.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== BORG ==================== */}
              {tab === 'borg' && (
                <div className="space-y-4">
                  <div className="mb-1">
                    <h2 className="text-lg font-bold text-gray-800">Borgchecklists</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Bekijk inspectierapporten van je caravan bij in- en uitchecken</p>
                  </div>

                  {borgChecklists.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-gray-100">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={28} className="text-primary" />
                      </div>
                      <h3 className="font-bold text-gray-800">Nog geen borgchecklists</h3>
                      <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                        Checklists worden aangemaakt wanneer je caravan wordt geïnspecteerd bij check-in en check-out.
                        Je wordt genotificeerd zodra er een beschikbaar is.
                      </p>
                      <div className="mt-5 flex items-center justify-center gap-6 text-xs text-gray-400">
                        {[
                          { icon: <ClipboardCheck size={14} />, text: 'Check-in inspectie' },
                          { icon: <Shield size={14} />, text: 'Check-out inspectie' },
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
                        <div key={bc.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                          {/* Header */}
                          <button
                            onClick={() => setExpandedBorgId(isExpanded ? null : bc.id)}
                            className="w-full p-4 sm:p-5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left"
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                              bc.type === 'INCHECKEN' ? 'bg-primary/10' : 'bg-amber-50'
                            }`}>
                              <ClipboardCheck size={20} className={bc.type === 'INCHECKEN' ? 'text-primary' : 'text-amber-600'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-gray-800">
                                  {bc.type === 'INCHECKEN' ? 'Incheck-inspectie' : 'Uitcheck-inspectie'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[bc.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {statusLabelsNL[bc.status] || bc.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>{bc.booking_ref}</span>
                                <span>{caravan?.name || bc.caravan_id}</span>
                                {canRespond && <span className="text-primary font-medium animate-pulse">Actie vereist</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {/* Mini summary */}
                              <div className="hidden sm:flex items-center gap-2 text-xs">
                                {goedItems > 0 && <span className="text-emerald-600 font-medium">{goedItems} ok</span>}
                                {beschadigdItems > 0 && <span className="text-amber-600 font-medium">{beschadigdItems} schade</span>}
                                {ontbreektItems > 0 && <span className="text-red-600 font-medium">{ontbreektItems} mist</span>}
                              </div>
                              <ChevronDown size={18} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                                <div className="border-t border-gray-100 p-4 sm:p-5 space-y-4">
                                  {/* Summary cards */}
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                      <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                      <div className="text-lg font-bold text-emerald-700 mt-1">{goedItems}</div>
                                      <div className="text-[10px] text-emerald-600 font-medium">In orde</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                                      <AlertTriangle size={18} className="text-amber-500 mx-auto" />
                                      <div className="text-lg font-bold text-amber-700 mt-1">{beschadigdItems}</div>
                                      <div className="text-[10px] text-amber-600 font-medium">Beschadigd</div>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-3 text-center">
                                      <XCircle size={18} className="text-red-500 mx-auto" />
                                      <div className="text-lg font-bold text-red-700 mt-1">{ontbreektItems}</div>
                                      <div className="text-[10px] text-red-600 font-medium">Ontbreekt</div>
                                    </div>
                                  </div>

                                  {/* Checklist items */}
                                  {Object.entries(grouped).map(([category, catItems]) => (
                                    <div key={category}>
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{category}</h4>
                                      <div className="space-y-1">
                                        {catItems.map(item => (
                                          <div key={item.item} className="flex items-start gap-2 py-1.5">
                                            {borgItemIcons[item.status]}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm text-gray-700">{item.item}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                  item.status === 'goed' ? 'bg-emerald-100 text-emerald-700' :
                                                  item.status === 'beschadigd' ? 'bg-amber-100 text-amber-700' :
                                                  item.status === 'ontbreekt' ? 'bg-red-100 text-red-700' :
                                                  'bg-gray-100 text-gray-400'
                                                }`}>
                                                  {item.status === 'nvt' ? 'N.v.t.' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                </span>
                                              </div>
                                              {item.notes && (
                                                <p className="text-xs text-gray-400 mt-0.5 flex items-start gap-1">
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
                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                      <h4 className="text-xs font-semibold text-blue-800 mb-1">Opmerkingen medewerker</h4>
                                      <p className="text-sm text-blue-700">{bc.general_notes}</p>
                                    </div>
                                  )}

                                  {/* Customer already responded */}
                                  {hasResponded && (
                                    <div className={`rounded-xl p-4 border ${bc.customer_agreed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                      <div className="flex items-center gap-2 mb-1">
                                        {bc.customer_agreed ? <ThumbsUp size={16} className="text-emerald-500" /> : <ThumbsDown size={16} className="text-red-500" />}
                                        <h4 className="font-semibold text-sm">{bc.customer_agreed ? 'Je bent akkoord gegaan' : 'Je hebt bezwaar ingediend'}</h4>
                                      </div>
                                      {bc.customer_agreed_at && (
                                        <p className="text-xs text-gray-400 mb-1">Op {new Date(bc.customer_agreed_at).toLocaleString('nl-NL')}</p>
                                      )}
                                      {bc.customer_notes && (
                                        <p className="text-sm mt-2 bg-white/60 rounded-lg p-2">{bc.customer_notes}</p>
                                      )}
                                      {bc.customer_agreed && bc.borg_amount && (
                                        <p className="text-sm text-emerald-700 mt-2">
                                          Borg van &euro;{parseFloat(bc.borg_amount).toFixed(2)} wordt geretourneerd na goede uitcheck-inspectie.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Customer response form */}
                                  {canRespond && (
                                    <div className="bg-primary/5 rounded-xl p-4 border-2 border-primary/20">
                                      <h4 className="font-bold text-gray-800 mb-1">Jouw beoordeling</h4>
                                      <p className="text-xs text-gray-500 mb-3">
                                        {(beschadigdItems > 0 || ontbreektItems > 0)
                                          ? 'Er zijn aandachtspunten gevonden. Bekijk de details hierboven en geef je akkoord of dien bezwaar in.'
                                          : 'De inspectie is zonder bijzonderheden afgerond. Bevestig hieronder.'}
                                      </p>
                                      <textarea
                                        value={respondingBorgId === bc.id ? borgNotes : ''}
                                        onFocus={() => setRespondingBorgId(bc.id)}
                                        onChange={(e) => { setRespondingBorgId(bc.id); setBorgNotes(e.target.value); }}
                                        rows={2}
                                        placeholder="Opmerkingen (optioneel)..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 mb-3"
                                      />
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                          onClick={() => handleBorgResponse(bc.token, true)}
                                          disabled={submittingBorg}
                                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors text-sm disabled:opacity-50"
                                        >
                                          {submittingBorg ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                                          Akkoord
                                        </button>
                                        <button
                                          onClick={() => handleBorgResponse(bc.token, false)}
                                          disabled={submittingBorg}
                                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                                        >
                                          {submittingBorg ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                                          Bezwaar
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* View full page link */}
                                  <div className="pt-2 border-t border-gray-100">
                                    <Link
                                      href={`/borg/${bc.token}`}
                                      className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
                                      target="_blank"
                                    >
                                      <ExternalLink size={13} />
                                      Volledige checklist bekijken
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
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Hoe werkt de borg?</h3>
                    <div className="space-y-3">
                      {[
                        { step: '1', title: 'Check-in inspectie', desc: 'Bij aankomst inspecteren wij de caravan samen met jou.' },
                        { step: '2', title: 'Jouw akkoord', desc: 'Je ontvangt de checklist digitaal en geeft akkoord via deze portal.' },
                        { step: '3', title: 'Uitcheck inspectie', desc: 'Bij vertrek wordt de caravan opnieuw gecontroleerd.' },
                        { step: '4', title: 'Borg retour', desc: 'Bij geen schade ontvang je je volledige borg terug.' },
                      ].map(s => (
                        <div key={s.step} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-primary text-xs font-bold">{s.step}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{s.title}</div>
                            <div className="text-xs text-gray-400">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== PROFIEL ==================== */}
              {tab === 'profiel' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Mijn profiel</h2>

                  {/* Profile card */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{customer.name}</h3>
                          <p className="text-xs text-gray-400">Klant sinds {customer.created_at ? new Date(customer.created_at).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) : '2026'}</p>
                        </div>
                      </div>
                      {!editingProfile && (
                        <button onClick={() => setEditingProfile(true)} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                          <Edit3 size={13} /> Bewerken
                        </button>
                      )}
                    </div>

                    {editingProfile ? (
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Naam</label>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Telefoonnummer</label>
                          <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={handleSaveProfile} disabled={saving}
                            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1 hover:bg-primary-dark transition-colors disabled:opacity-50">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Opslaan
                          </button>
                          <button onClick={() => { setEditingProfile(false); setEditName(customer.name); setEditPhone(customer.phone || ''); }}
                            className="px-5 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                            Annuleer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        {[
                          { icon: <User size={16} />, label: 'Naam', value: customer.name },
                          { icon: <Mail size={16} />, label: 'E-mail', value: customer.email },
                          { icon: <Phone size={16} />, label: 'Telefoon', value: customer.phone || '—' },
                        ].map(field => (
                          <div key={field.label} className="flex items-center gap-3 py-1.5">
                            <span className="text-gray-300">{field.icon}</span>
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{field.label}</div>
                              <div className="text-sm font-medium text-gray-800">{field.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Account actions */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
                    <h3 className="text-sm font-bold text-gray-800">Account</h3>
                    <button onClick={handleLogout}
                      className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <LogOut size={15} /> Uitloggen
                    </button>
                  </div>

                  {/* GDPR / Danger zone */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Privacy & gegevens</h3>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                      Op grond van de AVG/GDPR heb je het recht om je account en alle gekoppelde gegevens permanent te laten verwijderen.
                    </p>

                    {!showDeleteConfirm ? (
                      <button onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors flex items-center gap-1">
                        <Trash2 size={12} /> Account en gegevens verwijderen
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 rounded-xl p-4 border border-red-100 space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-800">Weet je het zeker?</p>
                            <p className="text-xs text-red-600 mt-0.5">Dit verwijdert je account, gegevens en sessies permanent. Dit kan niet ongedaan worden gemaakt.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleDeleteAccount} disabled={deleting}
                            className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Ja, verwijder definitief
                          </button>
                          <button onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2.5 bg-white text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                            Toch niet
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
