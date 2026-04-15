'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  Calendar,
  User,
  Hash,
  MessageSquare,
  Loader2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Printer,
  Banknote,
  Building2,
  ChevronDown,
  ChevronUp,
  PenTool,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

const SignatureCanvas = dynamic(() => import('@/components/SignatureCanvas'), { ssr: false });

interface BorgItem {
  category: string;
  item: string;
  status: 'nvt' | 'goed' | 'beschadigd' | 'ontbreekt';
  notes: string;
  photos?: string[];
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
  guest_name: string;
  booking_ref: string;
  caravan_id: string;
  check_in: string;
  check_out: string;
  borg_amount: string;
  guest_email: string;
  extra_damages: ExtraDamage[] | null;
  cleaning_deduction: string | null;
  total_deduction: string | null;
  borg_return_method: string | null;
  customer_signature: string | null;
}

const itemStatusIcons: Record<string, React.ReactNode> = {
  'nvt': <Minus size={16} className="text-muted" />,
  'goed': <CheckCircle2 size={16} className="text-primary" />,
  'beschadigd': <AlertTriangle size={16} className="text-primary" />,
  'ontbreekt': <XCircle size={16} className="text-danger" />,
};

type CustomerStep = 'review' | 'confirm';

export default function CustomerBorgPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { t } = useLanguage();
  const [checklist, setChecklist] = useState<BorgChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [borgReturnMethod, setBorgReturnMethod] = useState<'contant' | 'bank' | ''>('');
  const [signature, setSignature] = useState<string | null>(null);
  const [customerStep, setCustomerStep] = useState<CustomerStep>('review');
  const [agreedChoice, setAgreedChoice] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchChecklist() {
      try {
        const res = await fetch(`/api/borg/${token}`);
        if (!res.ok) {
          setError(t('borgPage.errorNotFound'));
          return;
        }
        const data = await res.json();
        setChecklist(data);
        if (data.customer_notes) setCustomerNotes(data.customer_notes);
      } catch {
        setError(t('borgPage.errorLoading'));
      } finally {
        setLoading(false);
      }
    }
    fetchChecklist();
  }, [token]);

  const handleProceedToConfirm = (agreed: boolean) => {
    setAgreedChoice(agreed);
    setCustomerStep('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCheckIn = checklist?.type === 'INCHECKEN';

  const handleSubmit = async () => {
    if (!agreedChoice && agreedChoice !== false) return;
    setValidationError('');

    // Only require signature and return method when agreeing (and not check-in)
    if (agreedChoice) {
      if (!isCheckIn && !borgReturnMethod) {
        setValidationError(t('borgPage.borgReturnMethodRequired'));
        return;
      }
      if (!signature) {
        setValidationError(t('borgPage.signatureRequired'));
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/borg/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreed: agreedChoice,
          notes: customerNotes || undefined,
          borgReturnMethod: borgReturnMethod || undefined,
          signature: signature || undefined,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setChecklist(prev => prev ? {
          ...prev,
          customer_agreed: agreedChoice!,
          customer_notes: customerNotes,
          status: agreedChoice ? 'KLANT_AKKOORD' : 'KLANT_BEZWAAR',
          borg_return_method: borgReturnMethod || null,
          customer_signature: signature,
        } : null);
      }
    } catch {
      alert(t('borgPage.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group items by category
  const groupByCategory = (items: BorgItem[]) => {
    const groups: Record<string, BorgItem[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <Shield className="w-16 h-16 text-danger/70 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">{t('borgPage.notFoundTitle')}</h1>
          <p className="text-muted text-sm mb-6">{error || t('borgPage.notFoundDesc')}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={14} />
            {t('borgPage.backToWebsite')}
          </Link>
        </div>
      </div>
    );
  }

  const categories = groupByCategory(checklist.items);
  const allItems = checklist.items || [];
  const goedItems = allItems.filter(i => i.status === 'goed').length;
  const beschadigdItems = allItems.filter(i => i.status === 'beschadigd').length;
  const ontbreektItems = allItems.filter(i => i.status === 'ontbreekt').length;
  const hasIssues = beschadigdItems > 0 || ontbreektItems > 0;
  const canRespond = checklist.status === 'AFGEROND' && !checklist.customer_agreed && !submitted;

  const borgAmount = parseFloat(checklist.borg_amount) || 400;
  const itemDamageTotal = allItems.reduce((sum, item) => sum + (item.damageAmount || 0), 0);
  const extraDamages: ExtraDamage[] = checklist.extra_damages || [];
  const extraDamageTotal = extraDamages.reduce((sum, d) => sum + (d.amount || 0), 0);
  const cleaningDed = checklist.cleaning_deduction ? parseFloat(checklist.cleaning_deduction) : 0;
  const totalDed = checklist.total_deduction ? parseFloat(checklist.total_deduction) : (itemDamageTotal + extraDamageTotal + cleaningDed);
  const refund = Math.max(0, borgAmount - totalDed);
  const hasDeductions = totalDed > 0;

  // CONFIRM STEP - Review + signature + borg return method
  if (customerStep === 'confirm' && canRespond && agreedChoice !== null) {
    return (
      <div className="min-h-screen bg-surface">
        {/* Header */}
        <div className="bg-primary-dark-light text-white">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <button
              onClick={() => { setCustomerStep('review'); setValidationError(''); }}
              className="flex items-center gap-1 text-white/70 text-sm mb-4 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={16} /> {t('borgPage.backToSite').replace('← ', '')}
            </button>
            <div className="flex items-center gap-2 mb-1">
              <PenTool size={20} />
              <span className="text-white/80 text-sm font-medium">{isCheckIn ? 'Check-in bevestiging' : t('borgPage.confirmTitle')}</span>
            </div>
            <h1 className="text-xl font-bold">
              {isCheckIn ? 'Bevestig ontvangst' : (agreedChoice ? t('borgPage.agreeBtn').split('—')[0].trim() : t('borgPage.objectBtn'))}
            </h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <p className="text-sm text-muted">{isCheckIn ? 'Bevestig de ontvangst van de inventaris en de borgbetaling met uw handtekening.' : t('borgPage.confirmDesc')}</p>

          {/* Borg info for check-in */}
          {isCheckIn && (
            <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
              <h3 className="font-bold text-sm text-foreground mb-3">💳 Borgbetaling</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Borgbedrag</span>
                  <span className="font-bold text-lg text-primary">€{borgAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted mt-2">Dit bedrag wordt contant betaald op de camping bij check-in.</p>
              </div>
            </div>
          )}

          {/* Summary of deductions (checkout only) */}
          {!isCheckIn && (
          <div className={`rounded-xl p-4 ${hasDeductions ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <h3 className="font-bold text-sm text-foreground mb-3">💳 Borg-afrekening</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Totale borg</span>
                <span className="font-semibold">€{borgAmount.toFixed(2)}</span>
              </div>
              {totalDed > 0 && (
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">Totaal ingehouden</span>
                  <span className="font-bold text-red-600">€{totalDed.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-bold text-foreground">Terug te ontvangen</span>
                <span className="font-bold text-lg text-emerald-600">€{refund.toFixed(2)}</span>
              </div>
            </div>
          </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-xl p-4">
            <label className="block text-xs font-medium text-foreground mb-1">
              {t('borgPage.commentsOptional')}
            </label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none"
              placeholder={t('borgPage.commentsPlaceholder')}
            />
          </div>

          {/* Borg return method - only for agree at checkout */}
          {agreedChoice && !isCheckIn && (
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-bold text-sm text-foreground mb-3">{t('borgPage.borgReturnMethodTitle')}</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setBorgReturnMethod('contant'); setValidationError(''); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition cursor-pointer ${
                    borgReturnMethod === 'contant' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${borgReturnMethod === 'contant' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Banknote size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm text-foreground">{t('borgPage.borgReturnCash')}</div>
                    <div className="text-xs text-muted">{t('borgPage.borgReturnCashDesc')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${borgReturnMethod === 'contant' ? 'border-primary' : 'border-gray-300'}`}>
                    {borgReturnMethod === 'contant' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setBorgReturnMethod('bank'); setValidationError(''); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition cursor-pointer ${
                    borgReturnMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${borgReturnMethod === 'bank' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Building2 size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm text-foreground">{t('borgPage.borgReturnBank')}</div>
                    <div className="text-xs text-muted">{t('borgPage.borgReturnBankDesc')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${borgReturnMethod === 'bank' ? 'border-primary' : 'border-gray-300'}`}>
                    {borgReturnMethod === 'bank' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="bg-white rounded-xl p-4">
            <SignatureCanvas
              onSignature={setSignature}
              label={t('borgPage.signatureTitle')}
              clearLabel={t('borgPage.signatureClear')}
            />
            <p className="text-[10px] text-muted mt-2">
              {checklist.guest_name} — {new Date().toLocaleDateString('nl-NL')}
            </p>
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="bg-red-50 text-red-600 text-sm font-medium rounded-xl p-3 text-center">
              {validationError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-2 px-4 py-4 ${
              agreedChoice ? 'bg-emerald-600' : 'bg-red-500'
            } text-white rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 text-base shadow-lg`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : agreedChoice ? <ThumbsUp size={18} /> : <ThumbsDown size={18} />}
            {t('borgPage.confirmAndSign')}
          </button>

          <div className="h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-primary-dark-light text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur3.png"
              alt="Caravanverhuur Costa Brava"
              width={240}
              height={70}
              className="w-40 sm:w-48 h-auto brightness-0 invert"
             
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} />
              <span className="text-white/80 text-sm font-medium">{t('borgPage.title')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {checklist.type === 'INCHECKEN' ? t('borgPage.checkinInspection') : t('borgPage.checkoutInspection')}
            </h1>
            <p className="text-primary-light text-sm sm:text-base">
              {t('borgPage.bookingRef').replace('{ref}', checklist.booking_ref).replace('{name}', checklist.guest_name)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-4">
        {/* Status banner */}
        <div className={`rounded-xl p-4 ${
          checklist.status === 'KLANT_BEZWAAR' ? 'bg-red-50' : 'bg-emerald-50'
        }`}>
          <p className="font-semibold text-sm">
            Status: {
              checklist.status === 'OPEN' ? t('borgPage.statusPreparing') :
              checklist.status === 'IN_BEHANDELING' ? t('borgPage.statusFilling') :
              checklist.status === 'AFGEROND' ? t('borgPage.statusReady') :
              checklist.status === 'KLANT_AKKOORD' ? t('borgPage.statusAgreed') :
              checklist.status === 'KLANT_BEZWAAR' ? t('borgPage.statusObjected') :
              checklist.status
            }
          </p>
          {checklist.status === 'OPEN' || checklist.status === 'IN_BEHANDELING' ? (
            <p className="text-xs text-muted mt-1">
              {t('borgPage.statusPreparingDesc')}
            </p>
          ) : checklist.status === 'AFGEROND' && !checklist.customer_agreed ? (
            <p className="text-xs text-muted mt-1">
              {t('borgPage.statusReadyDesc')}
            </p>
          ) : null}
        </div>

        {/* Booking info */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="font-semibold text-sm text-foreground mb-3">{t('borgPage.bookingDetails')}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted">
              <Hash size={14} /> <span className="text-foreground font-medium">{checklist.booking_ref}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <User size={14} /> <span>{checklist.guest_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Shield size={14} /> <span className="font-medium">&euro;{parseFloat(checklist.borg_amount).toFixed(2)} {t('borgPage.deposit')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Calendar size={14} /> <span>{t('borgPage.checkIn')} {new Date(checklist.check_in).toLocaleDateString('nl-NL')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Calendar size={14} /> <span>{t('borgPage.checkOut')} {new Date(checklist.check_out).toLocaleDateString('nl-NL')}</span>
            </div>
          </div>
          {checklist.staff_name && (
            <p className="text-xs text-muted mt-3 pt-3 border-t border-gray-100">
              {t('borgPage.inspectedBy')} <span className="font-medium">{checklist.staff_name}</span>
              {checklist.completed_at && (
                <span> {t('borgPage.on')} {new Date(checklist.completed_at).toLocaleString('nl-NL')}</span>
              )}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-0.5" />
            <div className="text-lg font-bold text-emerald-700">{goedItems}</div>
            <div className="text-[10px] font-medium text-emerald-600">{t('borgPage.inOrder')}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-0.5" />
            <div className="text-lg font-bold text-amber-700">{beschadigdItems}</div>
            <div className="text-[10px] font-medium text-amber-600">{t('borgPage.damagedLabel')}</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-0.5" />
            <div className="text-lg font-bold text-red-600">{ontbreektItems}</div>
            <div className="text-[10px] font-medium text-red-500">{t('borgPage.missingLabel')}</div>
          </div>
        </div>

        {/* Checklist items by category - collapsible on mobile */}
        {Object.entries(categories).map(([category, items]) => {
          const categoryIssues = items.filter(i => i.status === 'beschadigd' || i.status === 'ontbreekt').length;
          const isExpanded = expandedCategories[category] ?? categoryIssues > 0;
          return (
            <div key={category} className="bg-white rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full bg-gray-50 px-4 py-2.5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">{category}</h3>
                  {categoryIssues > 0 && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{categoryIssues} ⚠</span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
              </button>
              {isExpanded && (
                <div className="divide-y divide-gray-50">
                  {items.map(item => (
                    <div key={item.item} className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="shrink-0">{itemStatusIcons[item.status]}</div>
                        <span className="text-sm text-foreground flex-1">{item.item}</span>
                        {(item.status === 'beschadigd' || item.status === 'ontbreekt') && item.damageAmount > 0 && (
                          <span className="text-xs font-semibold text-red-600">€{item.damageAmount}</span>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          item.status === 'goed' ? 'bg-emerald-50 text-emerald-700' :
                          item.status === 'beschadigd' ? 'bg-amber-50 text-amber-700' :
                          item.status === 'ontbreekt' ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-muted'
                        }`}>
                          {item.status === 'nvt' ? t('borgPage.notAssessed') :
                           item.status === 'goed' ? t('borgPage.inOrder') :
                           item.status === 'beschadigd' ? t('borgPage.damagedLabel') :
                           t('borgPage.missingLabel')}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted mt-1 ml-6 flex items-start gap-1">
                          <MessageSquare size={10} className="mt-0.5 shrink-0" />
                          {item.notes}
                        </p>
                      )}
                      {item.photos && item.photos.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 ml-6 flex-wrap">
                          {item.photos.map((p, pi) => (
                            <img key={pi} src={p} alt="" className="w-14 h-14 rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* General notes from staff */}
        {checklist.general_notes && (
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-foreground mb-1">{t('borgPage.staffNotes')}</h3>
            <p className="text-sm text-muted">{checklist.general_notes}</p>
          </div>
        )}

        {/* Borg info for check-in */}
        {isCheckIn && (
          <div className="rounded-xl p-4 sm:p-5 bg-primary/5 border border-primary/20">
            <h3 className="font-bold text-sm text-foreground mb-3">💳 Borgbetaling</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Borgbedrag</span>
                <span className="font-bold text-lg text-primary">€{borgAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted mt-2">Dit bedrag wordt contant betaald op de camping bij check-in.</p>
            </div>
          </div>
        )}

        {/* Deduction summary (checkout only) */}
        {!isCheckIn && (
        <div className={`rounded-xl p-4 sm:p-5 ${hasDeductions ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
          <h3 className="font-bold text-sm text-foreground mb-3">💳 Borg-afrekening</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Totale borg</span>
              <span className="font-semibold">€{borgAmount.toFixed(2)}</span>
            </div>

            {itemDamageTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-amber-700">Schade inventaris</span>
                <span className="font-semibold text-amber-700">-€{itemDamageTotal.toFixed(2)}</span>
              </div>
            )}

            {extraDamages.length > 0 && extraDamages.map((d, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-amber-700">{d.description || 'Overige schade'}</span>
                <span className="font-semibold text-amber-700">-€{(d.amount || 0).toFixed(2)}</span>
              </div>
            ))}

            {cleaningDed > 0 && (
              <div className="flex justify-between">
                <span className="text-amber-700">Schoonmaak</span>
                <span className="font-semibold text-amber-700">-€{cleaningDed.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
              {totalDed > 0 && (
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">Totaal ingehouden</span>
                  <span className="font-bold text-red-600">€{totalDed.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-bold text-foreground">Terug te ontvangen</span>
                <span className="font-bold text-lg text-emerald-600">€{refund.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Customer response section */}
        {canRespond && (
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">
            {isCheckIn ? (
              <>
                <h3 className="font-bold text-base text-foreground mb-1">Bevestig check-in</h3>
                <p className="text-xs text-muted mb-4">
                  Controleer de inventaris en bevestig de ontvangst met uw handtekening.
                </p>
                <button
                  onClick={() => handleProceedToConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold transition-colors cursor-pointer text-sm"
                >
                  <CheckCircle2 size={14} />
                  Bevestig ontvangst inventaris
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-base text-foreground mb-1">{t('borgPage.yourAssessment')}</h3>
                <p className="text-xs text-muted mb-4">
                  {hasIssues ? t('borgPage.assessmentIssues') : t('borgPage.assessmentOk')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProceedToConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold transition-colors cursor-pointer text-sm"
                  >
                    <ThumbsUp size={14} />
                    {t('borgPage.agreeBtn')}
                  </button>
                  <button
                    onClick={() => handleProceedToConfirm(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold transition-colors cursor-pointer text-sm"
                  >
                    <ThumbsDown size={14} />
                    {t('borgPage.objectBtn')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Already responded */}
        {(checklist.customer_agreed !== null && (checklist.status === 'KLANT_AKKOORD' || checklist.status === 'KLANT_BEZWAAR')) && (
          <div className={`rounded-xl p-4 ${
            checklist.customer_agreed ? 'bg-emerald-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {checklist.customer_agreed ? (
                <ThumbsUp className="text-emerald-600" size={18} />
              ) : (
                <ThumbsDown className="text-red-500" size={18} />
              )}
              <h3 className="font-semibold text-sm">
                {checklist.customer_agreed ? t('borgPage.agreedResponse') : t('borgPage.objectedResponse')}
              </h3>
            </div>
            {checklist.customer_agreed_at && (
              <p className="text-xs text-muted mb-2">
                Op {new Date(checklist.customer_agreed_at).toLocaleString('nl-NL')}
              </p>
            )}
            {checklist.customer_notes && (
              <p className="text-sm text-foreground mt-2 bg-white/50 rounded-lg p-3">
                {checklist.customer_notes}
              </p>
            )}
            {checklist.borg_return_method && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                {checklist.borg_return_method === 'contant' ? <Banknote size={14} className="text-emerald-600" /> : <Building2 size={14} className="text-blue-600" />}
                <span className="font-medium">{t('borgPage.borgReturnMethodLabel')}: {checklist.borg_return_method === 'contant' ? t('borgPage.borgReturnCash') : t('borgPage.borgReturnBank')}</span>
              </div>
            )}
            {checklist.customer_signature && (
              <div className="mt-3 bg-white/50 rounded-lg p-2">
                <p className="text-[10px] text-muted mb-1">{t('borgPage.signatureTitle')}</p>
                <img src={checklist.customer_signature} alt="Signature" className="h-16 object-contain" />
              </div>
            )}
            {checklist.customer_agreed && (
              <p className="text-sm text-emerald-700 mt-3">
                {t('borgPage.borgReturnNote').replace('{amount}', refund.toFixed(2))}
              </p>
            )}
          </div>
        )}

        {/* Print / PDF button */}
        {checklist.status !== 'OPEN' && checklist.status !== 'IN_BEHANDELING' && (
          <div className="text-center print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Printer size={16} />
              Print / PDF
            </button>
          </div>
        )}

        {/* Signature areas (only visible in print) */}
        <div className="hidden print:block bg-white rounded-xl p-6 mt-4">
          <h3 className="font-bold text-sm mb-6">Handtekeningen</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-muted mb-2">Medewerker:</p>
              {checklist.staff_name && <p className="text-xs text-muted">{checklist.staff_name}</p>}
            </div>
            <div>
              <p className="text-xs text-muted mb-2">Klant:</p>
              {checklist.customer_signature ? (
                <img src={checklist.customer_signature} alt="Signature" className="h-16 object-contain" />
              ) : (
                <>
                  <div className="border-b border-gray-300 mb-1 mt-10" />
                </>
              )}
              <p className="text-xs text-muted">{checklist.guest_name}</p>
            </div>
          </div>
          <p className="text-xs text-muted mt-4">Datum: {new Date().toLocaleDateString('nl-NL')}</p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 print:hidden">
          <Link href="/" className="text-sm text-primary">
            {t('borgPage.backToSite')}
          </Link>
          <p className="text-xs text-muted mt-2">
            &copy; {new Date().getFullYear()} Caravanverhuur Costa Brava
          </p>
        </div>
      </div>
    </div>
  );
}
