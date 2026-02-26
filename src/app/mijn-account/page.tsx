'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Calendar, CreditCard, ClipboardCheck, ChevronRight,
  MapPin, Users, Phone, Mail, Edit3, Check, X, Loader2, AlertCircle,
  Clock, CheckCircle, ArrowRight, FileText,
} from 'lucide-react';
import { caravans } from '@/data/caravans';
import { campings } from '@/data/campings';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
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

interface BorgChecklist {
  id: string;
  booking_ref: string;
  type: string;
  status: string;
  token: string;
  caravan_id: string;
}

type Tab = 'overzicht' | 'boekingen' | 'betalingen' | 'borg' | 'profiel';

const statusColors: Record<string, string> = {
  NIEUW: 'bg-blue-100 text-blue-700',
  BEVESTIGD: 'bg-emerald-100 text-emerald-700',
  BETAALD: 'bg-emerald-100 text-emerald-700',
  AANBETAALD: 'bg-amber-100 text-amber-700',
  GEANNULEERD: 'bg-red-100 text-red-700',
  AFGEROND: 'bg-gray-100 text-gray-600',
  OPENSTAAND: 'bg-amber-100 text-amber-700',
  OPEN: 'bg-blue-100 text-blue-700',
  AFGEROND_GOED: 'bg-emerald-100 text-emerald-700',
  KLANT_AKKOORD: 'bg-emerald-100 text-emerald-700',
  KLANT_BEZWAAR: 'bg-red-100 text-red-700',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function MijnAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [borgChecklists, setBorgChecklists] = useState<BorgChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overzicht');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/account');
        return;
      }
      const data = await res.json();
      setCustomer(data.customer);
      setBookings(data.bookings);
      setPayments(data.payments);
      setBorgChecklists(data.borgChecklists);
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
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      setCustomer(prev => prev ? { ...prev, name: editName, phone: editPhone } : null);
      setEditingProfile(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) return null;

  const getCaravan = (id: string) => caravans.find(c => c.id === id);
  const getCamping = (id: string) => campings.find(c => c.id === id);
  const activeBookings = bookings.filter(b => !['GEANNULEERD', 'AFGEROND'].includes(b.status));
  const openPayments = payments.filter(p => p.status === 'OPENSTAAND');
  const upcomingBooking = activeBookings.find(b => new Date(b.check_in) > new Date());

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overzicht', label: 'Overzicht', icon: <User size={18} /> },
    { key: 'boekingen', label: 'Boekingen', icon: <Calendar size={18} />, badge: activeBookings.length },
    { key: 'betalingen', label: 'Betalingen', icon: <CreditCard size={18} />, badge: openPayments.length },
    { key: 'borg', label: 'Borg', icon: <ClipboardCheck size={18} />, badge: borgChecklists.filter(b => b.status === 'OPEN').length },
    { key: 'profiel', label: 'Profiel', icon: <Edit3 size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary px-4 pt-6 pb-16 sm:pt-8 sm:pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Hallo, {customer.name.split(' ')[0]}!</h1>
              <p className="text-white/60 text-sm">{customer.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              <LogOut size={16} />
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar - scrollable on mobile */}
      <div className="-mt-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-white text-primary shadow-md'
                    : 'bg-white/80 text-gray-500 hover:bg-white'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge ? (
                  <span className="ml-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{t.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
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
              {/* ===== OVERZICHT ===== */}
              {tab === 'overzicht' && (
                <div className="space-y-4">
                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{bookings.length}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Boekingen</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600">{payments.filter(p => p.status === 'BETAALD').length}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Betaald</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">{openPayments.length}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Openstaand</div>
                    </div>
                  </div>

                  {/* Upcoming trip */}
                  {upcomingBooking && (
                    <div className="bg-white rounded-2xl p-5 border-l-4 border-primary">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-3">
                        <Calendar size={16} />
                        Aankomende reis
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-800">{getCaravan(upcomingBooking.caravan_id)?.name || 'Caravan'}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin size={12} />
                            {getCamping(upcomingBooking.camping_id)?.name || 'Camping'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} />
                            {formatDate(upcomingBooking.check_in)} — {formatDate(upcomingBooking.check_out)}
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[upcomingBooking.status] || 'bg-gray-100 text-gray-600'}`}>
                          {upcomingBooking.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Open payments alert */}
                  {openPayments.length > 0 && (
                    <button
                      onClick={() => setTab('betalingen')}
                      className="w-full bg-amber-50 rounded-2xl p-4 flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <AlertCircle size={18} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-amber-800 text-sm">
                          {openPayments.length} openstaande betaling{openPayments.length > 1 ? 'en' : ''}
                        </div>
                        <div className="text-xs text-amber-600">
                          Totaal: {formatPrice(openPayments.reduce((s, p) => s + Number(p.amount), 0))}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-amber-400 shrink-0" />
                    </button>
                  )}

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/boeken" className="bg-primary rounded-2xl p-4 text-white text-center hover:bg-primary-dark transition-colors">
                      <Calendar size={24} className="mx-auto mb-2" />
                      <div className="text-sm font-semibold">Nieuwe boeking</div>
                    </Link>
                    <Link href="/contact" className="bg-white rounded-2xl p-4 text-gray-700 text-center hover:bg-gray-50 transition-colors border border-gray-200">
                      <Mail size={24} className="mx-auto mb-2 text-primary" />
                      <div className="text-sm font-semibold">Contact</div>
                    </Link>
                  </div>

                  {/* No bookings */}
                  {bookings.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                      <h3 className="font-semibold text-gray-800">Nog geen boekingen</h3>
                      <p className="text-sm text-gray-500 mt-1 mb-4">Boek je eerste caravan op de Costa Brava!</p>
                      <Link href="/boeken" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
                        Boek nu <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* ===== BOEKINGEN ===== */}
              {tab === 'boekingen' && (
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">Geen boekingen gevonden</p>
                    </div>
                  ) : (
                    bookings.map(booking => {
                      const caravan = getCaravan(booking.caravan_id);
                      const camping = getCamping(booking.camping_id);
                      return (
                        <div key={booking.id} className="bg-white rounded-2xl p-4 sm:p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-gray-400">{booking.reference}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {booking.status}
                                </span>
                              </div>
                              <h3 className="font-semibold text-gray-800 mt-1">{caravan?.name || `Caravan ${booking.caravan_id}`}</h3>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-800">{formatPrice(Number(booking.total_price))}</div>
                              <div className="text-[10px] text-gray-400">{booking.nights} nachten</div>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-sm text-gray-500">
                            <div className="flex items-center gap-2"><MapPin size={14} className="text-primary shrink-0" />{camping?.name || 'Camping'}</div>
                            <div className="flex items-center gap-2"><Calendar size={14} className="text-primary shrink-0" />{formatDate(booking.check_in)} — {formatDate(booking.check_out)}</div>
                            <div className="flex items-center gap-2"><Users size={14} className="text-primary shrink-0" />{booking.adults} volw. {booking.children > 0 ? `+ ${booking.children} kind.` : ''}</div>
                          </div>

                          {/* Payment breakdown */}
                          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase">Aanbetaling</div>
                              <div className="text-sm font-semibold text-gray-700">{formatPrice(Number(booking.deposit_amount))}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase">Resterend</div>
                              <div className="text-sm font-semibold text-gray-700">{formatPrice(Number(booking.remaining_amount))}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase">Borg</div>
                              <div className="text-sm font-semibold text-gray-700">{formatPrice(Number(booking.borg_amount))}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ===== BETALINGEN ===== */}
              {tab === 'betalingen' && (
                <div className="space-y-3">
                  {payments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">Geen betalingen gevonden</p>
                    </div>
                  ) : (
                    payments.map(payment => {
                      const booking = bookings.find(b => b.id === payment.booking_id);
                      return (
                        <div key={payment.id} className="bg-white rounded-2xl p-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            payment.status === 'BETAALD' ? 'bg-emerald-100' : 'bg-amber-100'
                          }`}>
                            {payment.status === 'BETAALD' ? (
                              <CheckCircle size={18} className="text-emerald-600" />
                            ) : (
                              <Clock size={18} className="text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-800">{payment.type}</div>
                            <div className="text-xs text-gray-400">
                              {booking?.reference || 'Boeking'} • {payment.paid_at ? formatDate(payment.paid_at) : 'Openstaand'}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm text-gray-800">{formatPrice(Number(payment.amount))}</div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Payment total */}
                  {payments.length > 0 && (
                    <div className="bg-gray-100 rounded-2xl p-4 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Totaal betaald</span>
                      <span className="font-bold text-gray-800">
                        {formatPrice(payments.filter(p => p.status === 'BETAALD').reduce((s, p) => s + Number(p.amount), 0))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ===== BORG ===== */}
              {tab === 'borg' && (
                <div className="space-y-3">
                  {borgChecklists.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <ClipboardCheck size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">Geen borg checklists beschikbaar</p>
                      <p className="text-xs text-gray-400 mt-1">Checklists worden aangemaakt bij inchecken</p>
                    </div>
                  ) : (
                    borgChecklists.map(bc => (
                      <div key={bc.id} className="bg-white rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-400">{bc.booking_ref}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[bc.status] || 'bg-gray-100 text-gray-600'}`}>
                                {bc.status}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-gray-800 mt-1">{bc.type === 'INCHECKEN' ? 'Incheck checklist' : 'Uitcheck checklist'}</div>
                          </div>
                          {bc.token && bc.status === 'KLANT_REVIEW' && (
                            <Link
                              href={`/borg/${bc.token}`}
                              className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
                            >
                              Bekijken <ChevronRight size={14} />
                            </Link>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <FileText size={12} />
                          {getCaravan(bc.caravan_id)?.name || 'Caravan'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ===== PROFIEL ===== */}
              {tab === 'profiel' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-800">Mijn gegevens</h2>
                      {!editingProfile && (
                        <button
                          onClick={() => setEditingProfile(true)}
                          className="text-primary text-sm font-medium flex items-center gap-1"
                        >
                          <Edit3 size={14} /> Bewerken
                        </button>
                      )}
                    </div>

                    {editingProfile ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Naam</label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Telefoon</label>
                          <input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Opslaan
                          </button>
                          <button
                            onClick={() => setEditingProfile(false)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-1"
                          >
                            <X size={14} /> Annuleer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 py-2">
                          <User size={18} className="text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-400">Naam</div>
                            <div className="text-sm font-medium text-gray-800">{customer.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                          <Mail size={18} className="text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-400">E-mail</div>
                            <div className="text-sm font-medium text-gray-800">{customer.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                          <Phone size={18} className="text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-400">Telefoon</div>
                            <div className="text-sm font-medium text-gray-800">{customer.phone || '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Danger zone */}
                  <div className="bg-white rounded-2xl p-5">
                    <button
                      onClick={handleLogout}
                      className="w-full py-3 border border-red-200 text-red-600 font-semibold rounded-xl text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut size={16} />
                      Uitloggen
                    </button>
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
