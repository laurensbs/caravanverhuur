'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Users, Minus, Plus, Search, ChevronDown, X } from 'lucide-react';
import { campings } from '@/data/campings';

export default function BookingWidget() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [campingId, setCampingId] = useState('');
  const [campingSearch, setCampingSearch] = useState('');
  const [campingOpen, setCampingOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const campingRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (campingRef.current && !campingRef.current.contains(e.target as Node)) setCampingOpen(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) setGuestsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCampings = useMemo(() => {
    if (!campingSearch.trim()) return campings;
    const q = campingSearch.toLowerCase();
    return campings.filter(
      c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
    );
  }, [campingSearch]);

  const selectedCamping = campings.find(c => c.id === campingId);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (campingId) params.set('camping', campingId);
    params.set('adults', adults.toString());
    params.set('children', children.toString());
    router.push(`/boeken?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="w-full"
    >
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl lg:rounded-full shadow-2xl border border-white/20 p-3 lg:p-2">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0">
          {/* Check-in */}
          <div className="flex-1 px-3 lg:px-5 py-2 lg:py-3 lg:border-r border-border">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Aankomst</label>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary shrink-0" />
              <input
                type="date"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer"
                placeholder="Datum"
              />
            </div>
          </div>

          {/* Check-out */}
          <div className="flex-1 px-3 lg:px-5 py-2 lg:py-3 lg:border-r border-border">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Vertrek</label>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary shrink-0" />
              <input
                type="date"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Camping selector */}
          <div className="flex-1 px-3 lg:px-5 py-2 lg:py-3 lg:border-r border-border relative" ref={campingRef}>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Camping</label>
            <button
              onClick={() => { setCampingOpen(!campingOpen); setGuestsOpen(false); }}
              className="flex items-center gap-2 w-full text-left"
            >
              <MapPin size={16} className="text-primary shrink-0" />
              <span className={`text-sm font-medium truncate flex-1 ${selectedCamping ? 'text-foreground' : 'text-muted'}`}>
                {selectedCamping ? selectedCamping.name : 'Kies camping'}
              </span>
              <ChevronDown size={14} className={`text-muted transition-transform ${campingOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Camping dropdown */}
            {campingOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 right-0 lg:left-auto lg:right-auto lg:w-96 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2">
                    <Search size={14} className="text-muted" />
                    <input
                      type="text"
                      value={campingSearch}
                      onChange={e => setCampingSearch(e.target.value)}
                      placeholder="Zoek camping of stad..."
                      className="flex-1 bg-transparent text-sm outline-none"
                      autoFocus
                    />
                    {campingSearch && (
                      <button onClick={() => setCampingSearch('')}>
                        <X size={14} className="text-muted" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredCampings.length === 0 ? (
                    <div className="p-4 text-sm text-muted text-center">Geen campings gevonden</div>
                  ) : (
                    filteredCampings.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setCampingId(c.id); setCampingOpen(false); setCampingSearch(''); }}
                        className={`w-full text-left px-4 py-3 hover:bg-surface transition-colors flex items-center justify-between ${
                          campingId === c.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                          <div className="text-xs text-muted">{c.location}</div>
                        </div>
                        {campingId === c.id && (
                          <div className="w-2 h-2 bg-primary rounded-full shrink-0 ml-2" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Guests */}
          <div className="flex-1 px-3 lg:px-5 py-2 lg:py-3 relative" ref={guestsRef}>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Gasten</label>
            <button
              onClick={() => { setGuestsOpen(!guestsOpen); setCampingOpen(false); }}
              className="flex items-center gap-2 w-full text-left"
            >
              <Users size={16} className="text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {adults} volw.{children > 0 ? `, ${children} kind.` : ''}
              </span>
              <ChevronDown size={14} className={`text-muted transition-transform ${guestsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Guests dropdown */}
            {guestsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 right-0 lg:left-auto lg:right-0 lg:w-72 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-border z-50 p-4"
              >
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Volwassenen</div>
                    <div className="text-xs text-muted">18 jaar en ouder</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                      disabled={adults <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-semibold">{adults}</span>
                    <button
                      onClick={() => setAdults(Math.min(6, adults + 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                      disabled={adults >= 6}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <div>
                    <div className="text-sm font-medium text-foreground">Kinderen</div>
                    <div className="text-xs text-muted">0-17 jaar</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                      disabled={children <= 0}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-semibold">{children}</span>
                    <button
                      onClick={() => setChildren(Math.min(6, children + 1))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
                      disabled={children >= 6}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Search button */}
          <div className="px-1 py-1">
            <button
              onClick={handleSearch}
              className="w-full lg:w-auto px-6 lg:px-8 py-3.5 lg:py-4 bg-accent hover:bg-accent-dark text-white font-bold rounded-xl lg:rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              <Search size={18} />
              <span>Zoeken</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
