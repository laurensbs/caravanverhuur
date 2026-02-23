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
  'nvt': <Minus size={16} className="text-gray-400" />,
  'goed': <CheckCircle2 size={16} className="text-green-500" />,
  'beschadigd': <AlertTriangle size={16} className="text-amber-500" />,
  'ontbreekt': <XCircle size={16} className="text-red-500" />,
};

const itemStatusLabels: Record<string, string> = {
  'nvt': 'Niet beoordeeld',
  'goed': 'In orde',
  'beschadigd': 'Beschadigd',
  'ontbreekt': 'Ontbreekt',
};

export default function CustomerBorgPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
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
          setError('Deze borgchecklist is niet gevonden of de link is ongeldig.');
          return;
        }
        const data = await res.json();
        setChecklist(data);
        if (data.customer_notes) setCustomerNotes(data.customer_notes);
      } catch {
        setError('Er is een fout opgetreden bij het ophalen van de checklist.');
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
      alert('Er is een fout opgetreden. Probeer het opnieuw.');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1a1a2e] mb-2">Checklist niet gevonden</h1>
          <p className="text-[#64748b] text-sm mb-6">{error || 'De link is ongeldig of verlopen.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white rounded-xl text-sm font-semibold hover:bg-[#1d4ed8] transition-colors"
          >
            <ArrowLeft size={14} />
            Terug naar website
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#60a5fa] text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
              alt="Logo"
              width={140}
              height={42}
              className="w-28 sm:w-32 h-auto"
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
              <span className="text-white/80 text-sm font-medium">Borgchecklist</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {checklist.type === 'INCHECKEN' ? 'Incheck-inspectie' : 'Uitcheck-inspectie'}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Boeking {checklist.booking_ref} — {checklist.guest_name}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={`rounded-xl p-4 border ${
            checklist.status === 'AFGEROND' ? 'bg-blue-50 border-blue-200' :
            checklist.status === 'KLANT_AKKOORD' ? 'bg-emerald-50 border-emerald-200' :
            checklist.status === 'KLANT_BEZWAAR' ? 'bg-red-50 border-red-200' :
            'bg-yellow-50 border-yellow-200'
          }`}
        >
          <p className="font-semibold text-sm">
            Status: {statusLabels[checklist.status] || checklist.status}
          </p>
          {checklist.status === 'OPEN' || checklist.status === 'IN_BEHANDELING' ? (
            <p className="text-xs text-[#64748b] mt-1">
              De inspectie wordt momenteel uitgevoerd door ons team. U ontvangt een melding wanneer deze klaar is.
            </p>
          ) : checklist.status === 'AFGEROND' && !checklist.customer_agreed ? (
            <p className="text-xs text-[#64748b] mt-1">
              De inspectie is afgerond. Bekijk de resultaten hieronder en geef uw akkoord of dien een bezwaar in.
            </p>
          ) : null}
        </motion.div>

        {/* Booking info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-white rounded-xl border border-[#e2e8f0] p-4"
        >
          <h2 className="font-semibold text-sm text-[#1a1a2e] mb-3">Boekingsgegevens</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-[#64748b]">
              <Hash size={14} /> <span className="text-[#1a1a2e] font-medium">{checklist.booking_ref}</span>
            </div>
            <div className="flex items-center gap-2 text-[#64748b]">
              <User size={14} /> <span>{checklist.guest_name}</span>
            </div>
            <div className="flex items-center gap-2 text-[#64748b]">
              <Car size={14} /> <span>{checklist.caravan_id}</span>
            </div>
            <div className="flex items-center gap-2 text-[#64748b]">
              <Shield size={14} /> <span className="font-medium">&euro;{parseFloat(checklist.borg_amount).toFixed(2)} borg</span>
            </div>
            <div className="flex items-center gap-2 text-[#64748b]">
              <Calendar size={14} /> <span>In: {new Date(checklist.check_in).toLocaleDateString('nl-NL')}</span>
            </div>
            <div className="flex items-center gap-2 text-[#64748b]">
              <Calendar size={14} /> <span>Uit: {new Date(checklist.check_out).toLocaleDateString('nl-NL')}</span>
            </div>
          </div>
          {checklist.staff_name && (
            <p className="text-xs text-[#64748b] mt-3 pt-3 border-t border-[#e2e8f0]">
              Geïnspecteerd door: <span className="font-medium">{checklist.staff_name}</span>
              {checklist.completed_at && (
                <span> op {new Date(checklist.completed_at).toLocaleString('nl-NL')}</span>
              )}
            </p>
          )}
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-green-700">{goedItems}</div>
            <div className="text-[10px] font-medium text-green-600">In orde</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-amber-700">{beschadigdItems}</div>
            <div className="text-[10px] font-medium text-amber-600">Beschadigd</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-red-700">{ontbreektItems}</div>
            <div className="text-[10px] font-medium text-red-600">Ontbreekt</div>
          </div>
        </motion.div>

        {/* Checklist items by category */}
        {Object.entries(categories).map(([category, items], catIdx) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + catIdx * 0.05, duration: 0.4 }}
            className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-2.5 border-b border-[#e2e8f0]">
              <h3 className="font-semibold text-sm text-[#1a1a2e]">{category}</h3>
            </div>
            <div className="divide-y divide-[#f1f5f9]">
              {items.map(item => (
                <div key={item.item} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5">{itemStatusIcons[item.status]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-[#1a1a2e]">{item.item}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'goed' ? 'bg-green-100 text-green-700' :
                        item.status === 'beschadigd' ? 'bg-amber-100 text-amber-700' :
                        item.status === 'ontbreekt' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {itemStatusLabels[item.status]}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-[#64748b] mt-1 flex items-start gap-1">
                        <MessageSquare size={10} className="mt-0.5 shrink-0" />
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* General notes from staff */}
        {checklist.general_notes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-blue-50 rounded-xl border border-blue-200 p-4"
          >
            <h3 className="font-semibold text-sm text-[#1a1a2e] mb-1">Opmerkingen van medewerker</h3>
            <p className="text-sm text-[#64748b]">{checklist.general_notes}</p>
          </motion.div>
        )}

        {/* Customer response section */}
        {canRespond && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="bg-white rounded-xl border-2 border-[#2563eb] p-5"
          >
            <h3 className="font-bold text-lg text-[#1a1a2e] mb-2">Uw beoordeling</h3>
            <p className="text-sm text-[#64748b] mb-4">
              {hasIssues
                ? 'Er zijn punten geconstateerd bij de inspectie. Bekijk de details hierboven. Als u het eens bent met de bevindingen, klik dan op "Akkoord". Bij bezwaar kunt u dit hieronder aangeven.'
                : 'De inspectie is zonder bijzonderheden afgerond. Bevestig uw akkoord hieronder.'
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1a1a2e] mb-1">
                Opmerkingen (optioneel)
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                placeholder="Heeft u opmerkingen over de inspectie? Voeg ze hier toe..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors cursor-pointer disabled:opacity-50 text-sm"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                Akkoord — Ik ga akkoord
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 text-sm"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                Bezwaar indienen
              </button>
            </div>
          </motion.div>
        )}

        {/* Already responded */}
        {(checklist.customer_agreed !== null && (checklist.status === 'KLANT_AKKOORD' || checklist.status === 'KLANT_BEZWAAR')) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`rounded-xl p-5 border ${
              checklist.customer_agreed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {checklist.customer_agreed ? (
                <ThumbsUp className="text-emerald-500" size={20} />
              ) : (
                <ThumbsDown className="text-red-500" size={20} />
              )}
              <h3 className="font-semibold text-lg">
                {checklist.customer_agreed ? 'U bent akkoord gegaan' : 'U heeft bezwaar ingediend'}
              </h3>
            </div>
            {checklist.customer_agreed_at && (
              <p className="text-xs text-[#64748b] mb-2">
                Op {new Date(checklist.customer_agreed_at).toLocaleString('nl-NL')}
              </p>
            )}
            {checklist.customer_notes && (
              <p className="text-sm text-[#1a1a2e] mt-2 bg-white/50 rounded-lg p-3">
                {checklist.customer_notes}
              </p>
            )}
            {checklist.customer_agreed && (
              <p className="text-sm text-emerald-700 mt-3">
                Uw borg van &euro;{parseFloat(checklist.borg_amount).toFixed(2)} wordt na check-out geretourneerd,
                mits de uitcheck-inspectie geen nieuwe schade oplevert.
              </p>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#e2e8f0]">
          <Link href="/" className="text-sm text-[#2563eb] hover:underline">
            ← Terug naar Caravanverhuur Costa Brava
          </Link>
          <p className="text-xs text-[#94a3b8] mt-2">
            &copy; {new Date().getFullYear()} Caravanverhuur Costa Brava
          </p>
        </div>
      </div>
    </div>
  );
}
