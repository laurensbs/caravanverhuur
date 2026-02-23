'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  MapPin,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  Phone,
  MessageSquare,
  Search,
  Hash,
  Filter,
} from 'lucide-react';
import { caravans, getCaravanById } from '@/data/caravans';
import { campings } from '@/data/campings';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const stepLabels = [
  'Datum',
  'Camping',
  'Personen',
  'Caravan',
  'Gegevens',
  'Bevestiging',
];

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

function BoekenContent() {
  const searchParams = useSearchParams();
  const preselectedCaravan = searchParams.get('caravan');

  const [step, setStep] = useState<Step>(1);
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

  // Fetch unavailable caravans from database
  useEffect(() => {
    fetch('/api/admin/caravan-settings?unavailable=true')
      .then(res => res.json())
      .then(data => setUnavailableIds(data.unavailableIds || []))
      .catch(() => {});
  }, []);

  const locations = useMemo(() => {
    const locs = [...new Set(campings.map(c => c.location))].sort();
    return locs;
  }, []);

  const filteredCampings = useMemo(() => {
    let result = campings;
    if (locationFilter !== 'all') {
      result = result.filter(c => c.location === locationFilter);
    }
    if (campingSearch.trim()) {
      const q = campingSearch.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [campingSearch, locationFilter]);

  const totalPersons = adults + children;

  const availableCaravans = caravans.filter(
    c => c.maxPersons >= totalPersons && !unavailableIds.includes(c.id)
  );

  const chosenCaravan = selectedCaravan ? getCaravanById(selectedCaravan) : null;
  const chosenCamping = campingId ? campings.find(c => c.id === campingId) : null;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(() => {
    if (!chosenCaravan || nights <= 0) return 0;
    const weeks = Math.floor(nights / 7);
    const extraDays = nights % 7;
    return weeks * chosenCaravan.pricePerWeek + extraDays * chosenCaravan.pricePerDay;
  }, [chosenCaravan, nights]);

  const deposit = Math.round(totalPrice * 0.3);

  const canNext = () => {
    switch (step) {
      case 1: return checkIn && checkOut && nights > 0;
      case 2: return campingId !== '';
      case 3: return adults >= 1;
      case 4: return selectedCaravan !== '';
      case 5: return name && email && phone && termsAccepted;
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
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
          adults,
          children,
          specialRequests: specialRequests || undefined,
          caravanId: selectedCaravan,
          campingId,
          spotNumber: spotNumber || undefined,
          checkIn,
          checkOut,
          nights,
          totalPrice,
          depositAmount: deposit,
          remainingAmount: totalPrice - deposit,
          borgAmount: chosenCaravan?.deposit || 0,
        }),
      });
      if (!res.ok) throw new Error('Booking failed');
      const data = await res.json();
      setBookingRef(data.reference);
      setSubmitted(true);
    } catch {
      setSubmitError('Er ging iets mis. Probeer het opnieuw of neem contact met ons op.');
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 6) as Step); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 1) as Step); };

  if (submitted) {
    return (
      <section className="py-20 min-h-[70vh] flex items-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Boekingsaanvraag ontvangen!</h1>
            <p className="text-muted text-lg mb-2">
              Bedankt, {name}! We hebben je aanvraag ontvangen en nemen zo snel mogelijk contact met je op via <strong>{email}</strong>.
            </p>
            {bookingRef && <p className="text-primary font-semibold mb-6">Referentienummer: {bookingRef}</p>}
            <div className="bg-surface rounded-2xl p-6 mb-8 text-left border border-border">
              <h3 className="font-semibold mb-4">Samenvatting</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Caravan:</span><span className="font-medium">{chosenCaravan?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted">Camping:</span><span className="font-medium">{chosenCamping?.name}</span></div>
                {spotNumber && <div className="flex justify-between"><span className="text-muted">Pleknummer:</span><span className="font-medium">{spotNumber}</span></div>}
                <div className="flex justify-between"><span className="text-muted">Periode:</span><span className="font-medium">{checkIn} t/m {checkOut} ({nights} nachten)</span></div>
                <div className="flex justify-between"><span className="text-muted">Personen:</span><span className="font-medium">{adults} volw. + {children} kind.</span></div>
                <div className="border-t border-border my-3" />
                <div className="flex justify-between"><span className="text-muted">Totaalprijs:</span><span className="font-bold text-primary">&euro;{totalPrice}</span></div>
                <div className="flex justify-between"><span className="text-muted">Aanbetaling (30%):</span><span className="font-bold text-accent">&euro;{deposit}</span></div>
                <div className="flex justify-between"><span className="text-muted">Borg:</span><span className="font-medium">&euro;{chosenCaravan?.deposit}</span></div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-primary-dark mb-8">
              <strong>Volgende stap:</strong> Je ontvangt een e-mail met betaalinstructies voor de aanbetaling van &euro;{deposit}. Na ontvangst is je boeking definitief bevestigd.
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="relative h-[35vh] min-h-[240px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1526491109649-aa0bf9a186e6?w=1920&q=80"
          alt="Camping aan de Costa Brava"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-bold mb-3 drop-shadow-lg">
              Boek jouw caravan
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/90 text-lg drop-shadow">
              Volg de stappen en boek jouw zorgeloze caravanvakantie
            </motion.p>
          </div>
        </div>
      </section>

      {/* Progress */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i + 1 < step ? 'bg-green-500 text-white' :
                    i + 1 === step ? 'bg-primary text-white shadow-lg' :
                    'bg-surface text-muted'
                  }`}>
                    {i + 1 < step ? <CheckCircle size={18} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 hidden sm:block ${i + 1 === step ? 'text-primary font-semibold' : 'text-muted'}`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mt-[-1rem] sm:mt-0 ${i + 1 < step ? 'bg-green-500' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <section className="py-12 min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Date */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <CalendarDays className="text-primary" size={28} />
                      Wanneer wil je op vakantie?
                    </h2>
                    <p className="text-muted">Kies je gewenste aankomst- en vertrekdatum.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Aankomstdatum</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={e => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Vertrekdatum</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={e => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  {nights > 0 && (
                    <div className="bg-primary/5 rounded-xl p-4 text-sm text-primary font-medium">
                      Verblijfsduur: {nights} {nights === 1 ? 'nacht' : 'nachten'} ({Math.floor(nights / 7)} {Math.floor(nights / 7) === 1 ? 'week' : 'weken'}{nights % 7 > 0 ? ` en ${nights % 7} ${nights % 7 === 1 ? 'dag' : 'dagen'}` : ''})
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Camping */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="text-primary" size={28} />
                      Op welke camping?
                    </h2>
                    <p className="text-muted">Zoek of selecteer een camping op de Costa Brava.</p>
                  </div>

                  {/* Search + Location filter */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        value={campingSearch}
                        onChange={e => setCampingSearch(e.target.value)}
                        placeholder="Zoek op campingnaam of stad..."
                        className="w-full pl-11 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <Filter size={14} className="text-muted shrink-0" />
                      <button
                        onClick={() => setLocationFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          locationFilter === 'all' ? 'bg-primary text-white' : 'bg-surface text-foreground hover:bg-surface-alt'
                        }`}
                      >
                        Alle locaties
                      </button>
                      {locations.map(loc => (
                        <button
                          key={loc}
                          onClick={() => setLocationFilter(loc)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                            locationFilter === loc ? 'bg-primary text-white' : 'bg-surface text-foreground hover:bg-surface-alt'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Camping list */}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {filteredCampings.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setCampingId(c.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          campingId === c.id
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/30 hover:bg-surface'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-foreground">{c.name}</div>
                            <div className="text-sm text-muted flex items-center gap-1"><MapPin size={12} /> {c.location}</div>
                            <div className="text-xs text-muted mt-1">{c.description}</div>
                          </div>
                          {campingId === c.id && (
                            <CheckCircle size={20} className="text-primary shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    ))}
                    {filteredCampings.length === 0 && (
                      <p className="text-center text-muted py-8">Geen campings gevonden. Probeer een andere zoekterm.</p>
                    )}
                  </div>

                  {/* Spot number input */}
                  {campingId && (
                    <div className="bg-surface rounded-xl p-4 border border-border">
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Hash size={14} className="text-primary" />
                        Pleknummer (optioneel)
                      </label>
                      <input
                        type="text"
                        value={spotNumber}
                        onChange={e => setSpotNumber(e.target.value)}
                        placeholder="Bijv. 42, A12, of laat leeg voor geen voorkeur"
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                      />
                      <p className="text-xs text-muted mt-1.5">Heb je een voorkeursplek? Wij doen ons best om deze te reserveren.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Persons */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <Users className="text-primary" size={28} />
                      Hoeveel personen?
                    </h2>
                    <p className="text-muted">Geef aan hoeveel volwassenen en kinderen meegaan.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-surface rounded-2xl p-6 border border-border">
                      <label className="block text-sm font-medium text-foreground mb-4">Volwassenen</label>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-xl font-bold text-foreground hover:bg-surface-alt transition-colors"
                        >
                          -
                        </button>
                        <span className="text-3xl font-bold text-primary w-12 text-center">{adults}</span>
                        <button
                          onClick={() => setAdults(Math.min(6, adults + 1))}
                          className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-xl font-bold text-foreground hover:bg-surface-alt transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="bg-surface rounded-2xl p-6 border border-border">
                      <label className="block text-sm font-medium text-foreground mb-4">Kinderen (0-17 jaar)</label>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-xl font-bold text-foreground hover:bg-surface-alt transition-colors"
                        >
                          -
                        </button>
                        <span className="text-3xl font-bold text-primary w-12 text-center">{children}</span>
                        <button
                          onClick={() => setChildren(Math.min(4, children + 1))}
                          className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-xl font-bold text-foreground hover:bg-surface-alt transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-4 text-sm text-primary font-medium">
                    Totaal: {totalPersons} {totalPersons === 1 ? 'persoon' : 'personen'}{' '}
                    ({adults} volw.{children > 0 ? ` + ${children} kind.` : ''})
                  </div>
                </div>
              )}

              {/* Step 4: Caravan selection */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Kies je caravan</h2>
                    <p className="text-muted">Beschikbare caravans voor {totalPersons} personen:</p>
                  </div>
                  <div className="space-y-4">
                    {availableCaravans.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCaravan(c.id)}
                        className={`w-full text-left rounded-2xl border overflow-hidden transition-all ${
                          selectedCaravan === c.id
                            ? 'border-primary shadow-lg'
                            : 'border-border hover:border-primary/30 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative h-40 sm:h-auto sm:w-48 shrink-0">
                            <Image src={c.photos[0]} alt={c.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="p-4 flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold text-white ${
                                  c.type === 'LUXE' ? 'bg-yellow-500' :
                                  c.type === 'FAMILIE' ? 'bg-primary' : 'bg-green-500'
                                }`}>{c.type}</span>
                                <h3 className="font-bold text-foreground mt-1">{c.name}</h3>
                              </div>
                              {selectedCaravan === c.id && <CheckCircle size={22} className="text-primary" />}
                            </div>
                            <p className="text-sm text-muted mb-2">{c.maxPersons} personen &bull; {c.manufacturer} &bull; {c.year}</p>
                            <div className="flex gap-4 text-sm">
                              <span className="font-bold text-primary">&euro;{c.pricePerDay}/dag</span>
                              <span className="font-bold text-primary">&euro;{c.pricePerWeek}/week</span>
                            </div>
                            {nights > 0 && (
                              <div className="mt-2 text-sm text-accent font-semibold">
                                Totaal voor {nights} nachten: &euro;{Math.floor(nights / 7) * c.pricePerWeek + (nights % 7) * c.pricePerDay}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Contact details */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                      <User className="text-primary" size={28} />
                      Jouw gegevens
                    </h2>
                    <p className="text-muted">Vul je contactgegevens in en ga akkoord met de voorwaarden.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <span className="flex items-center gap-1"><User size={14} /> Volledige naam *</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Jan Jansen"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <span className="flex items-center gap-1"><Mail size={14} /> E-mailadres *</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="jan@voorbeeld.nl"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <span className="flex items-center gap-1"><Phone size={14} /> Telefoonnummer *</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+31 6 12345678"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <span className="flex items-center gap-1"><MessageSquare size={14} /> Speciale verzoeken</span>
                      </label>
                      <textarea
                        value={specialRequests}
                        onChange={e => setSpecialRequests(e.target.value)}
                        placeholder="Heb je speciale wensen of vragen? Laat het ons weten..."
                        rows={3}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-surface rounded-2xl p-6 border border-border">
                    <h3 className="font-semibold mb-4">Overzicht boeking</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted">Caravan:</span><span className="font-medium">{chosenCaravan?.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Camping:</span><span className="font-medium">{chosenCamping?.name}, {chosenCamping?.location}</span></div>
                      {spotNumber && <div className="flex justify-between"><span className="text-muted">Pleknummer:</span><span className="font-medium">{spotNumber}</span></div>}
                      <div className="flex justify-between"><span className="text-muted">Periode:</span><span className="font-medium">{checkIn} t/m {checkOut}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Nachten:</span><span className="font-medium">{nights}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Personen:</span><span className="font-medium">{adults} volw. + {children} kind.</span></div>
                      <div className="border-t border-border my-3" />
                      <div className="flex justify-between text-base"><span className="font-semibold">Totaalprijs:</span><span className="font-bold text-primary">&euro;{totalPrice}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Aanbetaling (30%):</span><span className="font-bold text-accent">&euro;{deposit}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Borg:</span><span className="font-medium">&euro;{chosenCaravan?.deposit}</span></div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={e => setTermsAccepted(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-muted">
                        Ik ga akkoord met de{' '}
                        <a href="/voorwaarden" target="_blank" className="text-primary underline">Algemene Voorwaarden</a>,{' '}
                        het <a href="/privacy" target="_blank" className="text-primary underline">Privacybeleid</a> en het{' '}
                        <a href="/voorwaarden#annulering" target="_blank" className="text-primary underline">Annuleringsbeleid</a>. *
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 6 won't render because we redirect to submitted state */}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t border-border">
            {step > 1 ? (
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-full text-foreground font-medium hover:bg-surface transition-all"
              >
                <ArrowLeft size={18} />
                Vorige
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={goNext}
                disabled={!canNext()}
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark disabled:bg-border disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg"
              >
                Volgende
                <ArrowRight size={18} />
              </button>
            ) : step === 5 ? (
              <>
                {submitError && <p className="text-red-500 text-sm mr-4">{submitError}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={!canNext() || submitting}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent disabled:from-border disabled:to-border disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verwerken...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Boekingsaanvraag versturen
                    </>
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
