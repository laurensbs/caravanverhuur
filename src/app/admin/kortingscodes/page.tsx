'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Percent,
  DollarSign,
  Calendar,
  Hash,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  max_uses: number | null;
  used_count: number;
  min_amount: string;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';

export default function KortingscodesPage() {
  const { t } = useAdmin();
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newMinAmount, setNewMinAmount] = useState('');
  const [newValidFrom, setNewValidFrom] = useState('');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCodes = useCallback(() => {
    fetch('/api/admin/discount-codes')
      .then(res => res.json())
      .then(data => setCodes(data.codes || []))
      .catch((e) => { console.error('Fetch error:', e); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleCreate = async () => {
    if (!newCode.trim() || !newValue) { setCreateError(t('discounts.codeValueRequired')); return; }
    const val = parseFloat(newValue);
    if (newType === 'percentage' && val > 20) { setCreateError(t('discounts.maxPercentage')); return; }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          type: newType,
          value: parseFloat(newValue),
          maxUses: newMaxUses ? parseInt(newMaxUses) : undefined,
          minAmount: newMinAmount ? parseFloat(newMinAmount) : undefined,
          validFrom: newValidFrom || undefined,
          validUntil: newValidUntil || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || t('discounts.createFailed'));
        setCreating(false);
        return;
      }
      // Reset form
      setNewCode(''); setNewValue(''); setNewMaxUses(''); setNewMinAmount('');
      setNewValidFrom(''); setNewValidUntil('');
      setShowCreate(false);
      fetchCodes();
      toast(t('common.created'), 'success');
    } catch {
      setCreateError(t('common.error'));
    }
    setCreating(false);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await fetch('/api/admin/discount-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !currentActive }),
    });
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !currentActive } : c));
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    await fetch('/api/admin/discount-codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setCodes(prev => prev.filter(c => c.id !== id));
    setDeleteId(null);
    setDeleting(false);
    toast(t('common.deleted'), 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('discounts.pageTitle')}</h2>
          <p className="text-sm text-muted">{t('discounts.codesCount', { count: String(codes.length) })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchCodes()}
            className="p-2.5 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer"
            title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? t('common.cancel') : t('discounts.newCode')} </button> </div> </div> {/* Create form */} {showCreate && ( <div className="bg-white rounded-2xl p-5 space-y-4"> <h3 className="font-semibold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> {t('discounts.newCodeTitle')}</h3> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> <div> <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">{t('discounts.code')}</label> <div className="relative"> <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" /> <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder={t("discounts.codePlaceholder")} className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> </div> <div> <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">{t('discounts.type')}</label> <div className="flex gap-2"> <button onClick={() => setNewType('percentage')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${newType === 'percentage' ? 'border-primary bg-primary/5 text-primary' : 'text-muted'}`}> <Percent className="w-4 h-4"/> Percentage </button> <button onClick={() => setNewType('fixed')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${newType === 'fixed' ? 'border-primary bg-primary/5 text-primary' : 'text-muted'}`}> <DollarSign className="w-4 h-4" /> {t('discounts.fixedAmount')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">{newType === 'percentage' ? t('discounts.valuePercent') : t('discounts.valueFixed')}</label>
              <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} max={newType === 'percentage' ? 20 : undefined} placeholder={newType === 'percentage' ? '10' : '50'} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> <div> <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">{t('discounts.maxUsage')}</label> <input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder={t("discounts.unlimited")} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> <div> <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">{t('discounts.minAmount')}</label> <input type="number" value={newMinAmount} onChange={e => setNewMinAmount(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> </div> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> <div> <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('discounts.validFrom')}</label> <input type="date" value={newValidFrom} onChange={e => setNewValidFrom(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> <div> <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('discounts.validUntil')}</label> <input type="date" value={newValidUntil} onChange={e => setNewValidUntil(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> </div> {createError && ( <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2"> <AlertTriangle className="w-4 h-4" /> {createError} </div> )} <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors"> {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Kortingscode aanmaken </button> </div> )} {/* Codes list */} <div className="space-y-2"> {codes.map(code => ( <div key={code.id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"> <div className="flex-1 min-w-0"> <div className="flex items-center gap-2 flex-wrap mb-1"> <span className="font-mono font-bold text-foreground bg-surface px-2.5 py-1 rounded-lg text-sm">{code.code}</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${code.active ?'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {code.active ? t('common.active') : t('common.inactive')}
                </span>
                <span className="text-xs text-muted bg-surface-alt px-2 py-0.5 rounded-full">
                  {code.type === 'percentage' ? `${Number(code.value)}%` : `€${Number(code.value)}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>{code.used_count}{code.max_uses ? `/${code.max_uses}` : ''} {t('discounts.used')}</span>
                {code.min_amount && Number(code.min_amount) > 0 && <span>{t('discounts.minAmountLabel', { amount: String(Number(code.min_amount)) })}</span>}
                {code.valid_until && <span>{t('discounts.validUntilLabel', { date: new Date(code.valid_until).toLocaleDateString('nl-NL') })}</span>}
                <span>{t('discounts.createdOn', { date: new Date(code.created_at).toLocaleDateString('nl-NL') })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleToggle(code.id, code.active)} className="p-2 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer" title={code.active ? t('discounts.deactivate') : t('discounts.activate')}>
                {code.active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-muted" />}
              </button>
              {deleteId === code.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDelete(code.id)} disabled={deleting} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50">
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : t('common.delete')}
                  </button>
                  <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 bg-surface-alt rounded-lg text-xs cursor-pointer">{t('common.cancel')}</button>
                </div>
              ) : (
                <button onClick={() => setDeleteId(code.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {codes.length === 0 && (
          <div className="text-center py-12 text-muted">
            <Tag className="w-12 h-12 mx-auto mb-3 text-muted" />
            <p className="text-lg font-medium">{t('discounts.noCodes')}</p>
            <p className="text-sm mt-1">{t('discounts.noCodesHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
