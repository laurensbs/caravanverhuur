'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  Calendar,
  Car,
  User,
  Hash,
  MessageSquare,
  Loader2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

interface BorgItem {
  category: string;
  item: string;
  status: 'nvt' | 'goed' | 'beschadigd' | 'ontbreekt';
  notes: string;
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
}

const statusLabels: Record<string, string> = {
  'OPEN': 'In voorbereiding',
  'IN_BEHANDELING': 'Wordt ingevuld',
  'AFGEROND': 'Klaar voor uw beoordeling',
  'KLANT_AKKOORD': 'U bent akkoord',
  'KLANT_BEZWAAR': 'Bezwaar ingediend',
};

const itemStatusIcons: Record<string, React.ReactNode> = {
  'nvt': <Minus size={16} className="text-muted" />,
  'goed': <CheckCircle2 size={16} className="text-primary" />,
  'beschadigd': <AlertTriangle size={16} className="text-primary" />,
  'ontbreekt': <XCircle size={16} className="text-danger" />,
};

const itemStatusLabels: Record<string, string> = {
  'nvt': 'N/A',
  'goed': 'OK',
  'beschadigd': 'Damaged',
  'ontbreekt': 'Missing',
};

export default function CustomerBorgPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { t } = useLanguage();
  const [checklist, setChecklist] = useState<BorgChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (agreed: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/borg/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed, notes: customerNotes || undefined }),
      });
      if (res.ok) {
        setSubmitted(true);
        setChecklist(prev => prev ? {
          ...prev,
          customer_agreed: agreed,
          customer_notes: customerNotes,
          status: agreed ? 'KLANT_AKKOORD' : 'KLANT_BEZWAAR',
        } : null);
      }
    } catch {
      alert(t('borgPage.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-primary-dark-light text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={240}
              height={70}
              className="w-40 sm:w-48 h-auto brightness-0 invert"
              unoptimized
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
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
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6"> {/* Status banner */} <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className={`rounded-xl p-4 ${ checklist.status === 'AFGEROND' ? 'bg-primary-50 border-primary' : checklist.status === 'KLANT_AKKOORD' ? 'bg-primary-50 border-primary' : checklist.status === 'KLANT_BEZWAAR' ? 'bg-danger/5 border-danger/30' : 'bg-primary-50 border-primary-light' }`} > <p className="font-semibold text-sm">
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
        </motion.div>

        {/* Booking info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-white rounded-xl p-4"
        >
          <h2 className="font-semibold text-sm text-foreground mb-3">{t('borgPage.bookingDetails')}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted">
              <Hash size={14} /> <span className="text-foreground font-medium">{checklist.booking_ref}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <User size={14} /> <span>{checklist.guest_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Car size={14} /> <span>{checklist.caravan_id}</span>
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
            <p className="text-xs text-muted mt-3 pt-3">
              {t('borgPage.inspectedBy')} <span className="font-medium">{checklist.staff_name}</span>
              {checklist.completed_at && (
                <span> {t('borgPage.on')} {new Date(checklist.completed_at).toLocaleString('nl-NL')}</span> )} </p> )} </motion.div> {/* Summary */} <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="grid grid-cols-3 gap-3" > <div className="bg-primary-50 rounded-xl p-4 text-center border-primary-100"> <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1" /> <div className="text-xl font-bold text-primary-dark">{goedItems}</div> <div className="text-xs font-medium text-primary">{t('borgPage.inOrder')}</div> </div> <div className="bg-primary-50 rounded-xl p-4 text-center border-primary-light"> <AlertTriangle className="w-6 h-6 text-primary mx-auto mb-1" /> <div className="text-xl font-bold text-primary">{beschadigdItems}</div> <div className="text-xs font-medium text-primary">{t('borgPage.damagedLabel')}</div> </div> <div className="bg-danger/5 rounded-xl p-4 text-center border-danger/20"> <XCircle className="w-6 h-6 text-danger mx-auto mb-1" /> <div className="text-xl font-bold text-danger">{ontbreektItems}</div> <div className="text-xs font-medium text-danger">{t('borgPage.missingLabel')}</div> </div> </motion.div> {/* Checklist items by category */} {Object.entries(categories).map(([category, items], catIdx) => ( <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + catIdx * 0.05, duration: 0.4 }} className="bg-white rounded-xl overflow-hidden" > <div className="bg-surface px-4 py-2.5"> <h3 className="font-semibold text-sm text-foreground">{category}</h3> </div> <div className=""> {items.map(item => ( <div key={item.item} className="flex items-start gap-3 px-4 py-3"> <div className="mt-0.5">{itemStatusIcons[item.status]}</div> <div className="flex-1 min-w-0"> <div className="flex items-center gap-2 flex-wrap"> <span className="text-sm text-foreground">{item.item}</span> <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ item.status ==='goed' ? 'bg-primary-100 text-primary-dark' :
                        item.status === 'beschadigd' ? 'bg-primary-100 text-primary' :
                        item.status === 'ontbreekt' ? 'bg-danger/10 text-danger' :
                        'bg-surface-alt text-muted'
                      }`}> { item.status === 'nvt' ? t('borgPage.notAssessed') : item.status === 'goed' ? t('borgPage.inOrder') : item.status === 'beschadigd' ? t('borgPage.damagedLabel') : item.status === 'ontbreekt' ? t('borgPage.missingLabel') : itemStatusLabels[item.status] } </span> </div> {item.notes && ( <p className="text-xs text-muted mt-1 flex items-start gap-1"> <MessageSquare size={10} className="mt-0.5 shrink-0" /> {item.notes} </p> )} </div> </div> ))} </div> </motion.div> ))} {/* General notes from staff */} {checklist.general_notes && ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="bg-primary-50 rounded-xl border-primary p-4" > <h3 className="font-semibold text-sm text-foreground mb-1">{t('borgPage.staffNotes')}</h3> <p className="text-sm text-muted">{checklist.general_notes}</p> </motion.div> )} {/* Customer response section */} {canRespond && ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }} className="bg-white rounded-xl border-primary p-5" > <h3 className="font-bold text-lg text-foreground mb-2">{t('borgPage.yourAssessment')}</h3> <p className="text-sm text-muted mb-4"> {hasIssues ? t('borgPage.assessmentIssues') : t('borgPage.assessmentOk') } </p> <div className="mb-4"> <label className="block text-sm font-medium text-foreground mb-1"> {t('borgPage.commentsOptional')} </label> <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10" placeholder={t('borgPage.commentsPlaceholder')} /> </div> <div className="flex flex-col sm:flex-row gap-3"> <button onClick={() => handleSubmit(true)} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 text-sm" > {submitting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />} {t('borgPage.agreeBtn')} </button> <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-danger text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 text-sm" > {submitting ? <Loader2 size={16} className="animate-spin"/> : <ThumbsDown size={16} />} {t('borgPage.objectBtn')} </button> </div> </motion.div> )} {/* Already responded */} {(checklist.customer_agreed !== null && (checklist.status === 'KLANT_AKKOORD' || checklist.status === 'KLANT_BEZWAAR')) && ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className={`rounded-xl p-5 ${ checklist.customer_agreed ? 'bg-primary-50 border-primary' : 'bg-danger/5 border-danger/30' }`} > <div className="flex items-center gap-2 mb-2">
              {checklist.customer_agreed ? (
                <ThumbsUp className="text-primary" size={20} />
              ) : (
                <ThumbsDown className="text-danger" size={20} />
              )}
              <h3 className="font-semibold text-lg">
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
            {checklist.customer_agreed && (
              <p className="text-sm text-primary-dark mt-3">
                {t('borgPage.borgReturnNote').replace('{amount}', parseFloat(checklist.borg_amount).toFixed(2))}
              </p>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
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
