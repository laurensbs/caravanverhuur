'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Percent,
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Clock,
  Sun,
  Zap,
  Tag,
  Info,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';

interface PricingRule {
  id: string;
  name: string;
  type: 'seizoen' | 'vroegboek' | 'lastminute';
  percentage: string;
  start_date: string | null;
  end_date: string | null;
  days_before_checkin: number | null;
  min_nights: number;
  active: boolean;
  priority: number;
  created_at: string;
}

const TYPE_CONFIG = {
  seizoen: { icon: Sun, color: 'text-amber-600 bg-amber-50', label_nl: 'Seizoensprijs', label_en: 'Seasonal Price' },
  vroegboek: { icon: Clock, color: 'text-blue-600 bg-blue-50', label_nl: 'Vroegboekkorting', label_en: 'Early Bird' },
  lastminute: { icon: Zap, color: 'text-red-600 bg-red-50', label_nl: 'Last Minute', label_en: 'Last Minute' },
};

export default function PrijzenPage() {
  const { t, locale } = useAdmin();
  const { toast } = useToast();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'seizoen' | 'vroegboek' | 'lastminute'>('seizoen');
  const [newPercentage, setNewPercentage] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDaysBefore, setNewDaysBefore] = useState('');
  const [newMinNights, setNewMinNights] = useState('7');
  const [newPriority, setNewPriority] = useState('0');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRules = useCallback(() => {
    fetch('/api/admin/pricing')
      .then(r => r.json())
      .then(d => setRules(d.rules || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleCreate = async () => {
    setCreateError('');
    if (!newName.trim() || !newPercentage.trim()) {
      setCreateError(locale === 'nl' ? 'Vul naam en percentage in' : 'Enter name and percentage');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          percentage: parseFloat(newPercentage),
          startDate: newStartDate || undefined,
          endDate: newEndDate || undefined,
          daysBeforeCheckin: newDaysBefore ? parseInt(newDaysBefore) : undefined,
          minNights: parseInt(newMinNights) || 1,
          priority: parseInt(newPriority) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast(locale === 'nl' ? 'Prijsregel aangemaakt' : 'Pricing rule created', 'success');
      setShowCreate(false);
      setNewName(''); setNewPercentage(''); setNewStartDate(''); setNewEndDate(''); setNewDaysBefore(''); setNewMinNights('7'); setNewPriority('0');
      fetchRules();
    } catch {
      setCreateError(locale === 'nl' ? 'Fout bij aanmaken' : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (rule: PricingRule) => {
    try {
      await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, active: !rule.active }),
      });
      toast(rule.active
        ? (locale === 'nl' ? 'Regel gedeactiveerd' : 'Rule deactivated')
        : (locale === 'nl' ? 'Regel geactiveerd' : 'Rule activated'), 'success');
      fetchRules();
    } catch {
      toast(locale === 'nl' ? 'Fout bij wijzigen' : 'Failed to update', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/pricing?id=${deleteId}`, { method: 'DELETE' });
      toast(locale === 'nl' ? 'Regel verwijderd' : 'Rule deleted', 'success');
      setDeleteId(null);
      fetchRules();
    } catch {
      toast(locale === 'nl' ? 'Fout bij verwijderen' : 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isNL = locale === 'nl';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag size={22} className="text-primary" />
            {isNL ? 'Prijsregels' : 'Pricing Rules'}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {isNL ? 'Beheer seizoensprijzen, vroegboekkorting en last-minute deals' : 'Manage seasonal pricing, early bird discounts and last-minute deals'}
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
          <Plus size={16} />
          <span className="hidden sm:inline">{isNL ? 'Nieuwe regel' : 'New rule'}</span>
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-1">
          <p className="font-semibold">{isNL ? 'Hoe werken prijsregels?' : 'How do pricing rules work?'}</p>
          <p>{isNL
            ? '• Seizoensprijs: Toeslag (+) of korting (-) op de basisprijs voor een bepaalde periode (bijv. +20% hoogseizoen juli-aug).'
            : '• Seasonal price: Surcharge (+) or discount (-) on base price for a specific period (e.g. +20% peak season Jul-Aug).'}</p>
          <p>{isNL
            ? '• Vroegboekkorting: Korting als de klant ruim van tevoren boekt (bijv. -10% als > 90 dagen voor aankomst).'
            : '• Early bird: Discount if customer books well in advance (e.g. -10% if > 90 days before arrival).'}</p>
          <p>{isNL
            ? '• Last minute: Korting als de aankomstdatum dichtbij is (bijv. -15% als < 14 dagen voor aankomst).'
            : '• Last minute: Discount if arrival date is near (e.g. -15% if < 14 days before arrival).'}</p>
          <p className="text-blue-600 font-medium">{isNL
            ? 'Percentage: positief = toeslag, negatief = korting. Regels met hogere prioriteit worden eerst toegepast.'
            : 'Percentage: positive = surcharge, negative = discount. Rules with higher priority are applied first.'}</p>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h2 className="font-bold text-foreground">{isNL ? 'Nieuwe prijsregel' : 'New Pricing Rule'}</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">{isNL ? 'Naam' : 'Name'}</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder={isNL ? 'Bijv. Hoogseizoen 2026' : 'E.g. Peak Season 2026'}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">Type</label>
              <div className="flex gap-2">
                {(['seizoen', 'vroegboek', 'lastminute'] as const).map(t => {
                  const cfg = TYPE_CONFIG[t];
                  return (
                    <button key={t} onClick={() => setNewType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${newType === t ? 'bg-primary text-white' : 'bg-surface text-foreground-light border border-border'}`}>
                      {locale === 'nl' ? cfg.label_nl : cfg.label_en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">
                {isNL ? 'Percentage (%)' : 'Percentage (%)'}
              </label>
              <div className="relative">
                <input type="number" value={newPercentage} onChange={e => setNewPercentage(e.target.value)}
                  placeholder={isNL ? 'Bijv. 20 of -10' : 'E.g. 20 or -10'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none pr-8" />
                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">
                {isNL ? 'Prioriteit' : 'Priority'}
              </label>
              <input type="number" value={newPriority} onChange={e => setNewPriority(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          {/* Conditional fields based on type */}
          {newType === 'seizoen' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">
                  <Calendar size={12} className="inline mr-1" />{isNL ? 'Startdatum' : 'Start date'}
                </label>
                <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">
                  <Calendar size={12} className="inline mr-1" />{isNL ? 'Einddatum' : 'End date'}
                </label>
                <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
          )}

          {(newType === 'vroegboek' || newType === 'lastminute') && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">
                  <Clock size={12} className="inline mr-1" />
                  {newType === 'vroegboek'
                    ? (isNL ? 'Min. dagen vóór aankomst' : 'Min. days before arrival')
                    : (isNL ? 'Max. dagen vóór aankomst' : 'Max. days before arrival')}
                </label>
                <input type="number" value={newDaysBefore} onChange={e => setNewDaysBefore(e.target.value)}
                  placeholder={newType === 'vroegboek' ? '90' : '14'}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1 block">
                  {isNL ? 'Min. nachten' : 'Min. nights'}
                </label>
                <input type="number" value={newMinNights} onChange={e => setNewMinNights(e.target.value)}
                  placeholder="7"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-surface focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
          )}

          {createError && (
            <p className="text-sm text-red-600 flex items-center gap-1"><X size={14} /> {createError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-xl border border-border text-muted cursor-pointer">
              {isNL ? 'Annuleren' : 'Cancel'}
            </button>
            <button onClick={handleCreate} disabled={creating}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isNL ? 'Opslaan' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-muted" /></div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Tag size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">{isNL ? 'Geen prijsregels. Maak er een aan om te beginnen.' : 'No pricing rules. Create one to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const cfg = TYPE_CONFIG[rule.type as keyof typeof TYPE_CONFIG];
            const Icon = cfg?.icon || Tag;
            const pct = parseFloat(rule.percentage);
            const isDiscount = pct < 0;
            return (
              <div key={rule.id} className={`bg-white rounded-xl border ${rule.active ? 'border-gray-200' : 'border-gray-100 opacity-60'} p-4 sm:p-5`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg?.color || 'text-gray-600 bg-gray-50'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground text-sm">{rule.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isDiscount ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isDiscount ? '' : '+'}{pct}%
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg?.color || 'bg-gray-50 text-gray-600'}`}>
                        {locale === 'nl' ? cfg?.label_nl : cfg?.label_en}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
                      {rule.type === 'seizoen' && rule.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(rule.start_date)} — {formatDate(rule.end_date)}
                        </span>
                      )}
                      {(rule.type === 'vroegboek' || rule.type === 'lastminute') && rule.days_before_checkin != null && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {rule.type === 'vroegboek'
                            ? `≥ ${rule.days_before_checkin} ${isNL ? 'dagen vóór aankomst' : 'days before arrival'}`
                            : `≤ ${rule.days_before_checkin} ${isNL ? 'dagen vóór aankomst' : 'days before arrival'}`}
                        </span>
                      )}
                      {rule.min_nights > 1 && (
                        <span>Min. {rule.min_nights} {isNL ? 'nachten' : 'nights'}</span>
                      )}
                      <span>Prio: {rule.priority}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggle(rule)} className="cursor-pointer" title={rule.active ? 'Deactivate' : 'Activate'}>
                      {rule.active
                        ? <ToggleRight size={24} className="text-primary" />
                        : <ToggleLeft size={24} className="text-gray-300" />}
                    </button>
                    <button onClick={() => setDeleteId(rule.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-2">{isNL ? 'Regel verwijderen?' : 'Delete rule?'}</h3>
            <p className="text-sm text-muted mb-5">{isNL ? 'Dit kan niet ongedaan worden gemaakt.' : 'This cannot be undone.'}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-xl border border-border text-muted cursor-pointer">
                {isNL ? 'Annuleren' : 'Cancel'}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 cursor-pointer disabled:opacity-50">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isNL ? 'Verwijderen' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
