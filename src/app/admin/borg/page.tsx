'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import { usePageActions } from '@/app/admin/layout';
import { useUrlState } from '@/lib/use-url-state';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  Send,
  Copy,
  ExternalLink,
  Loader2,
  User,
  Calendar,
  Car,
  Hash,
  StickyNote,
  Shield,
  Trash2,
  Mail,
  PlusCircle,
  Search,
  Banknote,
  Building2,
  Truck,
  CreditCard,
  Key,
  Wallet,
  RefreshCw,
} from 'lucide-react';

interface BorgItem {
  category: string;
  item: string;
  status: 'nvt' | 'goed' | 'beschadigd' | 'ontbreekt';
  notes: string;
  damageAmount: number;
}

interface ExtraDamage {
  description: string;
  amount: number;
}

interface BorgChecklist {
  id: string;
  booking_id: string;
  type: string;
  status: string;
  items: BorgItem[];
  general_notes: string | null;
  staff_name: string | null;
  customer_agreed: boolean;
  customer_agreed_at: string | null;
  customer_notes: string | null;
  token: string;
  completed_at: string | null;
  created_at: string;
  guest_name?: string;
  booking_ref?: string;
  caravan_id?: string;
  check_in?: string;
  check_out?: string;
  borg_amount?: string;
  extra_damages?: ExtraDamage[] | null;
  cleaning_deduction?: string | null;
  total_deduction?: string | null;
  borg_return_method?: string | null;
  customer_signature?: string | null;
}

interface Booking {
  id: string;
  reference: string;
  guest_name: string;
  caravan_id: string;
  check_in: string;
  check_out: string;
  status: string;
}

const statusColors: Record<string, string> = {
  'OPEN': 'bg-primary-50 text-primary',
  'IN_BEHANDELING': 'bg-primary-50 text-primary',
  'AFGEROND': 'bg-primary-50 text-primary',
  'KLANT_AKKOORD': 'bg-primary-light text-primary-dark',
  'KLANT_BEZWAAR': 'bg-danger/10 text-danger',
};



const itemStatusIcons: Record<string, React.ReactNode> = {
  'nvt': <Minus size={14} className="text-muted" />,
  'goed': <CheckCircle2 size={14} className="text-primary" />,
  'beschadigd': <AlertTriangle size={14} className="text-primary" />,
  'ontbreekt': <XCircle size={14} className="text-danger" />,
};

export default function AdminBorgPage() {
  const { t, ts } = useAdmin();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<BorgChecklist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBookingId, setNewBookingId] = useState('');
  const [newType, setNewType] = useState('INCHECKEN');
  const [newStaffName, setNewStaffName] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useUrlState('filter', 'all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDropdownOpen, setBookingDropdownOpen] = useState(false);
  const bookingDropdownRef = useRef<HTMLDivElement>(null);
  const [confirmOnBehalfId, setConfirmOnBehalfId] = useState<string | null>(null);
  const [confirmReturnMethod, setConfirmReturnMethod] = useState<'contant' | 'bank'>('bank');

  const fetchData = useCallback(async () => {
    try {
      const [checklistRes, bookingRes] = await Promise.all([
        fetch('/api/borg'),
        fetch('/api/bookings'),
      ]);
      const checklistData = await checklistRes.json();
      const bookingData = await bookingRes.json();
      setChecklists(Array.isArray(checklistData) ? checklistData : []);
      setBookings(Array.isArray(bookingData?.bookings) ? bookingData.bookings : Array.isArray(bookingData) ? bookingData : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  usePageActions(
    useMemo(() => (
      <>
        <button onClick={() => fetchData()} className="p-2 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer" title="Refresh">
          <RefreshCw size={16} />
        </button>
        <button onClick={() => setShowNewForm(true)} className="p-2 bg-primary-dark text-white rounded-xl hover:bg-primary-dark/90 transition-colors cursor-pointer" title={t('deposit.newChecklist')}>
          <Plus size={16} />
        </button>
      </>
    ), [fetchData, t])
  );

  // Close booking dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bookingDropdownRef.current && !bookingDropdownRef.current.contains(e.target as Node)) {
        setBookingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingId) return;
    setCreating(true);
    try {
      const res = await fetch('/api/borg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: newBookingId, type: newType, staffName: newStaffName || undefined }),
      });
      if (res.ok) {
        setShowNewForm(false);
        setNewBookingId('');
        setNewStaffName('');
        await fetchData();
        toast(t('common.created'), 'success');
      }
    } catch (err) {
      console.error('Create error:', err);
      toast(t('common.actionFailed'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleItemUpdate = async (checklistId: string, itemIndex: number, field: 'status' | 'notes', value: string) => {
    setChecklists(prev => prev.map(cl => {
      if (cl.id !== checklistId) return cl;
      const newItems = [...cl.items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      return { ...cl, items: newItems };
    }));
  };

  const handleSave = async (checklist: BorgChecklist) => {
    setSaving(true);
    try {
      await fetch('/api/borg', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checklist.id,
          items: checklist.items,
          generalNotes: checklist.general_notes,
          staffName: checklist.staff_name,
          status: 'IN_BEHANDELING',
        }),
      });
      await fetchData();
      toast(t('common.saved'), 'success');
    } catch (err) {
      console.error('Save error:', err);
      toast(t('common.actionFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (checklist: BorgChecklist) => {
    setSaving(true);
    try {
      await fetch('/api/borg', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checklist.id,
          items: checklist.items,
          generalNotes: checklist.general_notes,
          staffName: checklist.staff_name,
          status: 'AFGEROND',
          completedAt: new Date().toISOString(),
        }),
      });
      await fetchData();
      toast(t('common.saved'), 'success');
    } catch (err) {
      console.error('Complete error:', err);
      toast(t('common.actionFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmOnBehalf = async (checklist: BorgChecklist) => {
    setSaving(true);
    try {
      await fetch('/api/borg', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checklist.id,
          customerConfirm: { borgReturnMethod: confirmReturnMethod },
        }),
      });
      setConfirmOnBehalfId(null);
      await fetchData();
      toast(t('common.saved'), 'success');
    } catch (err) {
      console.error('Confirm on behalf error:', err);
      toast(t('common.actionFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotesChange = (checklistId: string, notes: string) => {
    setChecklists(prev => prev.map(cl =>
      cl.id === checklistId ? { ...cl, general_notes: notes } : cl
    ));
  };

  const handleStaffNameChange = (checklistId: string, name: string) => {
    setChecklists(prev => prev.map(cl =>
      cl.id === checklistId ? { ...cl, staff_name: name } : cl
    ));
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/borg/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleAddItem = (checklistId: string) => {
    if (!newItemCategory.trim() || !newItemName.trim()) return;
    setChecklists(prev => prev.map(cl => {
      if (cl.id !== checklistId) return cl;
      const newItems = [...cl.items, { category: newItemCategory.trim(), item: newItemName.trim(), status: 'nvt' as const, notes: '', damageAmount: 0 }];
      return { ...cl, items: newItems };
    }));
    setNewItemName('');
    setAddingItemTo(null);
  };

  const handleRemoveItem = (checklistId: string, itemIndex: number) => {
    setChecklists(prev => prev.map(cl => {
      if (cl.id !== checklistId) return cl;
      const newItems = cl.items.filter((_, i) => i !== itemIndex);
      return { ...cl, items: newItems };
    }));
  };

  const filtered = filter === 'all' ? checklists : checklists.filter(c => c.status === filter);

  // Group items by category
  const groupByCategory = (items: BorgItem[]) => {
    const groups: Record<string, BorgItem[]> = {};
    items.forEach((item, i) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push({ ...item, notes: item.notes || '' });
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    total: checklists.length,
    open: checklists.filter(c => c.status === 'OPEN').length,
    inProgress: checklists.filter(c => c.status === 'IN_BEHANDELING').length,
    done: checklists.filter(c => ['AFGEROND', 'KLANT_AKKOORD', 'KLANT_BEZWAAR'].includes(c.status)).length,
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button onClick={() => fetchData()}
          className="p-2.5 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer"
          title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: t('common.total'), value: stats.total, color: 'bg-surface text-foreground' },
          { label: t('deposit.open'), value: stats.open, color: 'bg-primary-50 text-primary' },
          { label: t('deposit.inProgress'), value: stats.inProgress, color: 'bg-primary-50 text-primary' },
          { label: t('deposit.completed'), value: stats.done, color: 'bg-primary-50 text-primary' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 sm:p-4 text-center`}>
            <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5 sm:mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Departure Prep - Upcoming borg returns */}
      {(() => {
        const departures = checklists.filter(c => {
          if (!c.borg_return_method) return false;
          if (c.status !== 'KLANT_AKKOORD') return false;
          if (!c.check_out) return false;
          // Show departures in next 14 days or past 3 days
          const checkoutDate = new Date(c.check_out);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((checkoutDate.getTime() - now.getTime()) / 86400000);
          return diffDays >= -3 && diffDays <= 14;
        }).sort((a, b) => new Date(a.check_out!).getTime() - new Date(b.check_out!).getTime());

        const cashDepartures = departures.filter(c => c.borg_return_method === 'contant');

        if (departures.length === 0) return null;

        return (
          <div className="bg-white rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 text-sm sm:text-base">
                  <Truck className="w-4 h-4 text-primary" />
                  {t('deposit.departurePrep')}
                </h3>
                <p className="text-xs text-muted mt-0.5">{t('deposit.departurePrepDesc')}</p>
              </div>
              {cashDepartures.length > 0 && (
                <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <CreditCard size={14} />
                  {t('deposit.bringPinDevice')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {departures.map(dep => {
                const borgAmount = dep.borg_amount ? parseFloat(dep.borg_amount) : 400;
                const totalDed = dep.total_deduction ? parseFloat(dep.total_deduction) : 0;
                const refund = Math.max(0, borgAmount - totalDed);
                const isCash = dep.borg_return_method === 'contant';
                const checkoutDate = new Date(dep.check_out!);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((checkoutDate.getTime() - now.getTime()) / 86400000);
                const isToday = daysUntil === 0;
                const isPast = daysUntil < 0;

                return (
                  <div key={dep.id} className={`rounded-xl p-3 sm:p-4 border-2 ${
                    isCash && (isToday || isPast) ? 'border-amber-300 bg-amber-50' :
                    isCash ? 'border-amber-200 bg-amber-50/50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{dep.guest_name || 'Gast'}</span>
                          <span className="text-xs text-muted">{dep.booking_ref}</span>
                          {isCash ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
                              <Banknote size={10} /> {t('deposit.borgCash')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              <Building2 size={10} /> {t('deposit.borgBank')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          <span>{dep.caravan_id}</span>
                          <span className={isToday ? 'font-bold text-amber-700' : isPast ? 'font-bold text-red-600' : ''}>
                            {t('deposit.checkoutOn')} {checkoutDate.toLocaleDateString('nl-NL')}
                            {isToday ? ' (vandaag!)' : isPast ? ` (${Math.abs(daysUntil)}d geleden)` : daysUntil <= 3 ? ` (${daysUntil}d)` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-emerald-600">€{refund.toFixed(0)}</div>
                        <div className="text-[10px] text-muted">{t('deposit.refundAmount')}</div>
                      </div>
                    </div>

                    {/* Driver checklist for cash returns */}
                    {isCash && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">{t('deposit.driverChecklist')}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { icon: CreditCard, label: t('deposit.driverPinDevice'), critical: true },
                            { icon: Wallet, label: t('deposit.driverCashReady'), critical: true },
                            { icon: Key, label: t('deposit.driverKeys'), critical: false },
                            { icon: ClipboardCheck, label: t('deposit.driverInspectionForm'), critical: false },
                          ].map((item, i) => (
                            <div key={i} className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5 ${
                              item.critical ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-white/70 text-gray-600'
                            }`}>
                              <item.icon size={12} />
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* New Checklist Modal */}
      <AnimatePresence>
        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4 overflow-y-auto">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreate}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mb-8"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-foreground">{t('deposit.createTitle')}</h3>
                <button type="button" onClick={() => setShowNewForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                  <XCircle size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t('deposit.booking')}</label>
                  <div ref={bookingDropdownRef} className="relative">
                    <div
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus-within:border-primary flex items-center gap-2 bg-white cursor-pointer border border-gray-200"
                      onClick={() => setBookingDropdownOpen(true)}
                    >
                      <Search size={14} className="text-muted shrink-0" />
                      <input
                        type="text"
                        value={bookingSearch}
                        onChange={(e) => {
                          setBookingSearch(e.target.value);
                          setBookingDropdownOpen(true);
                          if (!e.target.value) setNewBookingId('');
                        }}
                        onFocus={() => setBookingDropdownOpen(true)}
                        placeholder={newBookingId ? bookings.find(b => b.id === newBookingId)?.reference + ' — ' + bookings.find(b => b.id === newBookingId)?.guest_name : t('deposit.selectBooking')}
                        className="flex-1 bg-transparent outline-none text-sm min-w-0 placeholder:text-muted"
                      />
                      {newBookingId && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setNewBookingId(''); setBookingSearch(''); }}
                          className="text-muted hover:text-foreground cursor-pointer shrink-0"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                    {bookingDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto z-50">
                        {bookings
                          .filter(b => b.status !== 'GEANNULEERD')
                          .filter(b => {
                            if (!bookingSearch) return true;
                            const q = bookingSearch.toLowerCase();
                            return (
                              b.reference?.toLowerCase().includes(q) ||
                              b.guest_name?.toLowerCase().includes(q) ||
                              b.caravan_id?.toLowerCase().includes(q)
                            );
                          })
                          .length === 0 ? (
                            <div className="px-3 py-3 text-sm text-muted text-center">
                              {t('common.noResults') || 'Geen resultaten'}
                            </div>
                          ) : (
                            bookings
                              .filter(b => b.status !== 'GEANNULEERD')
                              .filter(b => {
                                if (!bookingSearch) return true;
                                const q = bookingSearch.toLowerCase();
                                return (
                                  b.reference?.toLowerCase().includes(q) ||
                                  b.guest_name?.toLowerCase().includes(q) ||
                                  b.caravan_id?.toLowerCase().includes(q)
                                );
                              })
                              .map(b => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => {
                                    setNewBookingId(b.id);
                                    setBookingSearch('');
                                    setBookingDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors cursor-pointer flex items-center gap-3 ${
                                    newBookingId === b.id ? 'bg-primary/10' : ''
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground">{b.reference} — {b.guest_name}</div>
                                    <div className="text-xs text-muted mt-0.5">
                                      {b.caravan_id} · {b.check_in ? new Date(b.check_in).toLocaleDateString('nl-NL') : ''} - {b.check_out ? new Date(b.check_out).toLocaleDateString('nl-NL') : ''}
                                    </div>
                                  </div>
                                  {newBookingId === b.id && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                                </button>
                              ))
                          )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t('deposit.checklistType')}</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-primary border border-gray-200"
                    >
                      <option value="INCHECKEN">{ts('INCHECKEN')}</option>
                      <option value="UITCHECKEN">{ts('UITCHECKEN')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t('deposit.employee')}</label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder={t("deposit.employeePlaceholder")}
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-primary border border-gray-200"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-5 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2.5 text-sm text-muted font-medium hover:text-foreground transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: t('common.all') },
          { value: 'OPEN', label: t('deposit.open') },
          { value: 'IN_BEHANDELING', label: t('deposit.inProgress') },
          { value: 'AFGEROND', label: t('deposit.completed') },
          { value: 'KLANT_AKKOORD', label: t('deposit.customerAgreed') },
          { value: 'KLANT_BEZWAAR', label: t('deposit.customerObjected') },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-white text-muted hover:bg-surface'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Checklists */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">{t('deposit.noChecklists')}</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filtered.map(checklist => {
            const isExpanded = expandedId === checklist.id;
            const categories = groupByCategory(checklist.items);
            const allItems = checklist.items || [];
            const completedItems = allItems.filter(i => i.status !== 'nvt').length;
            const damagedItems = allItems.filter(i => i.status === 'beschadigd' || i.status === 'ontbreekt').length;

            return (
              <motion.div
                key={checklist.id}
                layout
                className="bg-white rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : checklist.id)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-surface transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                      checklist.type === 'INCHECKEN' ? 'bg-primary-50' : 'bg-primary-50'
                    }`}>
                      <ClipboardCheck size={18} className={
                        checklist.type === 'INCHECKEN' ? 'text-primary' : 'text-primary'
                      } />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{checklist.booking_ref}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          checklist.type === 'INCHECKEN' ? 'bg-primary-50 text-primary' : 'bg-primary-50 text-primary'
                        }`}>
                          {checklist.type === 'INCHECKEN' ? 'Check-in' : 'Check-out'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[checklist.status] || 'bg-surface-alt text-muted'}`}>
                          {ts(checklist.status)}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><User size={12} /> {checklist.guest_name}</span>
                        <span className="flex items-center gap-1"><Car size={12} /> {checklist.caravan_id}</span>
                        <span>{completedItems}/{allItems.length} {t('deposit.itemsCompleted')}</span>
                        {damagedItems > 0 && (
                          <span className="text-danger font-medium">{damagedItems} {t('deposit.problems')}</span>
                        )}
                        {checklist.total_deduction && parseFloat(checklist.total_deduction) > 0 && (
                          <span className="text-amber-600 font-semibold">💳 -€{parseFloat(checklist.total_deduction).toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {isExpanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 sm:p-4 space-y-3 sm:space-y-5">
                        {/* Info bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted">
                            <Hash size={13} /> <span className="font-medium text-foreground">{checklist.booking_ref}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted">
                            <User size={13} /> <span>{checklist.guest_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted">
                            <Calendar size={13} /> <span>{checklist.check_in ? new Date(checklist.check_in).toLocaleDateString('nl-NL') : '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted">
                            <Calendar size={13} /> <span>{checklist.check_out ? new Date(checklist.check_out).toLocaleDateString('nl-NL') : '-'}</span>
                          </div>
                        </div>

                        {/* Staff name */}
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">{t('deposit.staffName')}</label>
                          <input
                            type="text"
                            value={checklist.staff_name || ''}
                            onChange={(e) => handleStaffNameChange(checklist.id, e.target.value)}
                            className="w-full max-w-xs px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary"
                            placeholder={t("deposit.employeePlaceholder")}
                            disabled={checklist.status === 'AFGEROND' || checklist.status === 'KLANT_AKKOORD'}
                          />
                        </div>

                        {/* Checklist items by category */}
                        {Object.entries(categories).map(([category, items]) => {
                          // Find correct indices from the original flat array
                          const categoryStartIndex = allItems.findIndex(i => i.category === category);
                          return (
                            <div key={category}>
                              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                {category}
                              </h4>
                              <div className="space-y-2">
                                {items.map((item, localIdx) => {
                                  const globalIdx = allItems.findIndex(
                                    (ai, idx) => idx >= categoryStartIndex && ai.category === category && ai.item === item.item
                                  );
                                  const isEditable = checklist.status !== 'AFGEROND' && checklist.status !== 'KLANT_AKKOORD';

                                  return (
                                    <div key={item.item} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-surface rounded-lg p-2 sm:p-2.5">
                                      <div className="flex items-center gap-2 min-w-0 sm:w-1/3">
                                        {itemStatusIcons[item.status]}
                                        <span className="text-sm text-foreground">{item.item}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:w-1/3">
                                        {(['goed', 'beschadigd', 'ontbreekt', 'nvt'] as const).map(st => (
                                          <button
                                            key={st}
                                            onClick={() => isEditable && handleItemUpdate(checklist.id, globalIdx, 'status', st)}
                                            disabled={!isEditable}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                              item.status === st
                                                ? st === 'goed' ? 'bg-primary text-white'
                                                : st === 'beschadigd' ? 'bg-primary text-white'
                                                : st === 'ontbreekt' ? 'bg-danger text-white'
                                                : 'bg-muted text-white'
                                                : 'bg-white text-muted hover:bg-surface-alt disabled:opacity-50'
                                            }`}
                                          >
                                            {st === 'goed' ? t('deposit.good') : st === 'beschadigd' ? t('deposit.damaged') : st === 'ontbreekt' ? t('deposit.missing') : t('deposit.na')}
                                          </button>
                                        ))}
                                      </div>
                                      <input
                                        type="text"
                                        value={item.notes}
                                        onChange={(e) => isEditable && handleItemUpdate(checklist.id, globalIdx, 'notes', e.target.value)}
                                        placeholder={t("deposit.remarks")}
                                        disabled={!isEditable}
                                        className="flex-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-primary disabled:bg-surface-alt"
                                      />
                                      {isEditable && (
                                        <button
                                          onClick={() => handleRemoveItem(checklist.id, globalIdx)}
                                          className="shrink-0 p-1 text-muted hover:text-danger transition-colors cursor-pointer"
                                          title={t("common.delete")}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Add custom item */}
                        {checklist.status !== 'AFGEROND' && checklist.status !== 'KLANT_AKKOORD' && (
                          <div className="rounded-lg p-3">
                            {addingItemTo === checklist.id ? (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                  value={newItemCategory}
                                  onChange={(e) => setNewItemCategory(e.target.value)}
                                  className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary sm:w-40"
                                >
                                  <option value="">{t('deposit.category')}</option>
                                  {[...new Set(checklist.items.map(i => i.category))].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                  <option value="__new">{t('deposit.newCategory')}</option>
                                </select>
                                {newItemCategory === '__new' && (
                                  <input
                                    type="text"
                                    placeholder={t("deposit.categoryName")}
                                    onChange={(e) => setNewItemCategory(e.target.value === '' ? '__new' : e.target.value)}
                                    className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary sm:w-40"
                                  />
                                )}
                                <input
                                  type="text"
                                  value={newItemName}
                                  onChange={(e) => setNewItemName(e.target.value)}
                                  placeholder={t("deposit.itemName")}
                                  className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary"
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(checklist.id)}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddItem(checklist.id)}
                                    disabled={!newItemCategory || newItemCategory === '__new' || !newItemName.trim()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                  >
                                    {t('common.add')}
                                  </button>
                                  <button
                                    onClick={() => { setAddingItemTo(null); setNewItemName(''); setNewItemCategory(''); }}
                                    className="px-4 py-2 bg-surface-alt text-muted rounded-lg text-sm cursor-pointer"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setAddingItemTo(checklist.id); setNewItemCategory(''); setNewItemName(''); }}
                                className="flex items-center gap-2 text-xs text-primary font-medium cursor-pointer hover:text-primary-dark transition-colors"
                              >
                                <PlusCircle size={14} /> {t('deposit.addItem')}
                              </button>
                            )}
                          </div>
                        )}

                        {/* General notes */}
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1 flex items-center gap-1">
                            <StickyNote size={12} /> {t('deposit.generalNotes')}
                          </label>
                          <textarea
                            value={checklist.general_notes || ''}
                            onChange={(e) => handleNotesChange(checklist.id, e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary disabled:bg-surface-alt"
                            placeholder={t("deposit.notesPlaceholder")}
                            disabled={checklist.status === 'AFGEROND' || checklist.status === 'KLANT_AKKOORD'}
                          />
                        </div>

                        {/* Deduction summary (read-only in borg overview, editable in inspection page) */}
                        {(() => {
                          const borgAmount = checklist.borg_amount ? parseFloat(checklist.borg_amount) : 400;
                          const itemDamageTotal = allItems.reduce((sum, item) => sum + (item.damageAmount || 0), 0);
                          const extraDamages: ExtraDamage[] = checklist.extra_damages || [];
                          const extraDamageTotal = extraDamages.reduce((sum, d) => sum + (d.amount || 0), 0);
                          const cleaningDed = checklist.cleaning_deduction ? parseFloat(checklist.cleaning_deduction) : 0;
                          const totalDed = checklist.total_deduction ? parseFloat(checklist.total_deduction) : (itemDamageTotal + extraDamageTotal + cleaningDed);
                          const refund = Math.max(0, borgAmount - totalDed);
                          if (totalDed === 0 && checklist.status === 'OPEN') return null;
                          return (
                            <div className="bg-surface rounded-lg p-4 border border-gray-100">
                              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">💳 Borg-afrekening</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-muted">Borg</span><span className="font-medium">€{borgAmount}</span></div>
                                {itemDamageTotal > 0 && <div className="flex justify-between"><span className="text-amber-600">Schade inventaris</span><span className="font-medium text-amber-600">-€{itemDamageTotal}</span></div>}
                                {extraDamages.map((d, i) => (
                                  <div key={i} className="flex justify-between"><span className="text-amber-600">{d.description || 'Overige schade'}</span><span className="font-medium text-amber-600">-€{d.amount}</span></div>
                                ))}
                                {cleaningDed > 0 && <div className="flex justify-between"><span className="text-amber-600">Schoonmaak</span><span className="font-medium text-amber-600">-€{cleaningDed}</span></div>}
                                <div className="border-t border-gray-200 pt-1 mt-1">
                                  <div className="flex justify-between"><span className="font-bold">Ingehouden</span><span className={`font-bold ${totalDed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>€{totalDed}</span></div>
                                  <div className="flex justify-between"><span className="font-bold">Retour</span><span className="font-bold text-emerald-600">€{refund}</span></div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Customer response */}
                        {(checklist.customer_agreed || checklist.customer_notes) && (
                          <div className={`rounded-lg p-4 ${checklist.customer_agreed ? 'bg-primary-light border border-primary-light' : 'bg-danger/10 border border-danger'}`}>
                            <h4 className="font-semibold text-sm mb-1">
                              {checklist.customer_agreed ? ('✅ ' + t('deposit.customerAgreed')) : ('❌ ' + t('deposit.customerObjected'))}
                            </h4>
                            {checklist.customer_agreed_at && (
                              <p className="text-xs text-muted mb-1">
                                Op {new Date(checklist.customer_agreed_at).toLocaleString('nl-NL')}
                              </p>
                            )}
                            {checklist.customer_notes && (
                              <p className="text-sm mt-1">{checklist.customer_notes}</p>
                            )}
                            {checklist.borg_return_method && (
                              <p className="text-xs font-medium mt-2">
                                💰 Borg terug: <span className="font-bold">{checklist.borg_return_method === 'contant' ? 'Contant' : 'Via bank'}</span>
                              </p>
                            )}
                            {checklist.customer_signature && (
                              <div className="mt-2">
                                <p className="text-[10px] text-muted mb-1">Handtekening:</p>
                                <img src={checklist.customer_signature} alt="Signature" className="h-12 object-contain bg-white rounded p-1" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 pt-1 sm:pt-2">
                          {checklist.status !== 'AFGEROND' && checklist.status !== 'KLANT_AKKOORD' && (
                            <>
                              <button
                                onClick={() => handleSave(checklist)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-surface-alt text-foreground rounded-lg text-sm font-semibold hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                {t('deposit.saveBtn')}
                              </button>
                              <button
                                onClick={() => handleComplete(checklist)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {t('deposit.completeAndSend')}
                              </button>
                              <p className="w-full text-xs text-muted flex items-center gap-1 mt-1">
                                <Mail size={12} /> {t('deposit.emailSentNote')}
                              </p>
                            </>
                          )}
                          {checklist.status === 'AFGEROND' && !checklist.customer_agreed && (
                            <div className="w-full space-y-3">
                              <div className="flex items-center gap-2 text-xs text-primary">
                                <Mail size={13} />
                                <span className="font-medium">{t('deposit.emailSentWaiting')}</span>
                              </div>
                              {confirmOnBehalfId === checklist.id ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                  <p className="text-sm text-amber-800 font-medium">{t('deposit.selectReturnMethod')}</p>
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmReturnMethod('contant')}
                                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-colors cursor-pointer ${confirmReturnMethod === 'contant' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                                    >
                                      <Banknote size={16} /> {t('deposit.borgCash')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmReturnMethod('bank')}
                                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-colors cursor-pointer ${confirmReturnMethod === 'bank' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                                    >
                                      <Building2 size={16} /> {t('deposit.borgBank')}
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleConfirmOnBehalf(checklist)}
                                      disabled={saving}
                                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                      {t('deposit.confirmAndComplete')}
                                    </button>
                                    <button
                                      onClick={() => setConfirmOnBehalfId(null)}
                                      className="px-4 py-2 bg-surface-alt text-muted rounded-lg text-sm font-medium hover:bg-surface transition-colors cursor-pointer"
                                    >
                                      {t('common.cancel')}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setConfirmOnBehalfId(checklist.id); setConfirmReturnMethod('bank'); }}
                                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-semibold hover:bg-amber-200 transition-colors cursor-pointer"
                                >
                                  <User size={14} />
                                  {t('deposit.confirmOnBehalf')}
                                </button>
                              )}
                              <p className="text-[11px] text-muted">{t('deposit.confirmOnBehalfDesc')}</p>
                            </div>
                          )}
                          <button
                            onClick={() => copyLink(checklist.token)}
                            className="flex items-center gap-2 px-4 py-2 bg-surface-alt text-muted rounded-lg text-sm font-medium hover:bg-surface-alt transition-colors cursor-pointer"
                          >
                            {copiedToken === checklist.token ? <CheckCircle2 size={14} className="text-primary" /> : <Copy size={14} />}
                            {copiedToken === checklist.token ? t('common.copied') : t('deposit.copyLink')}
                          </button>
                          <a
                            href={`https://caravanverhuurspanje.com/borg/${checklist.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-surface-alt text-muted rounded-lg text-sm font-medium hover:bg-surface-alt transition-colors"
                          >
                            <ExternalLink size={14} />
                            {t('deposit.viewCustomerPage')}
                          </a>
                          {checklist.status !== 'AFGEROND' && checklist.status !== 'KLANT_AKKOORD' && (
                            <a
                              href={`/admin/inspectie/${checklist.id}`}
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                            >
                              <ClipboardCheck size={14} />
                              {t('deposit.mobileInspection')}
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
