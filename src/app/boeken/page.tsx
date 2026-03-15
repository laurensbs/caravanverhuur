'use client';

import { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, MapPin, Users, CheckCircle, ArrowRight, ArrowLeft,
  CreditCard, User, Mail, Phone, MessageSquare, Search, Hash,
  Filter, Sparkles, Shield, Star, Clock, ChevronRight, Sun, Tent,
  Heart, PartyPopper, Check, Info, Minus, Plus, Tag,
} from 'lucide-react';
import { caravans as staticCaravans, getCaravanById as getStaticCaravanById } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { campings as staticCampings } from '@/data/campings';
import { useLanguage } from '@/i18n/context';
import { useData } from '@/lib/data-context';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 1 | 2 | 3 | 4 | 5;

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function BoekenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted">...</div>
      </div>
    }>
      <BoekenContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

function BoekenContent() {
  const { t } = useLanguage();
  const { caravans, campings } = useData();
  const searchParams = useSearchParams();
  const preselectedCaravan = searchParams.get('caravan');

  const stepConfig = [
    { label: t('booking.stepDate'), icon: CalendarDays, desc: t('booking.stepDateDesc') },
    { label: t('booking.stepDest'), icon: MapPin, desc: t('booking.stepDestDesc') },
    { label: t('booking.stepTravelers'), icon: Users, desc: t('booking.stepTravelersDesc') },
    { label: t('booking.stepDetails'), icon: User, desc: t('booking.stepDetailsDesc') },
    { label: t('booking.stepConfirm'), icon: PartyPopper, desc: t('booking.stepConfirmDesc') },
  ];

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [campingId, setCampingId] = useState('');
  const [campingSearch, setCampingSearch] = useState('');
  const [spotNumber, setSpotNumber] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedCaravan, setSelectedCaravan] = useState(preselectedCaravan || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{ code: string; amount: number; type: string; value: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [showCampingRequest, setShowCampingRequest] = useState(false);
  const [campingRequestName, setCampingRequestName] = useState('');
  const [campingRequestLocation, setCampingRequestLocation] = useState('');
  const [campingRequestSending, setCampingRequestSending] = useState(false);
  const [campingRequestSent, setCampingRequestSent] = useState(false);
  const [showAllCampings, setShowAllCampings] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pricingRules, setPricingRules] = useState<{ id: string; name: string; type: string; percentage: string; start_date: string | null; end_date: string | null; days_before_checkin: number | null; min_nights: number; priority: number }[]>([]);

  useEffect(() => {
    fetch('/api/admin/caravan-settings?unavailable=true')
      .then(res => res.json())
      .then(data => setUnavailableIds(data.unavailableIds || []))
      .catch((e) => console.error('Fetch error:', e));
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricingRules(data.rules || []))
      .catch(() => {});
  }, []);

  const getCaravanById = (id: string) => caravans.find(c => c.id === id);

  const locations = useMemo(() => [...new Set(campings.map(c => c.location))].sort(), [campings]);
  const filteredCampings = useMemo(() => {
    let result = campings.filter(c => c.active !== false);
    if (locationFilter !== 'all') result = result.filter(c => c.location === locationFilter);
    if (campingSearch.trim()) {
      const q = campingSearch.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
    }
    return result;
  }, [campings, campingSearch, locationFilter]);

  const totalPersons = adults + children;
  const availableCaravans = caravans.filter(c => c.maxPersons >= totalPersons && !unavailableIds.includes(c.id));
  const chosenCaravan = selectedCaravan ? getCaravanById(selectedCaravan) : null;
  const chosenCamping = campingId ? campings.find(c => c.id === campingId) : null;
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(() => {
    if (!chosenCaravan || nights <= 0) return 0;
    const base = Math.floor(nights / 7) * chosenCaravan.pricePerWeek + (nights % 7) * chosenCaravan.pricePerDay;
    return base;
  }, [chosenCaravan, nights]);

  // Calculate pricing adjustments from active rules
  const pricingAdjustments = useMemo(() => {
    if (!checkIn || nights <= 0 || totalPrice <= 0) return [];
    const adjustments: { name: string; type: string; percentage: number; amount: number }[] = [];
    const checkinDate = new Date(checkIn);
    const now = new Date();
    const daysBeforeArrival = Math.ceil((checkinDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const sorted = [...pricingRules].sort((a, b) => b.priority - a.priority);
    for (const rule of sorted) {
      const pct = parseFloat(rule.percentage);
      if (isNaN(pct) || pct === 0) continue;
      if (rule.min_nights > nights) continue;

      if (rule.type === 'seizoen' && rule.start_date && rule.end_date) {
        const start = new Date(rule.start_date);
        const end = new Date(rule.end_date);
        if (checkinDate >= start && checkinDate <= end) {
          adjustments.push({ name: rule.name, type: rule.type, percentage: pct, amount: Math.round(totalPrice * pct / 100) });
        }
      } else if (rule.type === 'vroegboek' && rule.days_before_checkin != null) {
        if (daysBeforeArrival >= rule.days_before_checkin) {
          adjustments.push({ name: rule.name, type: rule.type, percentage: pct, amount: Math.round(totalPrice * pct / 100) });
        }
      } else if (rule.type === 'lastminute' && rule.days_before_checkin != null) {
        if (daysBeforeArrival <= rule.days_before_checkin) {
          adjustments.push({ name: rule.name, type: rule.type, percentage: pct, amount: Math.round(totalPrice * pct / 100) });
        }
      }
    }
    return adjustments;
  }, [checkIn, nights, totalPrice, pricingRules]);

  const adjustedTotal = useMemo(() => {
    const adj = pricingAdjustments.reduce((sum, a) => sum + a.amount, 0);
    return Math.max(0, totalPrice + adj);
  }, [totalPrice, pricingAdjustments]);

  const discountedTotal = discountApplied ? Math.max(0, adjustedTotal - discountApplied.amount) : adjustedTotal;

  // Payment deadline: 30 days before check-in
  const daysUntilCheckIn = useMemo(() => {
    if (!checkIn) return 999;
    return Math.ceil((new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [checkIn]);
  const immediatePayment = daysUntilCheckIn <= 30;
  const paymentDeadline = useMemo(() => {
    if (!checkIn) return '';
    if (immediatePayment) return t('booking.payImmediately');
    const d = new Date(new Date(checkIn).getTime() - 30 * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [checkIn, immediatePayment]);

  const canNext = () => {
    switch (step) {
      case 1: return checkIn && checkOut && nights > 0;
      case 2: return campingId !== '' && spotNumber.trim() !== '';
      case 3: return adults >= 1 && selectedCaravan !== '';
      case 4: return name && email && phone && termsAccepted;
      default: return false;
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, totalAmount: totalPrice }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountApplied({ code: data.code, amount: data.discountAmount, type: data.type, value: data.value });
        setDiscountError('');
      } else {
        setDiscountError(data.error || t('booking.discountInvalid'));
        setDiscountApplied(null);
      }
    } catch {
      setDiscountError(t('booking.discountInvalid'));
    }
    setDiscountLoading(false);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: name, guestEmail: email, guestPhone: phone,
          adults, children, specialRequests: specialRequests || undefined,
          caravanId: selectedCaravan, campingId, spotNumber: spotNumber.trim(),
          checkIn, checkOut, nights, totalPrice: discountedTotal,
          borgAmount: chosenCaravan?.deposit || 0,
          discountCode: discountApplied?.code || undefined,
          discountAmount: discountApplied?.amount || 0,
        }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setBookingRef(data.reference);
      // If immediate payment required, redirect to Stripe checkout
      if (data.immediatePayment && data.paymentId) {
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: data.paymentId }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
      }
      setSubmitted(true);
    } catch {
      setSubmitError(t('booking.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 5) as Step); contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 1) as Step); };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  /* ---- Success state ---- */
  if (submitted) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }} className="text-center">
            {/* Animated check */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }} className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                  <CheckCircle size={48} className="text-primary" />
                </motion.div>
              </motion.div>
              {/* Confetti dots */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ scale: [0, 1, 0], x: Math.cos(i * 45 * Math.PI / 180) * 60, y: Math.sin(i * 45 * Math.PI / 180) * 60 }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.8 }}
                  className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full ${['bg-primary', 'bg-primary', 'bg-primary', 'bg-primary-light'][i % 4]}`}
                />
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{t('booking.successTitle')}</h1>
            <p className="text-muted text-lg mb-2">
              {t('booking.successThank')} <span className="font-semibold text-foreground-light">{name}</span>! {t('booking.successText')}
            </p>
            {bookingRef && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold mb-8">
                Ref: {bookingRef}
              </motion.div>
            )}

            {/* Summary card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 shadow-lg text-left mb-6">
              <div className="flex items-center gap-3 mb-4">
                {chosenCaravan && (
                  <div className="w-16 h-12 rounded-lg overflow-hidden relative shrink-0">
                    <Image src={chosenCaravan.photos[0]} alt={chosenCaravan.name} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-foreground">{chosenCaravan?.name}</h3>
                  <p className="text-sm text-muted">{chosenCamping?.name}, {chosenCamping?.location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-surface rounded-xl p-3"><p className="text-muted text-xs mb-0.5">{t('booking.arrival')}</p><p className="font-semibold">{checkIn}</p></div>
                <div className="bg-surface rounded-xl p-3"><p className="text-muted text-xs mb-0.5">{t('booking.departure')}</p><p className="font-semibold">{checkOut}</p></div>
                <div className="bg-surface rounded-xl p-3"><p className="text-muted text-xs mb-0.5">{t('booking.nightsLabel')}</p><p className="font-semibold">{nights}</p></div>
                <div className="bg-surface rounded-xl p-3"><p className="text-muted text-xs mb-0.5">{t('booking.personsLabel')}</p><p className="font-semibold">{adults} + {children} {t('booking.child')}</p></div>
              </div>
              <div className="mt-4 pt-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted">{t('booking.totalPriceLabel')}</span><span className="font-bold text-primary text-lg">&euro;{discountedTotal}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">{t('booking.borgLabel')}</span><span className="font-medium">&euro;{chosenCaravan?.deposit}</span></div>
                {discountApplied && (
                  <div className="flex justify-between text-sm"><span className="text-primary flex items-center gap-1"><Tag size={12} /> {t('booking.discountLabel')}</span><span className="font-medium text-primary">-&euro;{discountApplied.amount}</span></div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-primary-50 rounded-xl p-4 text-sm text-foreground mb-6">
              <strong>{t('booking.nextStep')}</strong> {immediatePayment
                ? t('booking.redirectToPayment')
                : `${t('booking.paymentDueBefore')} €${discountedTotal} ${paymentDeadline}.`
              }
            </motion.div>

            <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold">
              {t('booking.backToHome')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-white to-surface overflow-x-hidden">
      {/* ===== PROGRESS BAR ===== */}
      <div ref={contentRef} className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Mobile progress */}
          <div className="lg:hidden py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-5 flex-1">
                {stepConfig.map((s, i) => {
                  const isDone = i + 1 < step;
                  const isCurrent = i + 1 === step;
                  return (
                    <div key={i} className="flex items-center gap-1.5 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        isDone ? 'bg-primary text-white' :
                        isCurrent ? 'bg-primary text-white shadow-sm shadow-primary/30' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone ? <Check size={13} /> : i + 1}
                      </div>
                      {i < stepConfig.length - 1 && (
                        <div className="flex-1 h-0.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-primary w-full' : 'w-0'}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs font-medium text-muted mt-1">{stepConfig[step - 1].label} — {stepConfig[step - 1].desc}</p>
          </div>

          {/* Desktop progress */}
          <div className="hidden lg:flex items-center py-4">
            {stepConfig.map((s, i) => {
              const StepIcon = s.icon;
              const isDone = i + 1 < step;
              const isCurrent = i + 1 === step;
              return (
                <div key={s.label} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isDone ? 'bg-primary text-white shadow-sm' :
                      isCurrent ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' :
                      'bg-gray-50 text-muted border border-gray-200'
                    }`}>
                      {isDone ? <Check size={17} /> : <StepIcon size={17} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-tight ${
                        isCurrent ? 'text-foreground' : isDone ? 'text-primary' : 'text-muted'
                      }`}>{s.label}</p>
                      <p className={`text-xs leading-tight ${
                        isCurrent ? 'text-foreground-light' : 'text-muted'
                      }`}>{s.desc}</p>
                    </div>
                  </div>
                  {i < stepConfig.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: isDone ? '100%' : isCurrent ? '50%' : '0%' }}
                          transition={{ duration: 0.4 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <section className="py-4 pb-24 lg:py-10 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-10">
            {/* Left: Step content */}
            <div>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>

                  {/* ===== STEP 1: DATES ===== */}
                  {step === 1 && (
                    <div className="space-y-5 lg:space-y-6">
                      <div>
                        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">{t('booking.s1Title')}</h1>
                        <p className="text-sm lg:text-base text-muted">{t('booking.s1Subtitle')}</p>
                      </div>

                      {/* Camping-first tip */}
                      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                        <Tent size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-amber-800 leading-snug">
                          {t('booking.s1CampingTip')}{' '}
                          <Link href="/bestemmingen" className="underline font-semibold text-amber-900 hover:text-amber-700">{t('booking.s1CampingTipLink')} →</Link>
                        </p>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                        <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-2">
                              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center"><CalendarDays size={14} className="text-primary" /></div>
                              {t('booking.arrivalLabel')}
                            </label>
                            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 bg-surface rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm text-foreground font-medium" />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-2">
                              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center"><CalendarDays size={14} className="text-primary" /></div>
                              {t('booking.departureLabel')}
                            </label>
                            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 bg-surface rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm text-foreground font-medium" />
                          </div>
                        </div>

                        {nights > 0 && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-primary-50 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <Sun size={18} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">{nights} {nights === 1 ? t('booking.night') : t('booking.nightPlural')}</p>
                              <p className="text-xs text-muted">
                                {Math.floor(nights / 7)} {Math.floor(nights / 7) === 1 ? t('booking.week') : t('booking.weeks')}
                                {nights % 7 > 0 ? ` ${t('booking.and')} ${nights % 7} ${nights % 7 === 1 ? t('booking.day') : t('booking.days')}` : ''}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {nights > 0 && nights < 7 && (
                          <div className="mt-2.5 flex items-start gap-2 text-primary text-xs bg-primary-50 rounded-lg p-2.5">
                            <Info size={13} className="shrink-0 mt-0.5" />
                            {t('booking.minAdvice')}
                          </div>
                        )}
                      </div>

                      {/* Quick pick */}
                      <div>
                        <p className="text-sm font-semibold text-muted mb-2">{t('booking.popularPeriods')}</p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {[
                            { label: t('booking.oneWeek'), days: 7, img: '/images/campings/begur_sa_tuna.jpg' },
                            { label: t('booking.twoWeeks'), days: 14, img: '/images/campings/platja_gran_platja_d_aro.jpg' },
                            { label: t('booking.threeWeeks'), days: 21, img: '/images/campings/cala_d_aiguablava__begur.jpg' },
                          ].map(q => {
                            // Use the already-entered check-in date, or fall back to 4 months from now
                            const start = checkIn ? new Date(checkIn + 'T00:00:00') : (() => { const d = new Date(); d.setMonth(d.getMonth() + 4); d.setDate(1); return d; })();
                            const end = new Date(start);
                            end.setDate(start.getDate() + q.days);
                            const isActive = checkIn === start.toISOString().split('T')[0] && checkOut === end.toISOString().split('T')[0];
                            return (
                              <button
                                key={q.label}
                                onClick={() => {
                                  if (!checkIn) setCheckIn(start.toISOString().split('T')[0]);
                                  setCheckOut(end.toISOString().split('T')[0]);
                                }}
                                className={`group relative rounded-xl overflow-hidden text-left transition-all cursor-pointer aspect-[4/3] ${
                                  isActive ? 'ring-2 ring-accent ring-offset-2 shadow-lg' : 'hover:shadow-lg hover:scale-[1.02]'
                                }`}
                              >
                                <Image src={q.img} alt={q.label} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className={`absolute inset-0 transition-colors duration-300 ${isActive ? 'bg-accent/60' : 'bg-foreground/50 group-hover:bg-foreground/40'}`} />
                                <div className="relative z-10 flex flex-col justify-end h-full p-3 lg:p-4">
                                  <p className="font-bold text-sm lg:text-base text-white drop-shadow-sm">{q.label}</p>
                                  <p className="text-[11px] lg:text-xs text-white/80">{q.days} {t('booking.nightPlural')}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== STEP 2: DESTINATION ===== */}
                  {step === 2 && (
                    <div className="space-y-5 lg:space-y-6">
                      <div>
                        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">{t('booking.s2Title')}</h2>
                        <p className="text-sm lg:text-base text-muted">{t('booking.s2Subtitle')}</p>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
                        <div className="relative mb-3">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                          <input type="text" value={campingSearch} onChange={e => setCampingSearch(e.target.value)} placeholder={t('booking.searchCamping')}
                            className="w-full pl-9 pr-4 py-2.5 lg:py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
                          <button onClick={() => setLocationFilter('all')} className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${locationFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-foreground-light'}`}>
                            {t('booking.allLocations')}
                          </button>
                          {locations.map(loc => (
                            <button key={loc} onClick={() => setLocationFilter(loc)} className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${locationFilter === loc ? 'bg-primary text-white shadow-sm' : 'bg-surface-alt text-foreground-light'}`}>
                              {loc}
                            </button>
                          ))}
                        </div>

                        {/* Camping list — compact on mobile, cards on desktop */}
                        <div className="mt-2 max-h-[340px] sm:max-h-[400px] lg:max-h-[480px] overflow-y-auto rounded-xl border border-gray-100">
                          {(() => {
                            const isFiltering = campingSearch.trim() || locationFilter !== 'all';
                            const visibleCampings = (showAllCampings || isFiltering) ? filteredCampings : filteredCampings.slice(0, 12);
                            const hasMore = !isFiltering && !showAllCampings && filteredCampings.length > 12;
                            return (
                              <>
                                {visibleCampings.map((c, idx) => {
                                  const isSelected = campingId === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      onClick={() => setCampingId(c.id)}
                                      className={`w-full text-left flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:py-3 transition-colors ${
                                        isSelected ? 'bg-primary/5' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                      } ${idx > 0 ? 'border-t border-gray-100' : ''} hover:bg-primary/5`}
                                    >
                                      {/* Radio indicator */}
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                                      }`}>
                                        {isSelected && <Check size={11} className="text-white" />}
                                      </div>

                                      {/* Photo (desktop only) */}
                                      <div className="hidden sm:block relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                        {c.photos?.[0] ? (
                                          <Image src={c.photos[0]} alt={c.name} fill className="object-cover" sizes="48px" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center"><Tent size={16} className="text-gray-300" /></div>
                                        )}
                                      </div>

                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>{c.name}</p>
                                        <p className="text-[11px] sm:text-xs text-muted flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" /> {c.location}</p>
                                      </div>

                                      {/* Facilities (tablet+ only) */}
                                      <div className="hidden lg:flex items-center gap-1 shrink-0">
                                        {c.facilities?.slice(0, 3).map(f => (
                                          <span key={f} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>{f}</span>
                                        ))}
                                      </div>
                                    </button>
                                  );
                                })}
                                {filteredCampings.length === 0 && (
                                  <div className="text-center py-8 text-muted text-sm">{t('booking.noCampings')}</div>
                                )}
                                {hasMore && (
                                  <button
                                    onClick={() => setShowAllCampings(true)}
                                    className="w-full py-2.5 border-t border-gray-100 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <ChevronRight size={14} className="rotate-90" />
                                    {`Toon alle ${filteredCampings.length} campings`}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Camping not listed */}
                      {!campingRequestSent ? (
                        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
                          {!showCampingRequest ? (
                            <button
                              onClick={() => setShowCampingRequest(true)}
                              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors py-1"
                            >
                              <Info size={16} />
                              {t('booking.campingNotListed')}
                            </button>
                          ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-foreground">{t('booking.campingRequestTitle')}</p>
                                <button onClick={() => setShowCampingRequest(false)} className="text-xs text-muted hover:text-foreground">✕</button>
                              </div>
                              <p className="text-xs text-muted">{t('booking.campingRequestDesc')}</p>
                              <input
                                type="text"
                                value={campingRequestName}
                                onChange={e => setCampingRequestName(e.target.value)}
                                placeholder={t('booking.campingRequestNamePlaceholder')}
                                className="w-full px-4 py-3 bg-surface rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm"
                              />
                              <input
                                type="text"
                                value={campingRequestLocation}
                                onChange={e => setCampingRequestLocation(e.target.value)}
                                placeholder={t('booking.campingRequestLocationPlaceholder')}
                                className="w-full px-4 py-3 bg-surface rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm"
                              />
                              <button
                                onClick={async () => {
                                  if (!campingRequestName.trim()) return;
                                  setCampingRequestSending(true);
                                  try {
                                    await fetch('/api/contacts', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        name: name || t('booking.bookingPageVisitor'),
                                        email: email || 'onbekend@caravanverhuurspanje.com',
                                        phone: phone || '',
                                        subject: t('booking.campingRequest'),
                                        message: `Camping: ${campingRequestName.trim()}${campingRequestLocation.trim() ? `\nLocatie: ${campingRequestLocation.trim()}` : ''}`,
                                      }),
                                    });
                                    setCampingRequestSent(true);
                                  } catch {
                                    // silent
                                  }
                                  setCampingRequestSending(false);
                                }}
                                disabled={!campingRequestName.trim() || campingRequestSending}
                                className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 transition-all hover:bg-primary/90"
                              >
                                {campingRequestSending ? t('booking.processing') : t('booking.campingRequestSubmit')}
                              </button>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                          <CheckCircle size={20} className="text-green-600 shrink-0" />
                          <p className="text-sm text-green-800 font-medium">{t('booking.campingRequestSuccess')}</p>
                        </motion.div>
                      )}

                      {/* Spot number — required */}
                      {campingId && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-2">
                            <Hash size={14} className="text-primary" />
                            {t('booking.spotNumberLabel')} <span className="text-red-500">*</span>
                          </label>
                          <input type="text" value={spotNumber} onChange={e => setSpotNumber(e.target.value)} placeholder={t('booking.spotPlaceholder')}
                            className={`w-full px-4 py-3 bg-surface rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm ${!spotNumber.trim() ? 'border-gray-200' : 'border-primary/30'}`} />
                          <p className="text-xs text-muted mt-1.5">{t('booking.spotRequiredNote')}</p>
                        </motion.div>
                      )}

                      {/* Camping separate notice */}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">{t('booking.campingSeparateTooltip')}</p>
                      </div>
                    </div>
                  )}

                  {/* ===== STEP 3: TRAVELERS + CARAVAN ===== */}
                  {step === 3 && (
                    <div className="space-y-5 lg:space-y-6">
                      <div>
                        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">{t('booking.s3Title')}</h2>
                        <p className="text-sm lg:text-base text-muted">{t('booking.s3Subtitle')}</p>
                      </div>

                      {/* Person counters */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{t('booking.adultsLabel')}</p>
                              <p className="text-xs text-muted">{t('booking.adultsAge')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-foreground-light transition-colors">
                                <Minus size={16} />
                              </button>
                              <span className="text-xl font-bold text-foreground w-8 text-center">{adults}</span>
                              <button onClick={() => setAdults(Math.min(6, adults + 1))} className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-foreground-light transition-colors">
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{t('booking.childrenLabel')}</p>
                              <p className="text-xs text-muted">{t('booking.childrenAge')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-foreground-light transition-colors">
                                <Minus size={16} />
                              </button>
                              <span className="text-xl font-bold text-foreground w-8 text-center">{children}</span>
                              <button onClick={() => setChildren(Math.min(4, children + 1))} className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-foreground-light transition-colors">
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 flex items-center gap-2">
                          <Users size={16} className="text-primary" />
                          <span className="text-sm font-medium text-foreground-light">{t('booking.totalPersons')} {totalPersons} {totalPersons === 1 ? t('booking.person') : t('booking.persons')}</span>
                        </div>
                      </div>

                      {/* Caravan selection */}
                      <div>
                        <h3 className="text-lg lg:text-xl font-bold text-foreground mb-1">{t('booking.chooseCaravan')}</h3>
                        <p className="text-sm text-muted mb-4">{availableCaravans.length} {t('booking.availableFor')} {totalPersons} {t('booking.persons')}</p>

                        <div className="space-y-4 lg:space-y-5">
                          {availableCaravans.map(c => {
                            const isSelected = selectedCaravan === c.id;
                            const price = Math.floor(nights / 7) * c.pricePerWeek + (nights % 7) * c.pricePerDay;
                            return (
                              <motion.div
                                key={c.id}
                                layout
                                className={`w-full text-left rounded-2xl overflow-hidden transition-all border-2 ${
                                  isSelected ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-primary/30'
                                }`}
                              >
                                <button
                                  onClick={() => setSelectedCaravan(isSelected ? '' : c.id)}
                                  className="w-full text-left cursor-pointer"
                                >
                                  <div className="flex flex-col sm:flex-row">
                                    <div className="relative h-44 sm:h-auto sm:w-56 lg:w-64 shrink-0 overflow-hidden">
                                      {(() => {
                                        const gm = c.videoUrl?.match(/gumlet\.tv\/watch\/([\w-]+)/);
                                        if (gm) return (
                                          <>
                                            <iframe
                                              src={`https://play.gumlet.io/embed/${gm[1]}?background=true&disable_player_controls=true&preload=true&subtitles=off&resolution=1080p`}
                                              title={c.name}
                                              allow="autoplay"
                                              loading="lazy"
                                              className="absolute inset-0 w-full h-full border-0"
                                              style={{ pointerEvents: 'none' }}
                                            />
                                            <div className="absolute inset-0 z-10" />
                                          </>
                                        );
                                        return <Image src={c.photos[0]} alt={c.name} fill className="object-cover" />;
                                      })()}
                                      <div className="absolute top-3 left-3 z-20">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold text-white shadow-md ${
                                          c.type === 'FAMILIE' ? 'bg-primary' :
                                          'bg-primary'
                                        }`}>{c.type}</span>
                                      </div>
                                      {isSelected && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md z-20">
                                          <Check size={14} className="text-white" />
                                        </motion.div>
                                      )}
                                    </div>
                                    <div className="p-5 flex-1">
                                      <h4 className="font-bold text-lg text-foreground mb-1">{c.name}</h4>
                                      <p className="text-sm text-muted mb-3">{c.maxPersons} {t('booking.persons')} &bull; {c.manufacturer} &bull; {c.year}</p>
                                      <div className="flex flex-wrap gap-1.5 mb-3">
                                        {c.amenities.slice(0, 5).map(a => (
                                          <span key={a} className="text-xs font-medium bg-surface-alt text-foreground-light px-2 py-0.5 rounded-full">{a}</span>
                                        ))}
                                        {c.amenities.length > 5 && (
                                          <span className="text-xs font-medium bg-surface-alt text-muted px-2 py-0.5 rounded-full">+{c.amenities.length - 5}</span>
                                        )}
                                      </div>
                                      <div className="flex items-end justify-between">
                                        <div>
                                          <p className="text-xs text-muted">{t('booking.from')}</p>
                                          <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-primary">&euro;{c.pricePerWeek}</span>
                                            <span className="text-sm text-muted">{t('booking.perWeek')}</span>
                                          </div>
                                        </div>
                                        {nights > 0 && (
                                          <div className="text-right">
                                            <p className="text-xs text-muted">{t('booking.totalFor')} {nights} {t('booking.nightPlural')}</p>
                                            <p className="text-lg font-bold text-primary">&euro;{price}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>

                                {/* Expanded photo gallery & details */}
                                <AnimatePresence>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-5 space-y-4">
                                        {/* Photo gallery */}
                                        <div>
                                          <p className="text-sm font-semibold text-foreground mb-3">{t('booking.photosLabel')}</p>
                                          <div className="grid grid-cols-3 gap-2">
                                            {c.photos.map((photo, idx) => (
                                              <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
                                                <Image src={photo} alt={`${c.name} foto ${idx + 1}`} fill className="object-cover transition-transform duration-300" />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        {/* Description */}
                                        <div>
                                          <p className="text-sm font-semibold text-foreground mb-2">{t('booking.descriptionLabel')}</p>
                                          <p className="text-sm text-muted leading-relaxed">{c.description}</p>
                                        </div>
                                        {/* All amenities */}
                                        <div>
                                          <p className="text-sm font-semibold text-foreground mb-2">{t('booking.amenitiesLabel')}</p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {c.amenities.map(a => (
                                              <span key={a} className="text-xs font-medium bg-primary-50 text-primary-dark px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <Check size={10} className="text-primary" />{a}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        {/* Inventory */}
                                        <div>
                                          <p className="text-sm font-semibold text-foreground mb-2">{t('booking.inventoryLabel')}</p>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                            {c.inventory.map(item => (
                                              <span key={item} className="text-xs text-muted bg-surface rounded-lg px-2.5 py-1.5">{item}</span>
                                            ))}
                                          </div>
                                        </div>
                                        {/* Price breakdown */}
                                        {nights > 0 && (
                                          <div className="bg-primary-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="text-sm font-semibold text-foreground">{t('booking.totalPriceLabel')}</p>
                                                <p className="text-xs text-muted">{nights} {t('booking.nightsBorg')} €{c.deposit}</p>
                                              </div>
                                              <p className="text-2xl font-bold text-primary">&euro;{price}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== STEP 4: CONTACT DETAILS ===== */}
                  {step === 4 && (
                    <div className="space-y-5 lg:space-y-6">
                      <div>
                        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">{t('booking.s4Title')}</h2>
                        <p className="text-sm lg:text-base text-muted">{t('booking.s4Subtitle')}</p>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 space-y-5">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-1.5">
                            <User size={14} className="text-primary" /> {t('booking.fullName')}
                          </label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('contact.placeholderName')}
                            className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-1.5">
                              <Mail size={14} className="text-primary" /> {t('booking.emailAddress')}
                            </label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('contact.placeholderEmail')}
                              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm" />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-1.5">
                              <Phone size={14} className="text-primary" /> {t('booking.phoneNumber')}
                            </label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('contact.placeholderPhone')}
                              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-1.5">
                            <MessageSquare size={14} className="text-primary" /> {t('booking.specialRequestsLabel')} <span className="text-muted font-normal">{t('booking.optional')}</span>
                          </label>
                          <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder={t('booking.specialPlaceholder')}
                            rows={3} className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all resize-none text-sm" />
                        </div>
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 cursor-pointer bg-white rounded-xl p-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${termsAccepted ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {termsAccepted && <Check size={12} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="sr-only" />
                        <span className="text-sm text-foreground-light">
                          {t('booking.agreeTerms')}{' '}
                          <a href="/voorwaarden" target="_blank" className="text-primary underline font-medium">{t('booking.termsLink')}</a>{t('booking.andThe')}{' '}
                          <a href="/privacy" target="_blank" className="text-primary underline font-medium">{t('booking.privacyLink')}</a> {t('booking.andThe2')}{' '}
                          <a href="/voorwaarden#annulering" target="_blank" className="text-primary underline font-medium">{t('booking.cancellationLink')}</a>.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* ===== STEP 5: CONFIRMATION ===== */}
                  {step === 5 && (
                    <div className="space-y-5 lg:space-y-6">
                      <div>
                        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">{t('booking.s5Title')}</h2>
                        <p className="text-sm lg:text-base text-muted">{t('booking.s5Subtitle')}</p>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Caravan strip */}
                        {chosenCaravan && (
                          <div className="relative h-40 sm:h-48">
                            <Image src={chosenCaravan.photos[0]} alt={chosenCaravan.name} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute bottom-4 left-5 right-5">
                              <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-bold text-white shadow-md mb-1 ${
                                chosenCaravan.type === 'FAMILIE' ? 'bg-primary' :
                                'bg-primary'
                              }`}>{chosenCaravan.type}</span>
                              <h3 className="text-white font-bold text-xl">{chosenCaravan.name}</h3>
                            </div>
                          </div>
                        )}

                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-surface rounded-xl p-3">
                              <p className="text-xs text-muted uppercase tracking-wider mb-0.5">{t('booking.arrival')}</p>
                              <p className="font-semibold text-sm">{checkIn}</p>
                            </div>
                            <div className="bg-surface rounded-xl p-3">
                              <p className="text-xs text-muted uppercase tracking-wider mb-0.5">{t('booking.departure')}</p>
                              <p className="font-semibold text-sm">{checkOut}</p>
                            </div>
                            <div className="bg-surface rounded-xl p-3">
                              <p className="text-xs text-muted uppercase tracking-wider mb-0.5">{t('booking.nightsLabel')}</p>
                              <p className="font-semibold text-sm">{nights}</p>
                            </div>
                            <div className="bg-surface rounded-xl p-3">
                              <p className="text-xs text-muted uppercase tracking-wider mb-0.5">{t('booking.personsLabel')}</p>
                              <p className="font-semibold text-sm">{adults} + {children}</p>
                            </div>
                          </div>

                          <div className="bg-surface rounded-xl p-4">
                            <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('booking.campingLabel')}</p>
                            <p className="font-semibold">{chosenCamping?.name}, {chosenCamping?.location}</p>
                            <p className="text-sm text-muted mt-0.5">{t('booking.spotLabel')} {spotNumber}</p>
                            <p className="text-[11px] text-amber-700 mt-1">{t('booking.campingSeparateNotice')}</p>
                          </div>

                          <div className="bg-surface rounded-xl p-4">
                            <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('booking.contactDetails')}</p>
                            <p className="font-semibold">{name}</p>
                            <p className="text-sm text-muted">{email} &bull; {phone}</p>
                          </div>

                          <div className="pt-4 space-y-2">
                            <div className="flex justify-between"><span className="text-muted">{t('booking.totalPriceLabel')}</span><span className={`font-bold text-xl ${(pricingAdjustments.length > 0 || discountApplied) ? 'text-muted line-through text-base' : 'text-primary'}`}>&euro;{totalPrice}</span></div>
                            {pricingAdjustments.map((adj, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className={`font-medium flex items-center gap-1.5 ${adj.amount < 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                  {adj.type === 'seizoen' ? <Sun size={13} /> : adj.type === 'vroegboek' ? <Clock size={13} /> : <Sparkles size={13} />}
                                  {adj.name} ({adj.percentage > 0 ? '+' : ''}{adj.percentage}%)
                                </span>
                                <span className={`font-medium ${adj.amount < 0 ? 'text-green-600' : 'text-amber-600'}`}>{adj.amount < 0 ? '' : '+'}€{Math.abs(adj.amount)}</span>
                              </div>
                            ))}
                            {pricingAdjustments.length > 0 && !discountApplied && (
                              <div className="flex justify-between"><span className="text-muted">{t('booking.totalPriceLabel')}</span><span className="font-bold text-xl text-primary">&euro;{adjustedTotal}</span></div>
                            )}
                            {discountApplied && (
                              <div className="flex justify-between items-center">
                                <span className="text-primary font-medium flex items-center gap-1.5"><Tag size={14} /> {t('booking.discountLabel')} ({discountApplied.code})</span>
                                <span className="font-bold text-xl text-primary">&euro;{discountedTotal}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm"><span className="text-muted">{t('booking.borgReturn')}</span><span className="font-medium">&euro;{chosenCaravan?.deposit}</span></div>
                            {immediatePayment && (
                              <div className="flex justify-between text-sm"><span className="text-primary font-medium">💳 {t('booking.payNow')}</span><span className="font-bold text-primary">&euro;{discountedTotal}</span></div>
                            )}
                            {!immediatePayment && (
                              <div className="flex justify-between text-sm"><span className="text-muted">📅 {t('booking.payBefore')}</span><span className="font-medium">{paymentDeadline}</span></div>
                            )}
                          </div>

                          {/* Discount code input */}
                          <div className="pt-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground-light mb-2">
                              <Tag size={14} className="text-primary" /> {t('booking.discountCode')}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={discountCode}
                                onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(''); }}
                                placeholder={t('booking.discountPlaceholder')}
                                disabled={!!discountApplied}
                                className="flex-1 px-4 py-2.5 bg-surface rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm uppercase disabled:opacity-50"
                              />
                              {discountApplied ? (
                                <button onClick={() => { setDiscountApplied(null); setDiscountCode(''); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted transition-colors">
                                  {t('booking.discountRemove')}
                                </button>
                              ) : (
                                <button onClick={handleApplyDiscount} disabled={discountLoading || !discountCode.trim()} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
                                  {discountLoading ? '...' : t('booking.discountApply')}
                                </button>
                              )}
                            </div>
                            {discountError && <p className="text-xs text-red-500 mt-1.5">{discountError}</p>}
                            {discountApplied && (
                              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
                                <Check size={12} /> {discountApplied.type === 'percentage' ? `${discountApplied.value}%` : `€${discountApplied.value}`} {t('booking.discountApplied')} (-&euro;{discountApplied.amount})
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </div>

                      {submitError && (
                        <div className="bg-danger/10 rounded-xl p-4 text-danger text-sm flex items-center gap-2">
                          <Info size={16} /> {submitError}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ===== DESKTOP NAVIGATION BUTTONS (sticky) ===== */}
              <div className="hidden lg:block sticky bottom-0 z-20 mt-6 -mx-1 px-1">
                <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 pt-4 pb-2 flex items-center justify-between">
                  {step > 1 ? (
                    <button onClick={goBack} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-foreground-light font-medium transition-all hover:bg-surface-alt border border-gray-200 cursor-pointer">
                      <ArrowLeft size={16} /> {t('booking.previous')}
                    </button>
                  ) : <div />}

                  {step < 5 ? (
                    <button onClick={goNext} disabled={!canNext()} className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary disabled:bg-muted disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:shadow-none cursor-pointer text-base">
                      {t('booking.nextBtn')} <ArrowRight size={18} />
                    </button>
                  ) : step === 5 ? (
                    <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary disabled:from-muted disabled:to-muted disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 cursor-pointer text-base">
                      {submitting ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('booking.processing')}</>
                      ) : (
                        <><CreditCard size={18} /> {t('booking.submitBooking')}</>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ===== RIGHT SIDEBAR ===== */}
            <div className="hidden lg:block">
              <div className="sticky top-[100px] space-y-4">
                {/* Live summary card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary-dark px-5 py-4 text-white">
                    <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles size={15} /> {t('booking.yourBooking')}</h3>
                  </div>
                  <div className="p-5 space-y-3.5 text-sm">
                    {/* Dates */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <CalendarDays size={15} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-[13px]">{checkIn && checkOut ? `${checkIn} – ${checkOut}` : t('booking.noDate')}</p>
                        {nights > 0 && <p className="text-xs text-muted">{nights} {t('booking.nightPlural')}</p>}
                      </div>
                    </div>

                    {/* Camping */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin size={15} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-[13px]">{chosenCamping ? chosenCamping.name : t('booking.noCamping')}</p>
                        {chosenCamping && <p className="text-xs text-muted">{chosenCamping.location}</p>}
                        {spotNumber && <p className="text-[11px] text-foreground-light mt-0.5">{t('booking.spotLabel')} {spotNumber}</p>}
                        {chosenCamping && <p className="text-[10px] text-amber-700 mt-0.5">{t('booking.campingSeparateNotice')}</p>}
                      </div>
                    </div>

                    {/* Persons */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Users size={15} className="text-primary" />
                      </div>
                      <p className="font-semibold text-foreground text-[13px] mt-1.5">{totalPersons} {t('booking.persons')} ({adults} {t('booking.personsAdults')}{children > 0 ? `, ${children} ${t('booking.child')}` : ''})</p>
                    </div>

                    {/* Caravan */}
                    {chosenCaravan && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-6 rounded overflow-hidden relative shrink-0 mt-0.5">
                          <Image src={chosenCaravan.photos[0]} alt={chosenCaravan.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-[13px]">{chosenCaravan.name}</p>
                          <p className="text-xs text-muted">{chosenCaravan.type}</p>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    {totalPrice > 0 && (
                      <div className="pt-2.5 mt-1 border-t border-gray-100">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-muted text-xs">{t('booking.total')}</span>
                          <motion.span key={discountedTotal} initial={{ scale: 1.2, color: '#334155' }} animate={{ scale: 1, color: '#0F172A' }} className="text-lg font-bold">&euro;{discountedTotal}</motion.span>
                        </div>
                        {discountApplied && (
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-primary flex items-center gap-1"><Tag size={10} /> {discountApplied.code}</span>
                            <span className="text-primary font-medium">-&euro;{discountApplied.amount}</span>
                          </div>
                        )}
                        {immediatePayment ? (
                          <div className="flex justify-between text-xs">
                            <span className="text-primary font-medium">{t('booking.payNow')}</span>
                            <span className="font-semibold text-primary">&euro;{discountedTotal}</span>
                          </div>
                        ) : paymentDeadline ? (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted">{t('booking.payBefore')}</span>
                            <span className="font-medium text-foreground-light">{paymentDeadline}</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust signals */}
                <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-5 space-y-3 border border-primary-100">
                  {[
                    { icon: <Shield size={15} className="text-primary" />, text: t('booking.trustCancel') },
                    { icon: <Star size={15} className="text-primary" />, text: t('booking.trustGuests') },
                    { icon: <Clock size={15} className="text-primary" />, text: t('booking.trustConfirm') },
                  ].map((item, ti) => (
                    <div key={ti} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">{item.icon}</div>
                      <p className="text-xs text-primary-dark font-medium leading-snug mt-1">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Need help */}
                <div className="bg-white rounded-2xl p-5 text-center border border-gray-100">
                  <p className="text-sm font-bold text-foreground mb-0.5">{t('booking.needHelp')}</p>
                  <p className="text-xs text-muted mb-3">{t('booking.helpText')}</p>
                  <a href="https://wa.me/34650036755" target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-semibold transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MOBILE FIXED BOTTOM NAV ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-bottom-nav">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: Price summary or back button */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink">
            {step > 1 ? (
              <button onClick={goBack} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full text-foreground-light font-medium text-sm transition-all active:bg-surface shrink-0">
                <ArrowLeft size={16} /> {t('booking.previous')}
              </button>
            ) : discountedTotal > 0 && chosenCaravan ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-6 rounded overflow-hidden relative shrink-0">
                  <Image src={chosenCaravan.photos[0]} alt={chosenCaravan.name} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted leading-tight">{t('booking.totalPriceLabel')}</p>
                  <p className="text-sm font-bold text-primary">&euro;{discountedTotal}</p>
                </div>
              </div>
            ) : <div />}
          </div>

          {/* Right: Next / Submit button */}
          <div className="shrink-0">
            {step < 5 ? (
              <button onClick={goNext} disabled={!canNext()} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary disabled:bg-muted disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all shadow-md disabled:shadow-none text-sm active:scale-95">
                {t('booking.nextBtn')} <ArrowRight size={16} />
              </button>
            ) : step === 5 ? (
              <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary disabled:bg-muted disabled:cursor-not-allowed text-white font-bold rounded-full transition-all shadow-lg text-sm active:scale-95">
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('booking.processing')}</>
                ) : (
                  <><CreditCard size={16} /> {t('booking.submitBooking')}</>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <style jsx>{`
        .safe-area-bottom-nav {
          padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
