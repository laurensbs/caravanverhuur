'use client';

import { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  CalendarDays, MapPin, Users, CheckCircle, ArrowRight, ArrowLeft,
  CreditCard, User, Mail, Phone, MessageSquare, Search, Hash,
  Filter, Sparkles, Shield, Star, Clock, ChevronRight, Sun, Tent,
  Heart, PartyPopper, Check, Info, Minus, Plus,
} from 'lucide-react';
import { caravans, getCaravanById } from '@/data/caravans';
import { campings } from '@/data/campings';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 1 | 2 | 3 | 4 | 5;

const stepConfig = [
  { label: 'Datum', icon: CalendarDays, desc: 'Wanneer ga je?' },
  { label: 'Bestemming', icon: MapPin, desc: 'Waar wil je heen?' },
  { label: 'Reizigers & Caravan', icon: Users, desc: 'Wie gaat er mee?' },
  { label: 'Gegevens', icon: User, desc: 'Bijna klaar!' },
  { label: 'Bevestiging', icon: PartyPopper, desc: 'Overzicht' },
];

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function BoekenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted">Laden...</div>
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
  const searchParams = useSearchParams();
  const preselectedCaravan = searchParams.get('caravan');

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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/caravan-settings?unavailable=true')
      .then(res => res.json())
      .then(data => setUnavailableIds(data.unavailableIds || []))
      .catch(() => {});
  }, []);

  const locations = useMemo(() => [...new Set(campings.map(c => c.location))].sort(), []);
  const filteredCampings = useMemo(() => {
    let result = campings;
    if (locationFilter !== 'all') result = result.filter(c => c.location === locationFilter);
    if (campingSearch.trim()) {
      const q = campingSearch.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
    }
    return result;
  }, [campingSearch, locationFilter]);

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
    return Math.floor(nights / 7) * chosenCaravan.pricePerWeek + (nights % 7) * chosenCaravan.pricePerDay;
  }, [chosenCaravan, nights]);

  const deposit = Math.round(totalPrice * 0.3);

  const canNext = () => {
    switch (step) {
      case 1: return checkIn && checkOut && nights > 0;
      case 2: return campingId !== '';
      case 3: return adults >= 1 && selectedCaravan !== '';
      case 4: return name && email && phone && termsAccepted;
      default: return false;
    }
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
          caravanId: selectedCaravan, campingId, spotNumber: spotNumber || undefined,
          checkIn, checkOut, nights, totalPrice, depositAmount: deposit,
          remainingAmount: totalPrice - deposit, borgAmount: chosenCaravan?.deposit || 0,
        }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setBookingRef(data.reference);
      setSubmitted(true);
    } catch {
      setSubmitError('Er ging iets mis. Probeer het opnieuw of neem contact met ons op.');
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }} className="text-center">
            {/* Animated check */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }} className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                  <CheckCircle size={48} className="text-emerald-500" />
                </motion.div>
              </motion.div>
              {/* Confetti dots */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ scale: [0, 1, 0], x: Math.cos(i * 45 * Math.PI / 180) * 60, y: Math.sin(i * 45 * Math.PI / 180) * 60 }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.8 }}
                  className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full ${['bg-primary', 'bg-accent', 'bg-emerald-400', 'bg-pink-400'][i % 4]}`}
                />
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Boekingsaanvraag ontvangen!</h1>
            <p className="text-gray-500 text-lg mb-2">
              Bedankt, <span className="font-semibold text-gray-700">{name}</span>! We nemen zo snel mogelijk contact met je op.
            </p>
            {bookingRef && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold mb-8">
                Ref: {bookingRef}
              </motion.div>
            )}

            {/* Summary card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-left mb-6">
              <div className="flex items-center gap-3 mb-4">
                {chosenCaravan && (
                  <div className="w-16 h-12 rounded-lg overflow-hidden relative shrink-0">
                    <Image src={chosenCaravan.photos[0]} alt={chosenCaravan.name} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{chosenCaravan?.name}</h3>
                  <p className="text-sm text-gray-500">{chosenCamping?.name}, {chosenCamping?.location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Aankomst</p><p className="font-semibold">{checkIn}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Vertrek</p><p className="font-semibold">{checkOut}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Nachten</p><p className="font-semibold">{nights}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Personen</p><p className="font-semibold">{adults} + {children} kind.</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Totaalprijs</span><span className="font-bold text-primary text-lg">&euro;{totalPrice}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Aanbetaling (30%)</span><span className="font-semibold text-accent">&euro;{deposit}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Borg</span><span className="font-medium">&euro;{chosenCaravan?.deposit}</span></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 mb-6">
              <strong>Volgende stap:</strong> Je ontvangt een e-mail met betaalinstructies voor de aanbetaling van &euro;{deposit}.
            </motion.div>

            <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
              Terug naar home <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== IMMERSIVE HERO ===== */}
      <section className="relative h-[45vh] min-h-[320px] lg:h-[50vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
          alt="Strand Costa Brava"
          fill className="object-cover" priority unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-gray-50" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold mb-4">
              <Sparkles size={14} /> Plan jouw droomvakantie
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
              Boek jouw <span className="text-accent">caravan</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto drop-shadow">
              In 5 simpele stappen naar een onvergetelijke vakantie aan de Costa Brava
            </p>
          </motion.div>

          {/* Trust pills */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { icon: <Shield size={14} />, text: 'Gratis annuleren' },
              { icon: <Clock size={14} />, text: 'Binnen 24u bevestiging' },
              { icon: <Star size={14} />, text: '4.8/5 beoordeling' },
            ].map(pill => (
              <span key={pill.text} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-white text-xs font-medium">
                {pill.icon} {pill.text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== PROGRESS BAR ===== */}
      <div ref={contentRef} className="sticky top-[100px] lg:top-[72px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          {/* Mobile progress */}
          <div className="lg:hidden py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">Stap {step} van 5</span>
              <span className="text-xs text-gray-500">{stepConfig[step - 1].desc}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${(step / 5) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full" />
            </div>
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDone ? 'bg-emerald-500 text-white' :
                      isCurrent ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? <Check size={18} /> : <StepIcon size={18} />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-gray-900' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>{s.label}</p>
                      <p className={`text-[11px] ${isCurrent ? 'text-gray-500' : 'text-gray-300'}`}>{s.desc}</p>
                    </div>
                  </div>
                  {i < stepConfig.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: isDone ? '100%' : isCurrent ? '50%' : '0%' }}
                          transition={{ duration: 0.4 }}
                          className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-primary'}`}
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
      <section className="py-8 lg:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Step content (2 cols on lg) */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>

                  {/* ===== STEP 1: DATES ===== */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Wanneer wil je op vakantie?</h2>
                        <p className="text-gray-500">Kies je gewenste aankomst- en vertrekdatum</p>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                              <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center"><CalendarDays size={14} className="text-emerald-600" /></div>
                              Aankomst
                            </label>
                            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-gray-900 font-medium" />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center"><CalendarDays size={14} className="text-blue-600" /></div>
                              Vertrek
                            </label>
                            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-gray-900 font-medium" />
                          </div>
                        </div>

                        {nights > 0 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 bg-gradient-to-r from-primary/5 to-blue-50 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <Sun size={20} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{nights} {nights === 1 ? 'nacht' : 'nachten'}</p>
                              <p className="text-sm text-gray-500">
                                {Math.floor(nights / 7)} {Math.floor(nights / 7) === 1 ? 'week' : 'weken'}
                                {nights % 7 > 0 ? ` en ${nights % 7} ${nights % 7 === 1 ? 'dag' : 'dagen'}` : ''}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {nights > 0 && nights < 7 && (
                          <div className="mt-3 flex items-start gap-2 text-amber-700 text-xs bg-amber-50 rounded-lg p-3">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            We raden minimaal 7 nachten aan voor de beste ervaring en prijs.
                          </div>
                        )}
                      </div>

                      {/* Quick pick */}
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-3">Populaire periodes</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: '1 week', days: 7, icon: '🌴' },
                            { label: '2 weken', days: 14, icon: '☀️' },
                            { label: '3 weken', days: 21, icon: '🏖️' },
                          ].map(q => {
                            const start = new Date();
                            start.setMonth(start.getMonth() + 4); // Suggest summer dates
                            start.setDate(1);
                            const end = new Date(start);
                            end.setDate(start.getDate() + q.days);
                            return (
                              <button
                                key={q.label}
                                onClick={() => {
                                  setCheckIn(start.toISOString().split('T')[0]);
                                  setCheckOut(end.toISOString().split('T')[0]);
                                }}
                                className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-primary hover:shadow-md transition-all group"
                              >
                                <span className="text-2xl mb-1 block">{q.icon}</span>
                                <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{q.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{q.days} nachten</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== STEP 2: DESTINATION ===== */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Op welke camping wil je staan?</h2>
                        <p className="text-gray-500">Zoek of selecteer een camping aan de Costa Brava</p>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                          <div className="relative flex-1">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" value={campingSearch} onChange={e => setCampingSearch(e.target.value)} placeholder="Zoek op campingnaam of stad..."
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
                          <button onClick={() => setLocationFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${locationFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            Alle locaties
                          </button>
                          {locations.map(loc => (
                            <button key={loc} onClick={() => setLocationFilter(loc)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${locationFilter === loc ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                              {loc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Camping cards */}
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                        {filteredCampings.map(c => {
                          const isSelected = campingId === c.id;
                          return (
                            <motion.button
                              key={c.id}
                              layout
                              onClick={() => setCampingId(c.id)}
                              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                                isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900">{c.name}</h3>
                                    {isSelected && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                        <Check size={12} className="text-white" />
                                      </motion.div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1.5">
                                    <MapPin size={13} /> {c.location}
                                  </div>
                                  <p className="text-xs text-gray-400 line-clamp-1">{c.description}</p>
                                </div>
                                <Tent size={20} className={`shrink-0 ml-3 mt-1 ${isSelected ? 'text-primary' : 'text-gray-300'}`} />
                              </div>
                            </motion.button>
                          );
                        })}
                        {filteredCampings.length === 0 && (
                          <div className="text-center py-10 text-gray-400">Geen campings gevonden.</div>
                        )}
                      </div>

                      {/* Spot number */}
                      {campingId && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Hash size={14} className="text-primary" />
                            Voorkeursplek (optioneel)
                          </label>
                          <input type="text" value={spotNumber} onChange={e => setSpotNumber(e.target.value)} placeholder="Bijv. 42 of A12"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                          <p className="text-xs text-gray-400 mt-1.5">Wij doen ons best om je voorkeursplek te reserveren.</p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* ===== STEP 3: TRAVELERS + CARAVAN ===== */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Wie gaat er mee?</h2>
                        <p className="text-gray-500">Kies het aantal reizigers en je caravan</p>
                      </div>

                      {/* Person counters */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">Volwassenen</p>
                              <p className="text-xs text-gray-400">18+ jaar</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors active:scale-95">
                                <Minus size={16} />
                              </button>
                              <span className="text-xl font-bold text-gray-900 w-8 text-center">{adults}</span>
                              <button onClick={() => setAdults(Math.min(6, adults + 1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors active:scale-95">
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">Kinderen</p>
                              <p className="text-xs text-gray-400">0 - 17 jaar</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors active:scale-95">
                                <Minus size={16} />
                              </button>
                              <span className="text-xl font-bold text-gray-900 w-8 text-center">{children}</span>
                              <button onClick={() => setChildren(Math.min(4, children + 1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors active:scale-95">
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                          <Users size={16} className="text-primary" />
                          <span className="text-sm font-medium text-gray-700">Totaal: {totalPersons} {totalPersons === 1 ? 'persoon' : 'personen'}</span>
                        </div>
                      </div>

                      {/* Caravan selection */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Kies je caravan</h3>
                        <p className="text-sm text-gray-500 mb-4">{availableCaravans.length} beschikbaar voor {totalPersons} personen</p>

                        <div className="space-y-4">
                          {availableCaravans.map(c => {
                            const isSelected = selectedCaravan === c.id;
                            const price = Math.floor(nights / 7) * c.pricePerWeek + (nights % 7) * c.pricePerDay;
                            return (
                              <motion.button
                                key={c.id}
                                layout
                                onClick={() => setSelectedCaravan(c.id)}
                                className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all ${
                                  isSelected ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-gray-100 bg-white hover:border-primary/30 hover:shadow-md'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row">
                                  <div className="relative h-44 sm:h-auto sm:w-52 shrink-0 overflow-hidden">
                                    <Image src={c.photos[0]} alt={c.name} fill className="object-cover" unoptimized />
                                    <div className="absolute top-3 left-3">
                                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold text-white shadow-md ${
                                        c.type === 'LUXE' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                        c.type === 'FAMILIE' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                                        'bg-gradient-to-r from-emerald-500 to-green-400'
                                      }`}>{c.type}</span>
                                    </div>
                                    {isSelected && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                                        <Check size={14} className="text-white" />
                                      </motion.div>
                                    )}
                                  </div>
                                  <div className="p-5 flex-1">
                                    <h4 className="font-bold text-lg text-gray-900 mb-1">{c.name}</h4>
                                    <p className="text-sm text-gray-500 mb-3">{c.maxPersons} personen &bull; {c.manufacturer} &bull; {c.year}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                      {c.amenities.slice(0, 5).map(a => (
                                        <span key={a} className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
                                      ))}
                                      {c.amenities.length > 5 && (
                                        <span className="text-[11px] font-medium bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">+{c.amenities.length - 5}</span>
                                      )}
                                    </div>
                                    <div className="flex items-end justify-between">
                                      <div>
                                        <p className="text-xs text-gray-400">Vanaf</p>
                                        <div className="flex items-baseline gap-2">
                                          <span className="text-2xl font-bold text-primary">&euro;{c.pricePerWeek}</span>
                                          <span className="text-sm text-gray-400">/week</span>
                                        </div>
                                      </div>
                                      {nights > 0 && (
                                        <div className="text-right">
                                          <p className="text-xs text-gray-400">Totaal voor {nights} nachten</p>
                                          <p className="text-lg font-bold text-accent">&euro;{price}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== STEP 4: CONTACT DETAILS ===== */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Jouw gegevens</h2>
                        <p className="text-gray-500">Vul je contactgegevens in zodat we je boeking kunnen bevestigen</p>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <User size={14} className="text-primary" /> Volledige naam
                          </label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jan Jansen"
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                              <Mail size={14} className="text-primary" /> E-mailadres
                            </label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl"
                              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                              <Phone size={14} className="text-primary" /> Telefoonnummer
                            </label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+31 6 12345678"
                              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <MessageSquare size={14} className="text-primary" /> Speciale verzoeken <span className="text-gray-400 font-normal">(optioneel)</span>
                          </label>
                          <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Schaduwplek gewenst, kinderstoel nodig, etc."
                            rows={3} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all resize-none" />
                        </div>
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 cursor-pointer bg-white rounded-xl p-4 border border-gray-100">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${termsAccepted ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {termsAccepted && <Check size={12} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="sr-only" />
                        <span className="text-sm text-gray-600">
                          Ik ga akkoord met de{' '}
                          <a href="/voorwaarden" target="_blank" className="text-primary underline font-medium">Algemene Voorwaarden</a>,{' '}
                          het <a href="/privacy" target="_blank" className="text-primary underline font-medium">Privacybeleid</a> en het{' '}
                          <a href="/voorwaarden#annulering" target="_blank" className="text-primary underline font-medium">Annuleringsbeleid</a>.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* ===== STEP 5: CONFIRMATION ===== */}
                  {step === 5 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Overzicht jouw boeking</h2>
                        <p className="text-gray-500">Controleer alle gegevens en verstuur je aanvraag</p>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Caravan strip */}
                        {chosenCaravan && (
                          <div className="relative h-40 sm:h-48">
                            <Image src={chosenCaravan.photos[0]} alt={chosenCaravan.name} fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="absolute bottom-4 left-5 right-5">
                              <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-bold text-white shadow-md mb-1 ${
                                chosenCaravan.type === 'LUXE' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                chosenCaravan.type === 'FAMILIE' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                                'bg-gradient-to-r from-emerald-500 to-green-400'
                              }`}>{chosenCaravan.type}</span>
                              <h3 className="text-white font-bold text-xl">{chosenCaravan.name}</h3>
                            </div>
                          </div>
                        )}

                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Aankomst</p>
                              <p className="font-semibold text-sm">{checkIn}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Vertrek</p>
                              <p className="font-semibold text-sm">{checkOut}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Nachten</p>
                              <p className="font-semibold text-sm">{nights}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Personen</p>
                              <p className="font-semibold text-sm">{adults} + {children}</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Camping</p>
                            <p className="font-semibold">{chosenCamping?.name}, {chosenCamping?.location}</p>
                            {spotNumber && <p className="text-sm text-gray-500 mt-0.5">Plek: {spotNumber}</p>}
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Contactgegevens</p>
                            <p className="font-semibold">{name}</p>
                            <p className="text-sm text-gray-500">{email} &bull; {phone}</p>
                          </div>

                          <div className="border-t border-gray-100 pt-4 space-y-2">
                            <div className="flex justify-between"><span className="text-gray-500">Totaalprijs</span><span className="font-bold text-xl text-primary">&euro;{totalPrice}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Aanbetaling (30%)</span><span className="font-bold text-accent">&euro;{deposit}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Borg (retour na inspectie)</span><span className="font-medium">&euro;{chosenCaravan?.deposit}</span></div>
                          </div>
                        </div>
                      </div>

                      {submitError && (
                        <div className="bg-red-50 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
                          <Info size={16} /> {submitError}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ===== NAVIGATION BUTTONS ===== */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                {step > 1 ? (
                  <button onClick={goBack} className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-all active:scale-95">
                    <ArrowLeft size={18} /> Vorige
                  </button>
                ) : <div />}

                {step < 5 ? (
                  <button onClick={goNext} disabled={!canNext()} className="inline-flex items-center gap-2 px-7 py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 disabled:shadow-none">
                    Volgende <ArrowRight size={18} />
                  </button>
                ) : step === 5 ? (
                  <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95 text-base">
                    {submitting ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verwerken...</>
                    ) : (
                      <><CreditCard size={20} /> Boekingsaanvraag versturen</>
                    )}
                  </button>
                ) : null}
              </div>
            </div>

            {/* ===== RIGHT SIDEBAR ===== */}
            <div className="hidden lg:block">
              <div className="sticky top-[140px] space-y-5">
                {/* Live summary card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary-dark p-5 text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles size={18} /> Jouw boeking</h3>
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    {/* Dates */}
                    <div className="flex items-start gap-3">
                      <CalendarDays size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{checkIn && checkOut ? `${checkIn} – ${checkOut}` : 'Nog geen datum'}</p>
                        {nights > 0 && <p className="text-xs text-gray-400">{nights} nachten</p>}
                      </div>
                    </div>

                    {/* Camping */}
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{chosenCamping ? chosenCamping.name : 'Nog geen camping'}</p>
                        {chosenCamping && <p className="text-xs text-gray-400">{chosenCamping.location}</p>}
                      </div>
                    </div>

                    {/* Persons */}
                    <div className="flex items-start gap-3">
                      <Users size={16} className="text-primary shrink-0 mt-0.5" />
                      <p className="font-medium text-gray-900">{totalPersons} personen ({adults} volw.{children > 0 ? `, ${children} kind.` : ''})</p>
                    </div>

                    {/* Caravan */}
                    {chosenCaravan && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-7 rounded overflow-hidden relative shrink-0 mt-0.5">
                          <Image src={chosenCaravan.photos[0]} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{chosenCaravan.name}</p>
                          <p className="text-xs text-gray-400">{chosenCaravan.type}</p>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    {totalPrice > 0 && (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-gray-500">Totaal</span>
                          <motion.span key={totalPrice} initial={{ scale: 1.2, color: '#f59e0b' }} animate={{ scale: 1, color: '#2563eb' }} className="text-xl font-bold">&euro;{totalPrice}</motion.span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Aanbetaling (30%)</span>
                          <span className="font-semibold text-accent">&euro;{deposit}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust signals */}
                <div className="bg-emerald-50 rounded-2xl p-5 space-y-3">
                  {[
                    { icon: <Shield size={16} className="text-emerald-600" />, text: 'Gratis annuleren tot 14 dagen voor vertrek' },
                    { icon: <Star size={16} className="text-emerald-600" />, text: '350+ tevreden gasten, 4.8/5 beoordeling' },
                    { icon: <Clock size={16} className="text-emerald-600" />, text: 'Bevestiging binnen 24 uur' },
                  ].map(item => (
                    <div key={item.text} className="flex items-start gap-2.5">
                      <div className="shrink-0 mt-0.5">{item.icon}</div>
                      <p className="text-xs text-emerald-800 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Need help */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Hulp nodig?</p>
                  <p className="text-xs text-gray-500 mb-3">Wij helpen je graag met je boeking</p>
                  <a href="https://wa.me/34600000000" target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-semibold transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MOBILE STICKY SUMMARY ===== */}
      {totalPrice > 0 && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-30">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Totaalprijs</p>
              <p className="text-lg font-bold text-primary">&euro;{totalPrice}</p>
            </div>
            {chosenCaravan && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 rounded overflow-hidden relative">
                  <Image src={chosenCaravan.photos[0]} alt="" fill className="object-cover" unoptimized />
                </div>
                <span className="text-xs font-medium text-gray-600 max-w-[100px] truncate">{chosenCaravan.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
