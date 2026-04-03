'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Camera,
  StickyNote,
  Send,
  ArrowLeft,
  User,
  Calendar,
  Car,
  Hash,
  Check,
  X,
  MessageSquare,
  ImageIcon,
} from 'lucide-react';

interface BorgItem {
  category: string;
  item: string;
  status: 'nvt' | 'goed' | 'beschadigd' | 'ontbreekt';
  notes: string;
  damageAmount: number;
  photos?: string[]; // base64 compressed images
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
  token: string;
  completed_at: string | null;
  created_at: string;
  guest_name?: string;
  booking_ref?: string;
  caravan_id?: string;
  check_in?: string;
  check_out?: string;
  borg_amount?: number;
  extra_damages?: ExtraDamage[];
  cleaning_deduction?: number;
  total_deduction?: number;
}

type Step = 'intro' | 'inspect' | 'notes' | 'summary' | 'done';

const statusConfig = {
  goed: { icon: CheckCircle2, label: 'Goed', color: 'bg-emerald-500', activeColor: 'bg-emerald-500 text-white ring-emerald-500/30', emoji: '✓' },
  beschadigd: { icon: AlertTriangle, label: 'Beschadigd', color: 'bg-amber-500', activeColor: 'bg-amber-500 text-white ring-amber-500/30', emoji: '⚠' },
  ontbreekt: { icon: XCircle, label: 'Ontbreekt', color: 'bg-red-500', activeColor: 'bg-red-500 text-white ring-red-500/30', emoji: '✗' },
  nvt: { icon: Minus, label: 'N.v.t.', color: 'bg-gray-400', activeColor: 'bg-gray-400 text-white ring-gray-400/30', emoji: '—' },
};

/** Compress image file to max 800px JPEG, returns base64 data URL */
function compressImage(file: File, maxSize = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas error')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InspectiePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, ts } = useAdmin();
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<BorgChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>('intro');
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [staffName, setStaffName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [completed, setCompleted] = useState(false);
  const [extraDamages, setExtraDamages] = useState<ExtraDamage[]>([]);
  const [cleaningDeduction, setCleaningDeduction] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-save progress every 30 seconds when inspecting
  useEffect(() => {
    if (step !== 'inspect' && step !== 'notes') return;
    if (!checklist) return;
    autoSaveTimer.current = setInterval(() => {
      fetch('/api/borg', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checklist.id,
          items: checklist.items,
          generalNotes,
          staffName: staffName || undefined,
          status: 'IN_BEHANDELING',
        }),
      }).catch(() => {});
    }, 30000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [step, checklist, generalNotes, staffName]);

  const fetchChecklist = useCallback(async () => {
    try {
      const res = await fetch(`/api/borg?id=${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setChecklist(data);
      setStaffName(data.staff_name || '');
      setGeneralNotes(data.general_notes || '');
      setExtraDamages(data.extra_damages ? (typeof data.extra_damages === 'string' ? JSON.parse(data.extra_damages) : data.extra_damages) : []);
      setCleaningDeduction(data.cleaning_deduction ? Number(data.cleaning_deduction) : 0);
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-500 mt-3">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#FAFAF9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <Shield size={40} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">{t('inspection.notFound')}</h1>
          <p className="text-sm text-gray-500 mb-4">{t('inspection.notFoundDesc')}</p>
          <button onClick={() => router.back()} className="text-primary text-sm font-semibold">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // Build category structure
  const categories: { name: string; items: { globalIndex: number; item: BorgItem }[] }[] = [];
  const categoryMap = new Map<string, { globalIndex: number; item: BorgItem }[]>();
  checklist.items.forEach((item, i) => {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
    categoryMap.get(item.category)!.push({ globalIndex: i, item });
  });
  categoryMap.forEach((items, name) => categories.push({ name, items }));

  const totalItems = checklist.items.length;
  const completedCount = checklist.items.filter(i => i.status !== 'nvt').length;
  const goedCount = checklist.items.filter(i => i.status === 'goed').length;
  const beschadigdCount = checklist.items.filter(i => i.status === 'beschadigd').length;
  const ontbreektCount = checklist.items.filter(i => i.status === 'ontbreekt').length;
  const progressPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const currentCategory = categories[categoryIndex];
  const currentItem = currentCategory?.items[itemIndex];

  // Flat item navigation
  const flatItems = categories.flatMap((cat, ci) => cat.items.map((item, ii) => ({ ci, ii, ...item })));
  const currentFlatIndex = flatItems.findIndex(f => f.ci === categoryIndex && f.ii === itemIndex);
  const totalFlat = flatItems.length;

  const updateItemStatus = (status: BorgItem['status']) => {
    if (!currentItem) return;
    setChecklist(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      newItems[currentItem.globalIndex] = { ...newItems[currentItem.globalIndex], status };
      return { ...prev, items: newItems };
    });
  };

  const updateItemNotes = (globalIndex: number, notes: string) => {
    setChecklist(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      newItems[globalIndex] = { ...newItems[globalIndex], notes };
      return { ...prev, items: newItems };
    });
  };

  const addPhoto = async (globalIndex: number, file: File) => {
    setPhotoProcessing(true);
    try {
      const base64 = await compressImage(file);
      setChecklist(prev => {
        if (!prev) return prev;
        const newItems = [...prev.items];
        const photos = [...(newItems[globalIndex].photos || []), base64];
        newItems[globalIndex] = { ...newItems[globalIndex], photos };
        return { ...prev, items: newItems };
      });
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setPhotoProcessing(false);
    }
  };

  const removePhoto = (globalIndex: number, photoIndex: number) => {
    setChecklist(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      const photos = [...(newItems[globalIndex].photos || [])];
      photos.splice(photoIndex, 1);
      newItems[globalIndex] = { ...newItems[globalIndex], photos };
      return { ...prev, items: newItems };
    });
  };

  const goNext = () => {
    if (!currentCategory) return;
    if (itemIndex < currentCategory.items.length - 1) {
      setItemIndex(itemIndex + 1);
    } else if (categoryIndex < categories.length - 1) {
      setCategoryIndex(categoryIndex + 1);
      setItemIndex(0);
    } else {
      setStep('notes');
    }
  };

  const goPrev = () => {
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
    } else if (categoryIndex > 0) {
      setCategoryIndex(categoryIndex - 1);
      setItemIndex(categories[categoryIndex - 1].items.length - 1);
    }
  };

  const handleSave = async (complete: boolean) => {
    setSaving(true);
    // Calculate total deduction
    const itemDamageTotal = checklist.items.reduce((sum, item) => sum + (item.damageAmount || 0), 0);
    const extraDamageTotal = extraDamages.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDed = itemDamageTotal + extraDamageTotal + cleaningDeduction;
    try {
      await fetch('/api/borg', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checklist.id,
          items: checklist.items,
          generalNotes,
          staffName: staffName || undefined,
          status: complete ? 'AFGEROND' : 'IN_BEHANDELING',
          extraDamages,
          cleaningDeduction,
          totalDeduction: totalDed,
          ...(complete ? { completedAt: new Date().toISOString() } : {}),
        }),
      });
      if (complete) {
        setCompleted(true);
        setStep('done');
      }
    } catch {
      toast(t('inspection.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const isCheckIn = checklist.type === 'INCHECKEN';
  const typeLabel = isCheckIn ? t('inspection.checkInInspection').split(' ')[0] : t('inspection.checkOutInspection').split(' ')[0];
  const typeEmoji = isCheckIn ? '📋' : '🏁';

  // ==================== RENDER ====================

  // STEP: INTRO
  if (step === 'intro') {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#FAFAF9]">
        {/* Hero header */}
        <div className={`${isCheckIn ? 'bg-primary' : 'bg-emerald-600'} text-white`}>
          <div className="max-w-lg mx-auto px-5 py-8">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-white/70 text-sm mb-6 hover:text-white transition">
              <ArrowLeft size={16} /> {t('common.back')}
            </button>
            <div className="text-4xl mb-3">{typeEmoji}</div>
            <h1 className="text-2xl font-bold mb-1">{isCheckIn ? t('inspection.checkInInspection') : t('inspection.checkOutInspection')}</h1>
            <p className="text-white/80 text-sm">{t('inspection.subtitle')}</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-5 -mt-4">
          {/* Booking card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Hash size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">{t('inspection.ref')}</div>
                  <div className="font-semibold text-gray-900">{checklist.booking_ref}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">{t('inspection.guest')}</div>
                  <div className="font-semibold text-gray-900">{checklist.guest_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Car size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">{t('inspection.caravan')}</div>
                  <div className="font-semibold text-gray-900">{checklist.caravan_id}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">{isCheckIn ? 'Check-in' : 'Check-out'}</div>
                  <div className="font-semibold text-gray-900">
                    {isCheckIn && checklist.check_in ? new Date(checklist.check_in).toLocaleDateString('nl-NL') : null}
                    {!isCheckIn && checklist.check_out ? new Date(checklist.check_out).toLocaleDateString('nl-NL') : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff name */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">{t('inspection.whoInspects')}</label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder={t("inspection.yourName")}
              className="w-full px-4 py-3 bg-[#FAFAF9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Category preview */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('inspection.categories', { count: String(categories.length) })}</h3>
            <div className="space-y-2">
              {categories.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${isCheckIn ? 'bg-primary' : 'bg-emerald-500'}`} />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{cat.items.length} {t('inspection.itemsLabel')}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">{totalItems} {t('inspection.itemsTotal')}</span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={() => {
              setCategoryIndex(0);
              setItemIndex(0);
              setStep('inspect');
            }}
            className={`w-full py-4 ${isCheckIn ? 'bg-primary' : 'bg-emerald-600'} text-white rounded-2xl text-base font-bold shadow-lg transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2`}
          >
            {t('inspection.startInspection')}
            <ChevronRight size={20} />
          </button>
          <div className="h-8" />
        </div>
      </div>
    );
  }

  // STEP: INSPECT (per item)
  if (step === 'inspect' && currentCategory && currentItem) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#FAFAF9] flex flex-col">
        {/* Top bar */}
        <div className="bg-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-lg mx-auto px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => {
                  if (currentFlatIndex === 0) setStep('intro');
                  else goPrev();
                }}
                className="flex items-center gap-1 text-gray-500 text-sm cursor-pointer"
              >
                <ChevronLeft size={16} /> {t('common.previous')}
              </button>
              <span className="text-xs text-gray-400 font-medium">
                {currentFlatIndex + 1} / {totalFlat}
              </span>
              <button
                onClick={goNext}
                className="flex items-center gap-1 text-primary text-sm font-semibold cursor-pointer"
              >
                {currentFlatIndex === totalFlat - 1 ? t('inspection.finalize') : t('common.next')} <ChevronRight size={16} />
              </button>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isCheckIn ? 'bg-primary' : 'bg-emerald-500'}`}
                initial={false}
                animate={{ width: `${((currentFlatIndex + 1) / totalFlat) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-6 pb-8">
          {/* Category label */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isCheckIn ? 'bg-primary' : 'bg-emerald-500'}`} />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{currentCategory.name}</span>
            <span className="text-xs text-gray-300">({itemIndex + 1}/{currentCategory.items.length})</span>
          </div>

          {/* Item name */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.globalIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{currentItem.item.item}</h2>

              {/* Status buttons - BIG tap targets */}
              <div className="grid grid-cols-2 gap-3">
                {(['goed', 'beschadigd', 'ontbreekt', 'nvt'] as const).map(status => {
                  const config = statusConfig[status];
                  const Icon = config.icon;
                  const isActive = currentItem.item.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        updateItemStatus(status);
                        // Auto-advance after a short delay if selecting a definitive status
                        if (status !== 'nvt') {
                          setTimeout(() => goNext(), 350);
                        }
                      }}
                      className={`flex flex-col items-center justify-center py-6 rounded-2xl text-center transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? `${config.activeColor} ring-4 shadow-lg`
                          : 'bg-white text-gray-600 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <Icon size={28} className={isActive ? 'text-white' : ''} />
                      <span className={`text-sm font-semibold mt-2 ${isActive ? 'text-white' : ''}`}>{status === 'goed' ? t('deposit.good') : status === 'beschadigd' ? t('deposit.damaged') : status === 'ontbreekt' ? t('deposit.missing') : t('deposit.na')}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick note toggle */}
              <div className="mt-5 space-y-3">
                {/* Photo capture */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && currentItem) addPhoto(currentItem.globalIndex, file);
                    e.target.value = '';
                  }}
                />

                {/* Photo thumbnails */}
                {currentItem.item.photos && currentItem.item.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {currentItem.item.photos.map((photo, pi) => (
                      <div key={pi} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(currentItem.globalIndex, pi)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action row: camera + note */}
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoProcessing}
                    className="flex-1 py-3 bg-white rounded-xl text-sm text-gray-500 flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 hover:shadow-sm transition-all shadow-sm"
                  >
                    {photoProcessing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    {t('inspection.addPhoto') || 'Foto'}
                    {currentItem.item.photos && currentItem.item.photos.length > 0 && (
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">{currentItem.item.photos.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (activeNote === currentItem.globalIndex) {
                        setActiveNote(null);
                      } else {
                        setActiveNote(currentItem.globalIndex);
                        setNoteText(currentItem.item.notes || '');
                      }
                    }}
                    className="flex-1 py-3 bg-white rounded-xl text-sm text-gray-500 flex items-center justify-center gap-2 cursor-pointer hover:text-gray-700 hover:shadow-sm transition-all shadow-sm"
                  >
                    <StickyNote size={14} />
                    {currentItem.item.notes ? t('inspection.editRemark') : t('inspection.addRemark')}
                  </button>
                </div>

                {activeNote === currentItem.globalIndex && (
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <MessageSquare size={11} /> {t('inspection.remark')}
                      </span>
                      <button onClick={() => setActiveNote(null)} className="text-gray-400 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                    <textarea
                      value={currentItem.item.notes || ''}
                      onChange={(e) => updateItemNotes(currentItem.globalIndex, e.target.value)}
                      placeholder={t("inspection.describeProblem")}
                      rows={2}
                      autoFocus
                      className="w-full px-3 py-2 bg-[#FAFAF9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                )}

                {/* Damage amount input - when item is damaged or missing */}
                {(currentItem.item.status === 'beschadigd' || currentItem.item.status === 'ontbreekt') && (
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <label className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
                      💰 Schadebedrag
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">€</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={currentItem.item.damageAmount || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setChecklist(prev => {
                            if (!prev) return prev;
                            const newItems = [...prev.items];
                            newItems[currentItem.globalIndex] = { ...newItems[currentItem.globalIndex], damageAmount: val };
                            return { ...prev, items: newItems };
                          });
                        }}
                        placeholder="0"
                        className="flex-1 px-3 py-2 bg-[#FAFAF9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md px-5 py-3 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{completedCount} / {totalItems} {t('inspection.assessed')}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${isCheckIn ? 'bg-primary' : 'bg-emerald-500'}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // STEP: NOTES
  if (step === 'notes') {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#FAFAF9]">
        <div className="bg-white sticky top-0 z-10 shadow-sm">
          <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
            <button
              onClick={() => {
                setCategoryIndex(categories.length - 1);
                setItemIndex(categories[categories.length - 1].items.length - 1);
                setStep('inspect');
              }}
              className="flex items-center gap-1 text-gray-500 text-sm cursor-pointer"
            >
              <ChevronLeft size={16} /> {t('common.back')}
            </button>
            <span className="text-sm font-semibold text-gray-900">{t('inspection.finalize')}</span>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
          {/* Quick summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('inspection.summary')}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-emerald-600">{goedCount}</div>
                <div className="text-[11px] font-medium text-emerald-600">{t('deposit.good')}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-amber-600">{beschadigdCount}</div>
                <div className="text-[11px] font-medium text-amber-600">{t('deposit.damaged')}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-red-600">{ontbreektCount}</div>
                <div className="text-[11px] font-medium text-red-600">{t('deposit.missing')}</div>
              </div>
            </div>
            {totalItems - completedCount > 0 && (
              <p className="text-xs text-amber-600 mt-3 text-center font-medium">
                {t('inspection.notAssessed', { count: String(totalItems - completedCount) })}
              </p>
            )}
          </div>

          {/* Items with issues */}
          {(beschadigdCount > 0 || ontbreektCount > 0) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('inspection.problemsFound')}</h3>
              <div className="space-y-2">
                {checklist.items.filter(i => i.status === 'beschadigd' || i.status === 'ontbreekt').map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2">
                    {item.status === 'beschadigd' ? (
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-900 font-medium">{item.item}</div>
                      <div className="text-xs text-gray-400">{item.category}</div>
                      {item.notes && <div className="text-xs text-gray-500 mt-0.5">{item.notes}</div>}
                      {item.photos && item.photos.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {item.photos.map((p, pi) => (
                            <img key={pi} src={p} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General notes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-bold text-gray-900 mb-2">{t('inspection.generalNotes')}</label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder={t("inspection.notesPlaceholder")}
              rows={3}
              className="w-full px-4 py-3 bg-[#FAFAF9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Cleaning deduction */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-bold text-gray-900 mb-2">🧹 Schoonmaak-inhouding</label>
            <p className="text-xs text-gray-400 mb-3">Bij onvoldoende schoonmaak wordt €100 ingehouden van de borg.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCleaningDeduction(0)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${cleaningDeduction === 0 ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                ✅ Goed schoongemaakt
              </button>
              <button
                onClick={() => setCleaningDeduction(100)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${cleaningDeduction === 100 ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                ❌ €100 inhouding
              </button>
            </div>
          </div>

          {/* Extra damages (beyond inventory) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-900">🔧 Overige schade</label>
              <button
                onClick={() => setExtraDamages([...extraDamages, { description: '', amount: 0 }])}
                className="text-xs font-semibold text-primary flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Toevoegen
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Schade aan de caravan buiten de inventaris om.</p>
            {extraDamages.length === 0 && (
              <p className="text-xs text-gray-300 text-center py-3">Geen overige schade gemeld</p>
            )}
            <div className="space-y-2">
              {extraDamages.map((d, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={d.description}
                    onChange={(e) => {
                      const next = [...extraDamages];
                      next[i] = { ...next[i], description: e.target.value };
                      setExtraDamages(next);
                    }}
                    placeholder="Omschrijving schade..."
                    className="flex-1 px-3 py-2.5 bg-[#FAFAF9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">€</span>
                    <input
                      type="number"
                      min="0"
                      value={d.amount || ''}
                      onChange={(e) => {
                        const next = [...extraDamages];
                        next[i] = { ...next[i], amount: Math.max(0, Number(e.target.value) || 0) };
                        setExtraDamages(next);
                      }}
                      placeholder="0"
                      className="w-20 px-3 py-2.5 bg-[#FAFAF9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    onClick={() => setExtraDamages(extraDamages.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-2 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total deduction calculation */}
          {(() => {
            const itemDamageTotal = checklist.items.reduce((sum, item) => sum + (item.damageAmount || 0), 0);
            const extraDamageTotal = extraDamages.reduce((sum, d) => sum + (d.amount || 0), 0);
            const totalDed = itemDamageTotal + extraDamageTotal + cleaningDeduction;
            const borgAmount = checklist.borg_amount ? Number(checklist.borg_amount) : 400;
            const refund = Math.max(0, borgAmount - totalDed);
            return (
              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-primary/20">
                <h3 className="text-sm font-bold text-gray-900 mb-3">💳 Borg-afrekening</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Totale borg</span><span className="font-semibold">€{borgAmount}</span></div>
                  {itemDamageTotal > 0 && (
                    <div className="flex justify-between"><span className="text-amber-600">Schade inventaris</span><span className="font-semibold text-amber-600">-€{itemDamageTotal}</span></div>
                  )}
                  {extraDamageTotal > 0 && (
                    <div className="flex justify-between"><span className="text-amber-600">Overige schade</span><span className="font-semibold text-amber-600">-€{extraDamageTotal}</span></div>
                  )}
                  {cleaningDeduction > 0 && (
                    <div className="flex justify-between"><span className="text-amber-600">Schoonmaak</span><span className="font-semibold text-amber-600">-€{cleaningDeduction}</span></div>
                  )}
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Totaal ingehouden</span>
                      <span className={`font-bold text-lg ${totalDed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>€{totalDed}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-bold text-gray-900">Terug te storten</span>
                      <span className="font-bold text-lg text-emerald-600">€{refund}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className={`w-full py-4 ${isCheckIn ? 'bg-primary' : 'bg-emerald-600'} text-white rounded-2xl text-base font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {t('inspection.completeAndSend')}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full py-3 text-sm text-gray-500 font-medium cursor-pointer hover:text-gray-700 transition"
            >
              {t('inspection.saveAsDraft')}
            </button>
          </div>
          <div className="h-4" />
        </div>
      </div>
    );
  }

  // STEP: DONE
  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#FAFAF9] flex items-center justify-center p-5">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-20 h-20 ${isCheckIn ? 'bg-primary' : 'bg-emerald-500'} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <Check size={40} className="text-white" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('inspection.inspectionComplete')}</h2>
          <p className="text-sm text-gray-500 mb-2">
            {t('inspection.inspectionCompleteDesc', { type: typeLabel, ref: checklist.booking_ref || '' })}
          </p>
          <p className="text-xs text-gray-400 mb-6">
            {t('inspection.customerNotified')}
          </p>

          {/* Results summary */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-emerald-50 rounded-xl py-2">
              <div className="text-lg font-bold text-emerald-600">{goedCount}</div>
              <div className="text-[10px] text-emerald-600">{t('deposit.good')}</div>
            </div>
            <div className="bg-amber-50 rounded-xl py-2">
              <div className="text-lg font-bold text-amber-600">{beschadigdCount}</div>
              <div className="text-[10px] text-amber-600">{t('deposit.damaged')}</div>
            </div>
            <div className="bg-red-50 rounded-xl py-2">
              <div className="text-lg font-bold text-red-600">{ontbreektCount}</div>
              <div className="text-[10px] text-red-600">{t('deposit.missing')}</div>
            </div>
          </div>

          <button
            onClick={() => router.push('/admin/borg')}
            className={`w-full py-3 ${isCheckIn ? 'bg-primary' : 'bg-emerald-600'} text-white rounded-xl text-sm font-bold cursor-pointer transition-transform active:scale-[0.98]`}
          >
            {t('inspection.backToOverview')}
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
}
