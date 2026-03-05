'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, MapPin, Users, Minus, Plus, Search, ChevronDown, X, Check } from 'lucide-react';
import { campings } from '@/data/campings';
import { useLanguage } from '@/i18n/context';

/* ------------------------------------------------------------------ */
/*  Mobile bottom-sheet overlay for dropdowns                          */
/* ------------------------------------------------------------------ */
function MobileSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b">
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                <X size={16} className="text-muted" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Widget                                                             */
/* ------------------------------------------------------------------ */

export default function BookingWidget() {
  const router = useRouter();
  const { t } = useLanguage();
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
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  // Detect mobile (<1024px = lg breakpoint)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const openCheckIn = useCallback(() => {
    checkInRef.current?.showPicker?.();
    checkInRef.current?.focus();
  }, []);

  const openCheckOut = useCallback(() => {
    checkOutRef.current?.showPicker?.();
    checkOutRef.current?.focus();
  }, []);

  // Close dropdowns on outside click (desktop only)
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

  /* ---- Shared camping list content ---- */
  const campingListContent = (
    <>
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5">
          <Search size={16} className="text-muted shrink-0" />
          <input
            type="text"
            value={campingSearch}
            onChange={e => setCampingSearch(e.target.value)}
            placeholder={t('booking.widgetSearchCamping')}
            className="flex-1 bg-transparent text-sm outline-none"
            autoFocus
          />
          {campingSearch && (
            <button onClick={() => setCampingSearch('')}>
              <X size={16} className="text-muted" />
            </button>
          )}
        </div>
      </div>
      <div>
        {filteredCampings.length === 0 ? (
          <div className="p-6 text-sm text-muted text-center">{t('booking.widgetNoCampings')}</div>
        ) : (
          filteredCampings.map(c => {
            const isSelected = campingId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setCampingId(c.id); setCampingOpen(false); setCampingSearch(''); }}
                className={`w-full text-left px-5 py-3.5 flex items-center justify-between border-b border-surface last:border-0 ${
                  isSelected ? 'bg-primary/5' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                  <div className="text-xs text-muted mt-0.5">{c.location}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0 ml-3">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );

  /* ---- Shared guests content ---- */
  const guestsContent = (
    <div className="p-5 space-y-1">
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-sm font-semibold text-foreground">{t('booking.widgetAdults')}</div>
          <div className="text-xs text-muted">{t('booking.widgetAdultsAge')}</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAdults(Math.max(1, adults - 1))}
            className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-30"
            disabled={adults <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-lg font-bold">{adults}</span>
          <button
            onClick={() => setAdults(Math.min(6, adults + 1))}
            className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-30"
            disabled={adults >= 6}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between py-4 border-t">
        <div>
          <div className="text-sm font-semibold text-foreground">{t('booking.widgetChildren')}</div>
          <div className="text-xs text-muted">{t('booking.widgetChildrenAge')}</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setChildren(Math.max(0, children - 1))}
            className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-30"
            disabled={children <= 0}
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-lg font-bold">{children}</span>
          <button
            onClick={() => setChildren(Math.min(6, children + 1))}
            className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-30"
            disabled={children >= 6}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      {/* Confirm button (mobile only) */}
      <div className="pt-3">
        <button
          onClick={() => setGuestsOpen(false)}
          className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm"
        >
          {t('booking.widgetConfirm') || 'Bevestigen'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile bottom-sheet overlays (rendered via portal, outside overflow-hidden) */}
      {isMobile && (
        <>
          <MobileSheet
            open={campingOpen}
            onClose={() => { setCampingOpen(false); setCampingSearch(''); }}
            title={t('booking.widgetCamping')}
          >
            {campingListContent}
          </MobileSheet>
          <MobileSheet
            open={guestsOpen}
            onClose={() => setGuestsOpen(false)}
            title={t('booking.widgetGuests')}
          >
            {guestsContent}
          </MobileSheet>
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' as const }}
        className="w-full"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl lg:rounded-full shadow-2xl border border-white/20 p-3 lg:p-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0">
            {/* Check-in */}
            <div
              onClick={openCheckIn}
              className="flex-1 px-3 lg:px-5 py-2 lg:py-3 lg:border-r cursor-pointer rounded-xl"
            >
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">{t('booking.arrivalLabel')}</span>
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary shrink-0" />
                <input
                  ref={checkInRef}
                  type="date"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Check-out */}
            <div
              onClick={openCheckOut}
              className="flex-1 px-3 lg:px-5 py-2 lg:py-3 lg:border-r cursor-pointer rounded-xl"
            >
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">{t('booking.departureLabel')}</span>
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary shrink-0" />
                <input
                  ref={checkOutRef}
                  type="date"
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Camping selector */}
            <div
              className="flex-1 px-3 lg:px-5 py-2 lg:py-3 lg:border-r relative cursor-pointer rounded-xl"
              ref={campingRef}
              onClick={() => { setCampingOpen(!campingOpen); setGuestsOpen(false); }}
            >
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">{t('booking.widgetCamping')}</span>
              <button className="flex items-center gap-2 w-full text-left min-w-0">
                <MapPin size={16} className="text-primary shrink-0" />
                <span className={`text-sm font-medium flex-1 min-w-0 ${selectedCamping ? 'text-foreground' : 'text-muted'}`}>
                  <span className="block truncate">{selectedCamping ? selectedCamping.name : t('booking.widgetChoose')}</span>
                </span>
                <ChevronDown size={14} className={`text-muted transition-transform ${campingOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop dropdown only */}
              {!isMobile && campingOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 right-0 lg:left-auto lg:right-auto lg:w-96 top-full mt-2 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden"
                >
                  {campingListContent}
                </motion.div>
              )}
            </div>

            {/* Guests */}
            <div
              className="flex-1 px-3 lg:px-5 py-2 lg:py-3 relative cursor-pointer rounded-xl"
              ref={guestsRef}
              onClick={() => { setGuestsOpen(!guestsOpen); setCampingOpen(false); }}
            >
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">{t('booking.widgetGuests')}</span>
              <button className="flex items-center gap-2 w-full text-left">
                <Users size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  {adults} {t('booking.widgetAdultsShort')}{children > 0 ? `, ${children} ${t('booking.widgetChildrenShort')}` : ''}
                </span>
                <ChevronDown size={14} className={`text-muted transition-transform ${guestsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop dropdown only */}
              {!isMobile && guestsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 right-0 lg:left-auto lg:right-0 lg:w-72 top-full mt-2 bg-white rounded-2xl shadow-2xl border z-50 p-4"
                >
                  {guestsContent}
                </motion.div>
              )}
            </div>

            {/* Search button */}
            <div className="px-1 py-1">
              <button
                onClick={handleSearch}
                className="w-full lg:w-auto px-6 lg:px-8 py-3.5 lg:py-4 bg-primary text-white font-bold rounded-xl lg:rounded-full flex items-center justify-center gap-2 shadow-lg"
              >
                <Search size={18} />
                <span>{t('booking.widgetSearch')}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
