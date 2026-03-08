'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, MapPin, Users, Minus, Plus, Search, ChevronDown, X, Check } from 'lucide-react';
import { campings as staticCampings, type Camping } from '@/data/campings';
import { useLanguage } from '@/i18n/context';

/* ------------------------------------------------------------------ */
/*  Mobile bottom-sheet overlay for dropdowns                          */
/* ------------------------------------------------------------------ */
function MobileSheet({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
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
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-primary font-medium truncate mt-0.5 flex items-center gap-1">
                    <Check size={11} className="shrink-0" />
                    {subtitle}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 ml-3">
                <X size={18} className="text-muted" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[env(safe-area-inset-bottom)]">
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
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [campingOpen, setCampingOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [campings, setCampings] = useState<Camping[]>(staticCampings);
  const campingRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);
  const campingDropRef = useRef<HTMLDivElement>(null);
  const guestsDropRef = useRef<HTMLDivElement>(null);
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  // Desktop dropdown portal positioning
  const [campingDropdownPos, setCampingDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [guestsDropdownPos, setGuestsDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Detect mobile (<1024px = lg breakpoint)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch campings from DB (admin-managed)
  useEffect(() => {
    fetch('/api/campings')
      .then(res => res.json())
      .then(data => { if (data.campings?.length) setCampings(data.campings); })
      .catch(() => {});
  }, []);

  const openCheckIn = useCallback(() => {
    checkInRef.current?.showPicker?.();
    checkInRef.current?.focus();
  }, []);

  const openCheckOut = useCallback(() => {
    checkOutRef.current?.showPicker?.();
    checkOutRef.current?.focus();
  }, []);

  // Close dropdowns on outside click (desktop only — skip on mobile where MobileSheet is used)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inCampingTrigger = campingRef.current?.contains(target);
      const inCampingDrop = campingDropRef.current?.contains(target);
      if (!inCampingTrigger && !inCampingDrop) setCampingOpen(false);
      const inGuestsTrigger = guestsRef.current?.contains(target);
      const inGuestsDrop = guestsDropRef.current?.contains(target);
      if (!inGuestsTrigger && !inGuestsDrop) setGuestsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile]);

  // Update dropdown positions for desktop portals
  useEffect(() => {
    if (isMobile) return;
    const updatePositions = () => {
      if (campingOpen && campingRef.current) {
        const rect = campingRef.current.getBoundingClientRect();
        setCampingDropdownPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 384) });
      }
      if (guestsOpen && guestsRef.current) {
        const rect = guestsRef.current.getBoundingClientRect();
        setGuestsDropdownPos({ top: rect.bottom + 8, left: rect.right - 288, width: 288 });
      }
    };
    updatePositions();
    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isMobile, campingOpen, guestsOpen]);

  const filteredCampings = useMemo(() => {
    if (!campingSearch.trim()) return campings;
    const q = campingSearch.toLowerCase();
    return campings.filter(
      c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
    );
  }, [campingSearch, campings]);

  const groupedCampings = useMemo(() => {
    const groups: Record<string, typeof campings> = {};
    for (const c of filteredCampings) {
      if (!groups[c.location]) groups[c.location] = [];
      groups[c.location].push(c);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCampings]);

  const toggleLocation = useCallback((location: string) => {
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(location)) next.delete(location);
      else next.add(location);
      return next;
    });
  }, []);

  // Auto-expand all locations on desktop for better overview
  useEffect(() => {
    if (!isMobile && campingOpen) {
      const allLocations = new Set(campings.map(c => c.location));
      setExpandedLocations(allLocations);
    }
  }, [isMobile, campingOpen, campings]);

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
      <div className="p-3">
        <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5">
          <Search size={16} className="text-muted shrink-0" />
          <input
            type="text"
            value={campingSearch}
            onChange={e => setCampingSearch(e.target.value)}
            placeholder={t('booking.widgetSearchCamping')}
            className="flex-1 bg-transparent text-base sm:text-sm outline-none"
          />
          {campingSearch && (
            <button onClick={() => setCampingSearch('')}>
              <X size={16} className="text-muted" />
            </button>
          )}
        </div>
      </div>
      <div className="pb-2">
        {groupedCampings.length === 0 ? (
          <div className="p-6 text-sm text-muted text-center">{t('booking.widgetNoCampings')}</div>
        ) : (
          groupedCampings.map(([location, locationCampings]) => {
            const hasSelected = locationCampings.some(c => c.id === campingId);
            const isExpanded = expandedLocations.has(location) || campingSearch.trim().length > 0 || hasSelected;
            return (
              <div key={location}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLocation(location); }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between border-b border-gray-100 ${
                    hasSelected ? 'bg-primary/5' : 'bg-gray-50/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={15} className={hasSelected ? 'text-primary' : 'text-primary shrink-0'} />
                    <span className={`text-sm font-bold truncate ${hasSelected ? 'text-primary' : 'text-foreground'}`}>{location}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted bg-white rounded-full px-2 py-0.5 font-medium shadow-sm">
                      {locationCampings.length}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {isExpanded && locationCampings.map(c => {
                  const isSelected = campingId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCampingId(c.id);
                        setCampingOpen(false);
                        setCampingSearch('');
                      }}
                      className={`w-full text-left pl-10 pr-4 py-3 flex items-center justify-between border-b border-gray-50 ${
                        isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <span className={`text-sm truncate flex-1 min-w-0 ${isSelected ? 'font-semibold text-primary' : 'text-foreground'}`}>{c.name}</span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 ml-3">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
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
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            disabled={adults <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-lg font-bold">{adults}</span>
          <button
            onClick={() => setAdults(Math.min(6, adults + 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            disabled={adults >= 6}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-sm font-semibold text-foreground">{t('booking.widgetChildren')}</div>
          <div className="text-xs text-muted">{t('booking.widgetChildrenAge')}</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setChildren(Math.max(0, children - 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            disabled={children <= 0}
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-lg font-bold">{children}</span>
          <button
            onClick={() => setChildren(Math.min(6, children + 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
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
            subtitle={selectedCamping ? selectedCamping.name : undefined}
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
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut'as const }} className="w-full" > <div className="bg-white/95 backdrop-blur-lg rounded-2xl lg:rounded-full shadow-2xl p-3 lg:p-2"> <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0"> {/* Check-in */} <div onClick={openCheckIn} className="flex-1 px-3 lg:px-5 py-2 lg:py-3 cursor-pointer rounded-xl" > <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">{t('booking.arrivalLabel')}</span>
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary shrink-0" />
                <input
                  ref={checkInRef}
                  type="date"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} className="w-full bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer" /> </div> </div> {/* Check-out */} <div onClick={openCheckOut} className="flex-1 px-3 lg:px-5 py-2 lg:py-3 cursor-pointer rounded-xl" > <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">{t('booking.departureLabel')}</span>
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary shrink-0" />
                <input
                  ref={checkOutRef}
                  type="date"
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]} className="w-full bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer" /> </div> </div> {/* Camping selector */} <div className="flex-1 px-3 lg:px-5 py-2 lg:py-3 relative cursor-pointer rounded-xl" ref={campingRef} onClick={() => { setCampingOpen(!campingOpen); setGuestsOpen(false); }} > <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">{t('booking.widgetCamping')}</span>
              <button className="flex items-center gap-2 w-full text-left min-w-0">
                <MapPin size={16} className="text-primary shrink-0" />
                <span className={`text-sm font-medium flex-1 min-w-0 ${selectedCamping ? 'text-foreground' : 'text-muted'}`}>
                  <span className="block truncate">{selectedCamping ? selectedCamping.name : t('booking.widgetChoose')}</span>
                </span>
                <ChevronDown size={14} className={`text-muted transition-transform shrink-0 ${campingOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop dropdown rendered via portal (outside hero overflow-hidden) */}
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

              {/* Desktop dropdown rendered via portal (outside hero overflow-hidden) */}
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

      {/* Desktop dropdown portals — rendered outside hero overflow-hidden */}
      {!isMobile && mounted && campingOpen && campingDropdownPos && createPortal(
        <div
          ref={campingDropRef}
          style={{ position: 'fixed', top: campingDropdownPos.top, left: campingDropdownPos.left, width: campingDropdownPos.width, zIndex: 9999 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-[420px] overflow-y-auto">
              {campingListContent}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {!isMobile && mounted && guestsOpen && guestsDropdownPos && createPortal(
        <div
          ref={guestsDropRef}
          style={{ position: 'fixed', top: guestsDropdownPos.top, left: guestsDropdownPos.left, width: guestsDropdownPos.width, zIndex: 9999 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden p-4"
          >
            {guestsContent}
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}
