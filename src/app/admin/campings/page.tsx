'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Tent,
  PlusCircle,
  Search,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  GripVertical,
  Eye,
  EyeOff,
  RefreshCw,
  Pencil,
  Check,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';

interface Camping {
  id: string;
  name: string;
  location: string;
  description: string;
  website: string;
  photos: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
}

/* ── Camping Reorder Item with dedicated drag handle ── */
function CampingReorderItem({
  camping,
  isNl,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  camping: Camping;
  isNl: boolean;
  onToggleActive: (c: Camping) => void;
  onEdit: (c: Camping) => void;
  onDelete: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={camping}
      dragListener={false}
      dragControls={controls}
      className="bg-white rounded-xl overflow-hidden list-none"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 50 }}
    >
      <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${!camping.active ? 'opacity-60' : ''}`}>
        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-muted hover:text-foreground transition-colors shrink-0"
          onPointerDown={(e) => controls.start(e)}
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={18} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{camping.name}</span>
            {camping.photos?.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary">
                {camping.photos.length} foto{camping.photos.length !== 1 ? '\'s' : ''}
              </span>
            )}
            {!camping.active && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-alt text-muted">
                {isNl ? 'Inactief' : 'Inactive'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
            {camping.description && (
              <span className="truncate max-w-[300px]">{camping.description}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {camping.website && (
            <a
              href={camping.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-surface-alt text-muted hover:text-foreground transition-colors"
              title="Website"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => onToggleActive(camping)}
            className="p-2 rounded-lg hover:bg-surface-alt text-muted hover:text-foreground transition-colors cursor-pointer"
            title={camping.active ? (isNl ? 'Deactiveren' : 'Deactivate') : (isNl ? 'Activeren' : 'Activate')}
          >
            {camping.active ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={() => onEdit(camping)}
            className="p-2 rounded-lg hover:bg-surface-alt text-muted hover:text-foreground transition-colors cursor-pointer"
            title={isNl ? 'Bewerken' : 'Edit'}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(camping.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-danger transition-colors cursor-pointer"
            title={isNl ? 'Verwijderen' : 'Delete'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function AdminCampingsPage() {
  const { t, locale } = useAdmin();
  const { toast } = useToast();
  const isNl = locale === 'nl';

  const [campings, setCampings] = useState<Camping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importingStatic, setImportingStatic] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formPhotos, setFormPhotos] = useState('');

  const fetchCampings = async () => {
    try {
      const res = await fetch('/api/admin/campings', { cache: 'no-store' });
      const data = await res.json();
      setCampings(data.campings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampings(); }, []);

  // Close modals on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null);
        else if (showForm) { setShowForm(false); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [deleteConfirm, showForm]);

  const filtered = useMemo(() => {
    if (!search.trim()) return campings;
    const q = search.toLowerCase();
    return campings.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  }, [campings, search]);

  const locations = useMemo(() => [...new Set(campings.map(c => c.location))].sort(), [campings]);
  const activeCount = campings.filter(c => c.active).length;

  const resetForm = () => {
    setFormName(''); setFormLocation(''); setFormDescription(''); setFormWebsite(''); setFormPhotos('');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formLocation.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch('/api/admin/campings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ id: editingId, name: formName, location: formLocation, description: formDescription, website: formWebsite, photos: formPhotos.split('\n').map(s => s.trim()).filter(Boolean) }),
        });
        if (!res.ok) console.error('PUT failed:', await res.text());
      } else {
        const res = await fetch('/api/admin/campings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ name: formName, location: formLocation, description: formDescription, website: formWebsite, photos: formPhotos.split('\n').map(s => s.trim()).filter(Boolean) }),
        });
        if (!res.ok) console.error('POST failed:', await res.text());
      }
      resetForm();
      setShowForm(false);
      await fetchCampings();
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
      await fetch(`/api/admin/campings?id=${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      await fetchCampings();
      toast(t('common.deleted'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (camping: Camping) => {
    try {
      await fetch('/api/admin/campings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: camping.id, active: !camping.active }),
      });
      setCampings(prev => prev.map(c => c.id === camping.id ? { ...c, active: !c.active } : c));
    } catch {
      // ignore
    }
  };

  const handleEdit = (camping: Camping) => {
    setFormName(camping.name);
    setFormLocation(camping.location);
    setFormDescription(camping.description || '');
    setFormWebsite(camping.website || '');
    setFormPhotos((camping.photos || []).join('\n'));
    setEditingId(camping.id);
    setShowForm(true);
  };

  const handleReorder = async (newOrder: Camping[]) => {
    // Merge reordered filtered list back into full campings list
    if (search.trim()) {
      const reorderedIds = new Set(newOrder.map(c => c.id));
      const rest = campings.filter(c => !reorderedIds.has(c.id));
      setCampings([...newOrder, ...rest]);
    } else {
      setCampings(newOrder);
    }
    try {
      await fetch('/api/admin/campings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: true, orderedIds: newOrder.map(c => c.id) }),
      });
    } catch {
      // ignore
    }
  };

  const handleImportStatic = async () => {
    setImportingStatic(true);
    try {
      // Fetch static campings from data file via dynamic import workaround
      const res = await fetch('/api/campings');
      const data = await res.json();
      if (data.source === 'static' && data.campings?.length) {
        for (const c of data.campings) {
          await fetch('/api/admin/campings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: c.name,
              location: c.location,
              description: c.description,
              website: c.website || '',
              photos: c.photos || [],
              slug: c.slug || '',
              region: c.region || '',
              facilities: c.facilities || [],
              best_for: c.bestFor || [],
              nearest_destinations: c.nearestDestinations || [],
              latitude: c.coordinates?.lat,
              longitude: c.coordinates?.lng,
            }),
          });
        }
        await fetchCampings();
      }
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setImportingStatic(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: isNl ? 'Totaal' : 'Total', value: campings.length, color: 'bg-surface text-foreground' },
          { label: isNl ? 'Actief' : 'Active', value: activeCount, color: 'bg-primary-50 text-primary' },
          { label: isNl ? 'Locaties' : 'Locations', value: locations.length, color: 'bg-primary-50 text-primary' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 sm:p-4 text-center`}>
            <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isNl ? 'Zoek camping...' : 'Search camping...'}
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          {campings.length === 0 && (
            <button
              onClick={handleImportStatic}
              disabled={importingStatic}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-alt text-foreground rounded-xl text-sm font-semibold hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
            >
              {importingStatic ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isNl ? 'Importeer standaard' : 'Import defaults'}
            </button>
          )}
          <button onClick={() => { fetchCampings(); toast(isNl ? 'Vernieuwd' : 'Refreshed', 'success'); }}
            className="p-2.5 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer"
            title={isNl ? 'Vernieuwen' : 'Refresh'}>
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <PlusCircle size={16} />
            {isNl ? 'Nieuwe camping' : 'New camping'}
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {editingId
                    ? (isNl ? 'Camping bewerken' : 'Edit camping')
                    : (isNl ? 'Nieuwe camping toevoegen' : 'Add new camping')
                  }
                </h3>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-surface-alt cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isNl ? 'Naam *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder={isNl ? 'bijv. Camping Cypsela Resort' : 'e.g. Camping Cypsela Resort'}
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
                    placeholder={isNl ? 'bijv. Pals' : 'e.g. Pals'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    list="location-suggestions"
                  />
                  {locations.length > 0 && (
                    <datalist id="location-suggestions">
                      {locations.map(loc => <option key={loc} value={loc} />)}
                    </datalist>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  {isNl ? 'Beschrijving' : 'Description'}
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder={isNl ? 'Korte beschrijving van de camping...' : 'Short description of the camping...'}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  {isNl ? 'Website (optioneel)' : 'Website (optional)'}
                </label>
                <input
                  type="url"
                  value={formWebsite}
                  onChange={e => setFormWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  {isNl ? "Foto's (optioneel — één URL per regel)" : 'Photos (optional — one URL per line)'}
                </label>
                <textarea
                  value={formPhotos}
                  onChange={e => setFormPhotos(e.target.value)}
                  placeholder={isNl ? 'https://example.com/foto1.jpg\nhttps://example.com/foto2.jpg' : 'https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg'}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-xs"
                />
                <p className="text-[11px] text-muted mt-1">
                  {isNl
                    ? 'Gebruik directe afbeeldings-URL\'s. Laat leeg om standaard foto\'s te gebruiken.'
                    : 'Use direct image URLs. Leave empty to use default photos.'}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2.5 text-sm font-medium text-muted bg-surface-alt rounded-xl cursor-pointer hover:bg-surface transition-colors"
                >
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formName.trim() || !formLocation.trim() || saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-primary-dark transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editingId
                    ? (isNl ? 'Opslaan' : 'Save')
                    : (isNl ? 'Toevoegen' : 'Add')
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campings list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Tent className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">{isNl ? 'Geen campings gevonden' : 'No campings found'}</p>
          {campings.length === 0 && (
            <p className="text-sm text-muted mt-2">
              {isNl
                ? 'Klik "Importeer standaard" om de 30 standaard campings te laden, of voeg er zelf toe.'
                : 'Click "Import defaults" to load the 30 default campings, or add your own.'}
            </p>
          )}
        </div>
      ) : (
        <div>
          <Reorder.Group
            axis="y"
            values={filtered}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {filtered.map(camping => (
              <CampingReorderItem
                key={camping.id}
                camping={camping}
                isNl={isNl}
                onToggleActive={handleToggleActive}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirm(id)}
              />
            ))}
          </Reorder.Group>

          <p className="text-xs text-muted mt-3 text-center">
            {isNl
              ? '💡 Sleep campings om de volgorde aan te passen. Actieve campings verschijnen op de boekingspagina.'
              : '💡 Drag campings to reorder. Active campings appear on the booking page.'}
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-50">
                  <AlertTriangle size={20} className="text-danger" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {isNl ? 'Camping verwijderen?' : 'Delete camping?'}
                  </h3>
                  <p className="text-sm text-muted">
                    {isNl ? 'Dit kan niet ongedaan worden.' : 'This cannot be undone.'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-4">
                <strong>{campings.find(c => c.id === deleteConfirm)?.name}</strong>
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-muted bg-surface-alt rounded-xl cursor-pointer"
                >
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-danger text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {isNl ? 'Verwijderen' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
