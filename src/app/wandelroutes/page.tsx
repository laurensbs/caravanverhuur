'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Mountain, MapPin, Clock, Ruler, ExternalLink, Heart,
  ChevronDown, Search, ArrowRight, Loader2, Map,
  ChevronLeft, ChevronRight, X, Bookmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/context';
import BookingCTA from '@/components/BookingCTA';

interface Trail {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  longDescription: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  difficulty: string;
  alltrailsUrl: string;
  googleMapsUrl: string;
  photos: string[];
  tags: string[];
}

const difficultyConfig: Record<string, { nl: string; en: string; es: string; color: string; bg: string }> = {
  easy: { nl: 'Makkelijk', en: 'Easy', es: 'Fácil', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  medium: { nl: 'Gemiddeld', en: 'Medium', es: 'Media', color: 'text-amber-700', bg: 'bg-amber-100' },
  hard: { nl: 'Moeilijk', en: 'Hard', es: 'Difícil', color: 'text-red-700', bg: 'bg-red-100' },
};

/* ─── Photo Gallery Lightbox ─── */
function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!photos.length) return null;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`${name} foto ${i + 1}`}
            className="w-28 h-20 sm:w-36 sm:h-24 rounded-xl object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { setIdx(i); setLightbox(true); }}
          />
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10 cursor-pointer">
              <X size={28} />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); }}
                  className="absolute left-4 text-white/70 hover:text-white z-10 cursor-pointer"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); }}
                  className="absolute right-4 text-white/70 hover:text-white z-10 cursor-pointer"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[idx]}
              alt={`${name} foto ${idx + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />
            <p className="absolute bottom-4 text-white/60 text-sm">{idx + 1} / {photos.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function WandelroutesPage() {
  const { t, locale } = useLanguage();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/trails').then(r => r.json()),
      fetch('/api/trails/save').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ]).then(([trailsData, savedData, meData]) => {
      setTrails(trailsData.trails || []);
      setSavedIds(savedData.savedTrailIds || []);
      setIsLoggedIn(!!meData?.customer);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = trails;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (filterDifficulty !== 'all') {
      result = result.filter(t => t.difficulty === filterDifficulty);
    }
    return result;
  }, [trails, search, filterDifficulty]);

  const handleSave = async (trailId: string) => {
    if (!isLoggedIn) {
      window.location.href = '/account?redirect=/wandelroutes';
      return;
    }
    setSavingId(trailId);
    const isSaved = savedIds.includes(trailId);
    try {
      const res = await fetch('/api/trails/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trailId, action: isSaved ? 'unsave' : 'save' }),
      });
      const data = await res.json();
      if (data.savedTrailIds) setSavedIds(data.savedTrailIds);
    } catch { /* ignore */ }
    setSavingId(null);
  };

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (locale === 'en') return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
    return h > 0 ? `${h}u${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
  };

  const getDiffLabel = (d: string) => difficultyConfig[d]?.[locale] || d;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-foreground text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-foreground to-foreground" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 sm:pt-28 pb-12 sm:pb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Mountain size={24} className="text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
            {t('trails.heroTitle')}
          </h1>
          <p className="text-sm sm:text-lg text-white/70 max-w-2xl leading-relaxed">
            {t('trails.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-[60px] sm:top-[72px] z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('trails.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => setFilterDifficulty(d)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  filterDifficulty === d
                    ? 'bg-primary text-white'
                    : 'bg-surface text-muted hover:bg-gray-200'
                }`}
              >
                {d === 'all' ? t('trails.filterAll') : getDiffLabel(d)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trail list */}
      <section className="py-8 sm:py-14 bg-surface min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Mountain size={40} className="mx-auto mb-3 text-muted/30" />
              <p className="text-muted">{t('trails.noResults')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((trail, i) => {
                const isExpanded = expandedId === trail.id;
                const isSaved = savedIds.includes(trail.id);
                const diff = difficultyConfig[trail.difficulty] || difficultyConfig.medium;

                return (
                  <motion.div
                    key={trail.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Photo */}
                        {trail.photos[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={trail.photos[0]}
                            alt={trail.name}
                            className="w-full sm:w-44 h-32 sm:h-28 rounded-xl object-cover shrink-0"
                          />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">{trail.name}</h2>
                            <button
                              onClick={() => handleSave(trail.id)}
                              disabled={savingId === trail.id}
                              className={`shrink-0 p-2 rounded-xl transition-colors cursor-pointer ${
                                isSaved ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-muted'
                              }`}
                              title={isSaved ? t('trails.unsave') : t('trails.save')}
                            >
                              {savingId === trail.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Bookmark size={18} className={isSaved ? 'fill-primary' : ''} />
                              )}
                            </button>
                          </div>

                          {/* Meta badges */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-muted">
                              <MapPin size={12} /> {trail.location}
                            </span>
                            {trail.distanceKm && (
                              <span className="flex items-center gap-1 text-xs text-muted bg-surface px-2 py-0.5 rounded-full">
                                <Ruler size={12} /> {trail.distanceKm} km
                              </span>
                            )}
                            {trail.durationMinutes && (
                              <span className="flex items-center gap-1 text-xs text-muted bg-surface px-2 py-0.5 rounded-full">
                                <Clock size={12} /> {formatDuration(trail.durationMinutes)}
                              </span>
                            )}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                              {getDiffLabel(trail.difficulty)}
                            </span>
                          </div>

                          <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-2">
                            {trail.description}
                          </p>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {trail.alltrailsUrl && (
                              <a
                                href={trail.alltrailsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                              >
                                <Mountain size={12} /> AllTrails <ExternalLink size={10} />
                              </a>
                            )}
                            {trail.googleMapsUrl && (
                              <a
                                href={trail.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                              >
                                <Map size={12} /> Google Maps <ExternalLink size={10} />
                              </a>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : trail.id)}
                              className="inline-flex items-center gap-1 text-xs text-primary font-medium cursor-pointer"
                            >
                              {isExpanded ? t('trails.showLess') : t('trails.showMore')}
                              <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-gray-100 space-y-4">
                              {trail.longDescription && (
                                <p className="text-sm text-foreground-light leading-relaxed">
                                  {trail.longDescription}
                                </p>
                              )}

                              {trail.photos.length > 1 && (
                                <PhotoGallery photos={trail.photos} name={trail.name} />
                              )}

                              {trail.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {trail.tags.map(tag => (
                                    <span key={tag} className="text-[11px] bg-surface text-muted px-2 py-1 rounded-full">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Mobile action buttons */}
                              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                {trail.alltrailsUrl && (
                                  <a
                                    href={trail.alltrailsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                                  >
                                    <Mountain size={16} /> {t('trails.viewOnAllTrails')}
                                  </a>
                                )}
                                {trail.googleMapsUrl && (
                                  <a
                                    href={trail.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                                  >
                                    <Map size={16} /> {t('trails.addToGoogleMaps')}
                                  </a>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Info card */}
          {!loading && trails.length > 0 && (
            <div className="mt-10 bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <Mountain size={28} className="mx-auto mb-3 text-emerald-500" />
              <h3 className="font-bold text-foreground mb-1">{t('trails.tipTitle')}</h3>
              <p className="text-sm text-muted max-w-lg mx-auto">{t('trails.tipDesc')}</p>
            </div>
          )}
        </div>
      </section>

      <BookingCTA />
    </>
  );
}
