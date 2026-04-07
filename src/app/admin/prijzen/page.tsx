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
  Pencil,
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

/* ——— Presets: one-click rule templates ——— */
const PRESETS_NL = [
  { name: 'Hoogseizoen juli (+18%)', type: 'seizoen' as const, percentage: 18, startDate: '2026-07-01', endDate: '2026-07-31', minNights: 7 },
  { name: 'Vroegboekkorting (>60 dagen)', type: 'vroegboek' as const, percentage: -5, daysBefore: 60, minNights: 7 },
  { name: 'Last minute (<14 dagen)', type: 'lastminute' as const, percentage: -10, daysBefore: 14, minNights: 7 },
];
const PRESETS_EN = [
  { name: 'Peak season July (+18%)', type: 'seizoen' as const, percentage: 18, startDate: '2026-07-01', endDate: '2026-07-31', minNights: 7 },
  { name: 'Early bird discount (>60 days)', type: 'vroegboek' as const, percentage: -5, daysBefore: 60, minNights: 7 },
  { name: 'Last minute (<14 days)', type: 'lastminute' as const, percentage: -10, daysBefore: 14, minNights: 7 },
];

export default function PrijzenPage() {
  const { t, locale } = useAdmin();
  const { toast } = useToast();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Create/edit form
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'seizoen' | 'vroegboek' | 'lastminute'>('seizoen');
  const [formPercentage, setFormPercentage] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDaysBefore, setFormDaysBefore] = useState('');
  const [formMinNights, setFormMinNights] = useState('7');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isNL = locale === 'nl';
  const presets = isNL ? PRESETS_NL : PRESETS_EN;

  const fetchRules = useCallback(() => {
    fetch('/api/admin/pricing')
      .then(r => r.json())
      .then(d => setRules(d.rules || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const resetForm = () => {
    setFormName(''); setFormType('seizoen'); setFormPercentage('');
    setFormStartDate(''); setFormEndDate(''); setFormDaysBefore('');
    setFormMinNights('7'); setFormError('');
  };

  const openCreate = (preset?: typeof PRESETS_NL[0]) => {
    setEditId(null);
    if (preset) {
      setFormName(preset.name);
      setFormType(preset.type);
      setFormPercentage(String(preset.percentage));
      setFormStartDate(preset.startDate || '');
      setFormEndDate(preset.endDate || '');
      setFormDaysBefore(preset.daysBefore ? String(preset.daysBefore) : '');
      setFormMinNights(String(preset.minNights || 7));
    } else {
      resetForm();
    }
    setShowCreate(true);
  };

  const openEdit = (rule: PricingRule) => {
    setEditId(rule.id);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormPercentage(rule.percentage);
    setFormStartDate(rule.start_date?.split('T')[0] || '');
    setFormEndDate(rule.end_date?.split('T')[0] || '');
    setFormDaysBefore(rule.days_before_checkin != null ? String(rule.days_before_checkin) : '');
    setFormMinNights(String(rule.min_nights));
    setFormError('');
    setShowCreate(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!formName.trim() || !formPercentage.trim()) {
      setFormError(isNL ? 'Vul naam en percentage in' : 'Enter name and percentage');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        type: formType,
        percentage: parseFloat(formPercentage),
        startDate: formStartDate || undefined,
        endDate: formEndDate || undefined,
        daysBeforeCheckin: formDaysBefore ? parseInt(formDaysBefore) : undefined,
        minNights: parseInt(formMinNights) || 1,
        priority: 0,
      };

      if (editId) {
        const res = await fetch('/api/admin/pricing', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error();
        toast(isNL ? 'Prijsregel bijgewerkt' : 'Pricing rule updated', 'success');
      } else {
        const res = await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(isNL ? 'Prijsregel aangemaakt' : 'Pricing rule created', 'success');
      }
      setShowCreate(false);
      resetForm();
      setEditId(null);
      fetchRules();
    } catch {
      setFormError(isNL ? 'Fout bij opslaan' : 'Failed to save');
    } finally {
      setSaving(false);
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
        ? (isNL ? 'Regel gedeactiveerd' : 'Rule deactivated')
        : (isNL ? 'Regel geactiveerd' : 'Rule activated'), 'success');
      fetchRules();
    } catch {
      toast(isNL ? 'Fout bij wijzigen' : 'Failed to update', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/pricing?id=${deleteId}`, { method: 'DELETE' });
      toast(isNL ? 'Regel verwijderd' : 'Rule deleted', 'success');
      setDeleteId(null);
      fetchRules();
    } catch {
      toast(isNL ? 'Fout bij verwijderen' : 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(isNL ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short' });
  };

  const pctLabel = (p: string) => {
    const n = parseFloat(p);
    return n > 0 ? `+${n}%` : `${n}%`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Tag size={20} className="text-primary" />
            {isNL ? 'Prijsregels' : 'Pricing Rules'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {isNL ? 'Seizoensprijzen, vroegboekkorting en last-minute deals' : 'Seasonal pricing, early bird & last-minute deals'}
          </p>
        </div>
        <button onClick={() => openCreate()}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
          <Plus size={14} />
          <span className="hidden sm:inline">{isNL ? 'Nieuwe regel' : 'New rule'}</span>
        </button>
      </div>

      {/* Quick presets — only show when no rules exist or always as suggestions */}
      {rules.length === 0 && !showCreate && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-foreground mb-3">
            {isNL ? '⚡ Snel starten — klik om aan te maken:' : '⚡ Quick start — click to create:'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p, i) => {
              const cfg = TYPE_CONFIG[p.type];
              const Icon = cfg.icon;
              const isDiscount = p.percentage < 0;
              return (
                <button key={i} onClick={() => openCreate(p)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 text-left transition-all cursor-pointer group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                    <div className={`text-xs font-bold ${isDiscount ? 'text-green-600' : 'text-amber-600'}`}>
                      {isDiscount ? '' : '+'}{p.percentage}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground">
              {editId ? (isNL ? 'Regel bewerken' : 'Edit Rule') : (isNL ? 'Nieuwe prijsregel' : 'New Pricing Rule')}
            </h2>
            <button onClick={() => { setShowCreate(false); setEditId(null); resetForm(); }} className="text-muted cursor-pointer">
              <X size={16} />
            </button>
          </div>

          {/* Type selector */}
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">Type</label>
            <div className="flex gap-1.5">
              {(['seizoen', 'vroegboek', 'lastminute'] as const).map(tp => {
                const cfg = TYPE_CONFIG[tp];
                const Icon = cfg.icon;
                return (
                  <button key={tp} onClick={() => setFormType(tp)}
                    className={`flex items-center gap-1.5 flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formType === tp ? 'bg-foreground text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}>
                    <Icon size={12} />
                    {isNL ? cfg.label_nl : cfg.label_en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 block">{isNL ? 'Naam' : 'Name'}</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder={isNL ? 'Bijv. Hoogseizoen 2026' : 'E.g. Peak Season 2026'}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>

            {/* Percentage */}
            <div>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 block">
                {isNL ? 'Percentage' : 'Percentage'}
                <span className="normal-case text-gray-400 font-normal ml-1">
                  ({isNL ? 'positief = toeslag, negatief = korting' : 'positive = surcharge, negative = discount'})
                </span>
              </label>
              <div className="relative">
                <input type="number" value={formPercentage} onChange={e => setFormPercentage(e.target.value)}
                  placeholder={isNL ? 'Bijv. 20 of -10' : 'E.g. 20 or -10'}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none pr-8" />
                <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>
          </div>

          {/* Conditional fields */}
          {formType === 'seizoen' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar size={10} />{isNL ? 'Van' : 'From'}
                </label>
                <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar size={10} />{isNL ? 'Tot' : 'To'}
                </label>
                <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
          )}

          {(formType === 'vroegboek' || formType === 'lastminute') && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock size={10} />
                  {formType === 'vroegboek'
                    ? (isNL ? 'Minimaal dagen vóór aankomst' : 'Min. days before arrival')
                    : (isNL ? 'Maximaal dagen vóór aankomst' : 'Max. days before arrival')}
                </label>
                <input type="number" value={formDaysBefore} onChange={e => setFormDaysBefore(e.target.value)}
                  placeholder={formType === 'vroegboek' ? '90' : '14'}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 block">
                  {isNL ? 'Min. nachten' : 'Min. nights'}
                </label>
                <input type="number" value={formMinNights} onChange={e => setFormMinNights(e.target.value)}
                  placeholder="7"
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
          )}

          {formType === 'seizoen' && (
            <div className="sm:w-1/2">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 block">
                {isNL ? 'Min. nachten' : 'Min. nights'}
              </label>
              <input type="number" value={formMinNights} onChange={e => setFormMinNights(e.target.value)}
                placeholder="7"
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          )}

          {formError && (
            <p className="text-xs text-red-600 flex items-center gap-1"><X size={12} /> {formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => { setShowCreate(false); setEditId(null); resetForm(); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-muted cursor-pointer">
              {isNL ? 'Annuleren' : 'Cancel'}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {isNL ? 'Opslaan' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-muted" /></div>
      ) : rules.length === 0 && !showCreate ? (
        <div className="text-center py-8 text-muted">
          <Tag size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">{isNL ? 'Nog geen prijsregels. Gebruik bovenstaande presets of maak er zelf een.' : 'No pricing rules yet. Use the presets above or create your own.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => {
            const cfg = TYPE_CONFIG[rule.type as keyof typeof TYPE_CONFIG];
            const Icon = cfg?.icon || Tag;
            const pct = parseFloat(rule.percentage);
            const isDiscount = pct < 0;
            return (
              <div key={rule.id} className={`bg-white rounded-xl border ${rule.active ? 'border-gray-200' : 'border-gray-100 opacity-50'} p-3 sm:p-4`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg?.color || 'text-gray-600 bg-gray-50'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{rule.name}</h3>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                        isDiscount ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {pctLabel(rule.percentage)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 mt-0.5 text-[11px] text-muted">
                      {rule.type === 'seizoen' && rule.start_date && (
                        <span>{fmtDate(rule.start_date)} — {fmtDate(rule.end_date)}</span>
                      )}
                      {(rule.type === 'vroegboek' || rule.type === 'lastminute') && rule.days_before_checkin != null && (
                        <span>
                          {rule.type === 'vroegboek' ? '≥' : '≤'} {rule.days_before_checkin} {isNL ? 'dgn' : 'days'}
                        </span>
                      )}
                      {rule.min_nights > 1 && (
                        <span>≥ {rule.min_nights} {isNL ? 'n.' : 'n.'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(rule)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer" title={isNL ? 'Bewerken' : 'Edit'}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleToggle(rule)} className="cursor-pointer" title={rule.active ? 'Deactivate' : 'Activate'}>
                      {rule.active
                        ? <ToggleRight size={22} className="text-primary" />
                        : <ToggleLeft size={22} className="text-gray-300" />}
                    </button>
                    <button onClick={() => setDeleteId(rule.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How it works — collapsible hint */}
      <details className="group">
        <summary className="text-[11px] text-muted cursor-pointer select-none flex items-center gap-1 hover:text-foreground transition-colors">
          <span className="group-open:rotate-90 transition-transform">▸</span>
          {isNL ? 'Hoe werken prijsregels?' : 'How do pricing rules work?'}
        </summary>
        <div className="mt-2 bg-gray-50 rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
          <p>{isNL
            ? '• Seizoensprijs: toeslag (+) of korting (-) voor een periode, bijv. +20% in juli-augustus.'
            : '• Seasonal: surcharge (+) or discount (-) for a date range, e.g. +20% in Jul-Aug.'}</p>
          <p>{isNL
            ? '• Vroegboekkorting: korting als de klant vroeg boekt, bijv. -10% als > 90 dagen vooruit.'
            : '• Early bird: discount for booking in advance, e.g. -10% if > 90 days ahead.'}</p>
          <p>{isNL
            ? '• Last Minute: korting als de aankomstdatum dichtbij is, bijv. -15% als < 14 dagen.'
            : '• Last minute: discount when arrival is near, e.g. -15% if < 14 days away.'}</p>
          <p className="text-gray-400">{isNL
            ? 'Alle actieve regels die matchen worden gestapeld op de basisprijs.'
            : 'All matching active rules are stacked on the base price.'}</p>
        </div>
      </details>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl p-5 max-w-xs w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm text-foreground mb-1">{isNL ? 'Regel verwijderen?' : 'Delete rule?'}</h3>
            <p className="text-xs text-muted mb-4">{isNL ? 'Dit kan niet ongedaan worden gemaakt.' : 'This cannot be undone.'}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-muted cursor-pointer">
                {isNL ? 'Annuleren' : 'Cancel'}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer disabled:opacity-50">
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {isNL ? 'Verwijderen' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
