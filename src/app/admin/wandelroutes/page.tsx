'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Search, Trash2, ExternalLink, Loader2, X,
  Eye, EyeOff, RefreshCw, Pencil, Check, AlertTriangle,
  Mountain, MapPin, Clock, Ruler, ChevronDown,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import { usePageActions } from '@/app/admin/layout';

interface Trail {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  long_description: string;
  distance_km: number | null;
  duration_minutes: number | null;
  difficulty: string;
  alltrails_url: string;
  google_maps_url: string;
  photos: string[];
  tags: string[];
  active: boolean;
  sort_order: number;
}

const DIFFICULTIES = [
  { value: 'easy', nl: 'Makkelijk', en: 'Easy' },
  { value: 'medium', nl: 'Gemiddeld', en: 'Medium' },
  { value: 'hard', nl: 'Moeilijk', en: 'Hard' },
];

export default function AdminTrailsPage() {
  const { t, locale } = useAdmin();
  const isNl = locale === 'nl';
  const toast = useToast();

  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLongDescription, setFormLongDescription] = useState('');
  const [formDistanceKm, setFormDistanceKm] = useState('');
  const [formDurationMin, setFormDurationMin] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('medium');
  const [formAlltrailsUrl, setFormAlltrailsUrl] = useState('');
  const [formGoogleMapsUrl, setFormGoogleMapsUrl] = useState('');
  const [formPhotos, setFormPhotos] = useState('');
  const [formTags, setFormTags] = useState('');

  const fetchTrails = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/trails', { cache: 'no-store' });
      const data = await res.json();
      setTrails(data.trails || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrails(); }, [fetchTrails]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null);
        else if (showForm) setShowForm(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [deleteConfirm, showForm]);

  const filtered = useMemo(() => {
    if (!search.trim()) return trails;
    const q = search.toLowerCase();
    return trails.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }, [trails, search]);

  const activeCount = trails.filter(t => t.active).length;

  const resetForm = () => {
    setFormName(''); setFormLocation(''); setFormDescription(''); setFormLongDescription('');
    setFormDistanceKm(''); setFormDurationMin(''); setFormDifficulty('medium');
    setFormAlltrailsUrl(''); setFormGoogleMapsUrl(''); setFormPhotos(''); setFormTags('');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formLocation.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: formName,
        location: formLocation,
        description: formDescription,
        long_description: formLongDescription,
        distance_km: formDistanceKm ? parseFloat(formDistanceKm) : null,
        duration_minutes: formDurationMin ? parseInt(formDurationMin) : null,
        difficulty: formDifficulty,
        alltrails_url: formAlltrailsUrl,
        google_maps_url: formGoogleMapsUrl,
        photos: formPhotos.split('\n').map(s => s.trim()).filter(Boolean),
        tags: formTags.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch('/api/admin/trails', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      if (!res.ok) console.error('Save failed:', await res.text());
      resetForm();
      setShowForm(false);
      await fetchTrails();
      toast(editingId ? t('common.updated') : t('common.created'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/trails?id=${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      await fetchTrails();
      toast(t('common.deleted'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (trail: Trail) => {
    try {
      await fetch('/api/admin/trails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trail.id, active: !trail.active }),
      });
      setTrails(prev => prev.map(t => t.id === trail.id ? { ...t, active: !t.active } : t));
    } catch { /* ignore */ }
  };

  const handleEdit = (trail: Trail) => {
    setFormName(trail.name);
    setFormLocation(trail.location);
    setFormDescription(trail.description || '');
    setFormLongDescription(trail.long_description || '');
    setFormDistanceKm(trail.distance_km ? String(trail.distance_km) : '');
    setFormDurationMin(trail.duration_minutes ? String(trail.duration_minutes) : '');
    setFormDifficulty(trail.difficulty || 'medium');
    setFormAlltrailsUrl(trail.alltrails_url || '');
    setFormGoogleMapsUrl(trail.google_maps_url || '');
    setFormPhotos((trail.photos || []).join('\n'));
    setFormTags((trail.tags || []).join(', '));
    setEditingId(trail.id);
    setShowForm(true);
  };

  // Page actions (title bar buttons)
  usePageActions([
    { label: '', icon: <RefreshCw size={16} />, onClick: () => { setLoading(true); fetchTrails(); }, variant: 'secondary' },
    { label: isNl ? 'Toevoegen' : 'Add', icon: <PlusCircle size={16} />, onClick: () => { resetForm(); setShowForm(true); } },
  ]);

  const diffLabel = (d: string) => DIFFICULTIES.find(x => x.value === d)?.[isNl ? 'nl' : 'en'] || d;
  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}u${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-foreground">{trails.length}</p>
          <p className="text-xs text-muted">{isNl ? 'Totaal' : 'Total'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-muted">{isNl ? 'Actief' : 'Active'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-amber-600">{trails.length - activeCount}</p>
          <p className="text-xs text-muted">{isNl ? 'Verborgen' : 'Hidden'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isNl ? 'Zoek wandelroute...' : 'Search hiking trail...'}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-foreground">
                  {editingId ? (isNl ? 'Wandelroute bewerken' : 'Edit hiking trail') : (isNl ? 'Nieuwe wandelroute' : 'New hiking trail')}
                </h3>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted hover:text-foreground cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isNl ? 'Naam *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder={isNl ? 'bijv. Camí de Ronda Calella - Llafranc' : 'e.g. Camí de Ronda Calella - Llafranc'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isNl ? 'Locatie *' : 'Location *'}
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder={isNl ? 'bijv. Calella de Palafrugell' : 'e.g. Calella de Palafrugell'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Distance, Duration, Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isNl ? 'Afstand (km)' : 'Distance (km)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formDistanceKm}
                    onChange={e => setFormDistanceKm(e.target.value)}
                    placeholder="bijv. 5.2"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isNl ? 'Duur (minuten)' : 'Duration (minutes)'}
                  </label>
                  <input
                    type="number"
                    value={formDurationMin}
                    onChange={e => setFormDurationMin(e.target.value)}
                    placeholder="bijv. 90"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isNl ? 'Moeilijkheid' : 'Difficulty'}
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={e => setFormDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d.value} value={d.value}>{isNl ? d.nl : d.en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  {isNl ? 'Korte beschrijving' : 'Short description'}
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder={isNl ? 'Korte beschrijving van de route...' : 'Short route description...'}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Long Description */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  {isNl ? 'Uitgebreide beschrijving (zichtbaar op pagina)' : 'Long description (shown on page)'}
                </label>
                <textarea
                  value={formLongDescription}
                  onChange={e => setFormLongDescription(e.target.value)}
                  placeholder={isNl ? 'Uitgebreide tekst over de wandeling, uitzichten, tips...' : 'Detailed text about the hike, views, tips...'}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* AllTrails & Google Maps URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    AllTrails URL
                  </label>
                  <input
                    type="url"
                    value={formAlltrailsUrl}
                    onChange={e => setFormAlltrailsUrl(e.target.value)}
                    placeholder="https://www.alltrails.com/trail/..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={formGoogleMapsUrl}
                    onChange={e => setFormGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  {isNl ? "Foto's (één URL per regel)" : 'Photos (one URL per line)'}
                </label>
                <textarea
                  value={formPhotos}
                  onChange={e => setFormPhotos(e.target.value)}
                  placeholder="https://u.cubeupload.com/..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-xs"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  {isNl ? 'Tags (komma-gescheiden)' : 'Tags (comma-separated)'}
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder={isNl ? 'bijv. kust, uitzicht, familie' : 'e.g. coastal, views, family'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Photo preview */}
              {formPhotos.trim() && (
                <div className="flex gap-2 flex-wrap">
                  {formPhotos.split('\n').filter(s => s.trim()).slice(0, 6).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url.trim()} alt="" className="w-20 h-14 rounded-lg object-cover border border-gray-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving || !formName.trim() || !formLocation.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editingId ? (isNl ? 'Opslaan' : 'Save') : (isNl ? 'Toevoegen' : 'Add')}
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-2.5 text-sm text-muted hover:text-foreground cursor-pointer">
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trail list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <Mountain size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isNl ? 'Nog geen wandelroutes' : 'No hiking trails yet'}</p>
          </div>
        ) : (
          filtered.map(trail => (
            <div
              key={trail.id}
              className={`bg-white rounded-xl border p-4 transition-all ${trail.active ? 'border-gray-100' : 'border-amber-200 bg-amber-50/30 opacity-70'}`}
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                {trail.photos?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trail.photos[0]} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-sm">{trail.name}</h3>
                    {!trail.active && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        {isNl ? 'Verborgen' : 'Hidden'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {trail.location}</span>
                    {trail.distance_km && <span className="flex items-center gap-1"><Ruler size={11} /> {trail.distance_km} km</span>}
                    {trail.duration_minutes && <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(trail.duration_minutes)}</span>}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      trail.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                      trail.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{diffLabel(trail.difficulty)}</span>
                  </div>
                  {trail.description && (
                    <p className="text-xs text-muted mt-1 truncate max-w-md">{trail.description}</p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {trail.alltrails_url && (
                    <a href={trail.alltrails_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 text-muted" title="AllTrails">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={() => handleToggleActive(trail)} className="p-2 rounded-lg hover:bg-gray-100 text-muted cursor-pointer" title={trail.active ? 'Hide' : 'Show'}>
                    {trail.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => handleEdit(trail)} className="p-2 rounded-lg hover:bg-gray-100 text-muted cursor-pointer">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirm(trail.id)} className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{isNl ? 'Wandelroute verwijderen?' : 'Delete hiking trail?'}</h3>
                  <p className="text-xs text-muted">{isNl ? 'Dit kan niet ongedaan worden.' : 'This cannot be undone.'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold cursor-pointer">
                  {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : (isNl ? 'Verwijderen' : 'Delete')}
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-100 text-foreground rounded-xl text-sm font-medium cursor-pointer">
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
