'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Clock,
  CreditCard,
  CalendarCheck,
  CalendarX,
  ClipboardCheck,
  MessageCircle,
  Mail,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
type SuggestionData = {
  newBookings: { count: number; items: Array<{ ref: string; guest: string; date: string }> };
  overduePayments: { count: number; totalAmount: number; items: Array<{ ref: string; guest: string; amount: number; type: string; days: number }> };
  upcomingCheckins: { count: number; items: Array<{ ref: string; guest: string; date: string; caravan: string; camping: string }> };
  upcomingCheckouts: { count: number; items: Array<{ ref: string; guest: string; date: string }> };
  pendingBorg: { count: number; items: Array<{ booking_ref: string; guest: string; type: string; status: string }> };
  unansweredContacts: { count: number; items: Array<{ name: string; subject: string; email: string; age_hours: number }> };
  activeChats: { count: number };
  monthlyBookings: number;
  monthlyRevenue: number;
  openPayments: { count: number; total: number };
  overdueRemaining: { count: number; items: Array<{ ref: string; guest: string; remaining: number; check_in: string }> };
  borgDisputes: number;
};

type Suggestion = {
  id: string;
  urgency: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  detail: string;
  count?: number;
  amount?: string;
  href?: string;
  items?: Array<{ label: string; sub: string }>;
  relevantPages: string[];
};

type Props = {
  locale: 'nl' | 'en';
  pathname: string;
  open: boolean;
  onClose: () => void;
};

/* ─── urgency config ─── */
const URGENCY_CONFIG = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: AlertTriangle, dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', icon: Clock, dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icon: AlertCircle, dot: 'bg-blue-500' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, dot: 'bg-emerald-500' },
};

/* ═══════════════════════════════════════════════════
   Build dynamic suggestions from live data
   ═══════════════════════════════════════════════════ */
function buildSuggestions(data: SuggestionData, nl: boolean): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const fmt = (n: number) => `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(nl ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short' }); }
    catch { return d; }
  };

  // 1. Overdue payments (critical)
  if (data.overduePayments.count > 0) {
    suggestions.push({
      id: 'overdue-payments',
      urgency: 'critical',
      title: nl
        ? `${data.overduePayments.count} achterstallige betaling${data.overduePayments.count > 1 ? 'en' : ''}`
        : `${data.overduePayments.count} overdue payment${data.overduePayments.count > 1 ? 's' : ''}`,
      detail: nl
        ? `Totaal ${fmt(data.overduePayments.totalAmount)} openstaand, langer dan 3 dagen. Stuur herinneringen.`
        : `Total ${fmt(data.overduePayments.totalAmount)} outstanding for over 3 days. Send reminders.`,
      count: data.overduePayments.count,
      amount: fmt(data.overduePayments.totalAmount),
      href: '/admin/betalingen',
      items: data.overduePayments.items.slice(0, 5).map(i => ({
        label: `${i.ref} — ${i.guest}`,
        sub: `${fmt(i.amount)} · ${i.days} ${nl ? 'dagen' : 'days'}`,
      })),
      relevantPages: ['/admin', '/admin/betalingen', '/admin/boekingen'],
    });
  }

  // 2. Borg disputes (critical)
  if (data.borgDisputes > 0) {
    suggestions.push({
      id: 'borg-disputes',
      urgency: 'critical',
      title: nl
        ? `${data.borgDisputes} borg bezwaar${data.borgDisputes > 1 ? 'en' : ''}`
        : `${data.borgDisputes} deposit dispute${data.borgDisputes > 1 ? 's' : ''}`,
      detail: nl
        ? 'Klanten hebben bezwaar gemaakt tegen de borginspectie. Behandel deze zo snel mogelijk.'
        : 'Customers have disputed the deposit inspection. Handle these ASAP.',
      count: data.borgDisputes,
      href: '/admin/borg',
      relevantPages: ['/admin', '/admin/borg'],
    });
  }

  // 3. New unprocessed bookings (critical if any)
  if (data.newBookings.count > 0) {
    suggestions.push({
      id: 'new-bookings',
      urgency: data.newBookings.count >= 3 ? 'critical' : 'warning',
      title: nl
        ? `${data.newBookings.count} nieuwe boeking${data.newBookings.count > 1 ? 'en' : ''} wacht${data.newBookings.count === 1 ? '' : 'en'} op bevestiging`
        : `${data.newBookings.count} new booking${data.newBookings.count > 1 ? 's' : ''} awaiting confirmation`,
      detail: nl
        ? 'Bevestig of wijs boekingen toe. Klanten wachten op antwoord.'
        : 'Confirm or assign bookings. Customers are waiting for a response.',
      count: data.newBookings.count,
      href: '/admin/boekingen',
      items: data.newBookings.items.slice(0, 5).map(i => ({
        label: `${i.ref} — ${i.guest}`,
        sub: fmtDate(i.date),
      })),
      relevantPages: ['/admin', '/admin/boekingen', '/admin/planning'],
    });
  }

  // 4. Remaining payments due before check-in (warning)
  if (data.overdueRemaining.count > 0) {
    suggestions.push({
      id: 'remaining-due',
      urgency: 'warning',
      title: nl
        ? `${data.overdueRemaining.count} boeking${data.overdueRemaining.count > 1 ? 'en' : ''} met openstaand restbedrag`
        : `${data.overdueRemaining.count} booking${data.overdueRemaining.count > 1 ? 's' : ''} with remaining balance`,
      detail: nl
        ? 'Check-in komende 7 dagen, maar restbetaling nog niet ontvangen.'
        : 'Check-in within 7 days but remaining payment not yet received.',
      count: data.overdueRemaining.count,
      href: '/admin/betalingen',
      items: data.overdueRemaining.items.slice(0, 5).map(i => ({
        label: `${i.ref} — ${i.guest}`,
        sub: `${fmt(i.remaining)} · check-in ${fmtDate(i.check_in)}`,
      })),
      relevantPages: ['/admin', '/admin/betalingen', '/admin/boekingen'],
    });
  }

  // 5. Unanswered contacts (warning)
  if (data.unansweredContacts.count > 0) {
    suggestions.push({
      id: 'unanswered-contacts',
      urgency: 'warning',
      title: nl
        ? `${data.unansweredContacts.count} onbeantwoord bericht${data.unansweredContacts.count > 1 ? 'en' : ''}`
        : `${data.unansweredContacts.count} unanswered message${data.unansweredContacts.count > 1 ? 's' : ''}`,
      detail: nl
        ? 'Contactberichten ouder dan 24 uur zonder reactie.'
        : 'Contact messages older than 24 hours without a reply.',
      count: data.unansweredContacts.count,
      href: '/admin/berichten',
      items: data.unansweredContacts.items.slice(0, 3).map(i => ({
        label: `${i.name} — ${i.subject || i.email}`,
        sub: `${i.age_hours}h ${nl ? 'geleden' : 'ago'}`,
      })),
      relevantPages: ['/admin', '/admin/berichten'],
    });
  }

  // 6. Active chats (warning)
  if (data.activeChats.count > 0) {
    suggestions.push({
      id: 'active-chats',
      urgency: 'warning',
      title: nl
        ? `${data.activeChats.count} actieve chat${data.activeChats.count > 1 ? 's' : ''}`
        : `${data.activeChats.count} active chat${data.activeChats.count > 1 ? 's' : ''}`,
      detail: nl
        ? 'Live chatgesprekken wachten op een reactie.'
        : 'Live chat conversations waiting for a response.',
      count: data.activeChats.count,
      href: '/admin/chat',
      relevantPages: ['/admin', '/admin/chat'],
    });
  }

  // 7. Pending borg inspections (warning)
  if (data.pendingBorg.count > 0) {
    suggestions.push({
      id: 'pending-borg',
      urgency: 'warning',
      title: nl
        ? `${data.pendingBorg.count} openstaande borginspectie${data.pendingBorg.count > 1 ? 's' : ''}`
        : `${data.pendingBorg.count} pending deposit inspection${data.pendingBorg.count > 1 ? 's' : ''}`,
      detail: nl
        ? 'Deze inspecties moeten afgerond worden voordat de borg geretourneerd kan worden.'
        : 'These inspections must be completed before deposits can be returned.',
      count: data.pendingBorg.count,
      href: '/admin/borg',
      items: data.pendingBorg.items.slice(0, 5).map(i => ({
        label: `${i.booking_ref} — ${i.guest}`,
        sub: i.type === 'UITCHECKEN' ? (nl ? 'Uitcheck' : 'Check-out') : (nl ? 'Incheck' : 'Check-in'),
      })),
      relevantPages: ['/admin', '/admin/borg'],
    });
  }

  // 8. Upcoming check-ins (info)
  if (data.upcomingCheckins.count > 0) {
    suggestions.push({
      id: 'upcoming-checkins',
      urgency: 'info',
      title: nl
        ? `${data.upcomingCheckins.count} aankomst${data.upcomingCheckins.count > 1 ? 'en' : ''} komende 7 dagen`
        : `${data.upcomingCheckins.count} arrival${data.upcomingCheckins.count > 1 ? 's' : ''} in the next 7 days`,
      detail: nl
        ? 'Controleer of alle voorbereidingen klaar zijn: schoonmaak, sleutels, informatie naar gast.'
        : 'Verify all preparations are ready: cleaning, keys, guest information.',
      count: data.upcomingCheckins.count,
      href: '/admin/planning',
      items: data.upcomingCheckins.items.slice(0, 5).map(i => ({
        label: `${i.ref} — ${i.guest}`,
        sub: fmtDate(i.date),
      })),
      relevantPages: ['/admin', '/admin/planning', '/admin/boekingen'],
    });
  }

  // 9. Upcoming check-outs (info)
  if (data.upcomingCheckouts.count > 0) {
    suggestions.push({
      id: 'upcoming-checkouts',
      urgency: 'info',
      title: nl
        ? `${data.upcomingCheckouts.count} vertrek${data.upcomingCheckouts.count > 1 ? 'ken' : ''} komende 7 dagen`
        : `${data.upcomingCheckouts.count} departure${data.upcomingCheckouts.count > 1 ? 's' : ''} in the next 7 days`,
      detail: nl
        ? 'Plan borginspecties en schoonmaak voor vertrekkende gasten.'
        : 'Schedule deposit inspections and cleaning for departing guests.',
      count: data.upcomingCheckouts.count,
      href: '/admin/planning',
      items: data.upcomingCheckouts.items.slice(0, 5).map(i => ({
        label: `${i.ref} — ${i.guest}`,
        sub: fmtDate(i.date),
      })),
      relevantPages: ['/admin', '/admin/planning', '/admin/borg'],
    });
  }

  // 10. Open payments summary (info)
  if (data.openPayments.count > 0) {
    suggestions.push({
      id: 'open-payments-summary',
      urgency: 'info',
      title: nl
        ? `${fmt(data.openPayments.total)} openstaand over ${data.openPayments.count} betaling${data.openPayments.count > 1 ? 'en' : ''}`
        : `${fmt(data.openPayments.total)} outstanding across ${data.openPayments.count} payment${data.openPayments.count > 1 ? 's' : ''}`,
      detail: nl
        ? 'Totaal openstaand bedrag. Bekijk de betalingenpagina voor details.'
        : 'Total outstanding amount. See payments page for details.',
      amount: fmt(data.openPayments.total),
      href: '/admin/betalingen',
      relevantPages: ['/admin', '/admin/betalingen'],
    });
  }

  // 11. Monthly summary (success/info)
  if (data.monthlyRevenue > 0 || data.monthlyBookings > 0) {
    suggestions.push({
      id: 'monthly-summary',
      urgency: 'success',
      title: nl
        ? `Deze maand: ${data.monthlyBookings} boekingen · ${fmt(data.monthlyRevenue)} ontvangen`
        : `This month: ${data.monthlyBookings} bookings · ${fmt(data.monthlyRevenue)} received`,
      detail: nl
        ? 'Maandelijks overzicht van boekingen en ontvangen betalingen.'
        : 'Monthly overview of bookings and received payments.',
      href: '/admin',
      relevantPages: ['/admin', '/admin/betalingen'],
    });
  }

  // 12. All clear!
  if (suggestions.filter(s => s.urgency === 'critical' || s.urgency === 'warning').length === 0) {
    suggestions.push({
      id: 'all-clear',
      urgency: 'success',
      title: nl ? 'Alles op orde!' : 'All clear!',
      detail: nl
        ? 'Geen urgente zaken. Alle boekingen, betalingen en berichten zijn up-to-date.'
        : 'No urgent matters. All bookings, payments, and messages are up-to-date.',
      relevantPages: ['/admin'],
    });
  }

  return suggestions;
}

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export default function AdminAssistant({ locale, pathname, open, onClose }: Props) {
  const [data, setData] = useState<SuggestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'page'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const nl = locale === 'nl';

  // Fetch suggestions data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/suggestions');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on open
  useEffect(() => {
    if (open) {
      fetchData();
      setExpandedId(null);
    }
  }, [open, fetchData]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose]);

  // Build suggestions
  const suggestions = data ? buildSuggestions(data, nl) : [];

  // Filter by current page relevance
  const filtered = filter === 'page'
    ? suggestions.filter(s => s.relevantPages.some(p => pathname.startsWith(p)))
    : suggestions;

  const criticalCount = suggestions.filter(s => s.urgency === 'critical').length;
  const warningCount = suggestions.filter(s => s.urgency === 'warning').length;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="fixed top-14 right-3 sm:right-5 w-[360px] sm:w-[400px] max-h-[calc(100vh-80px)] bg-white rounded-xl shadow-xl border border-border/60 z-[60] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4.5 h-4.5" />
              <span className="font-semibold text-sm">Smart Suggestions</span>
              {criticalCount > 0 && (
                <span className="bg-red-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                  {criticalCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="bg-amber-400/80 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {warningCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                title={nl ? 'Vernieuw' : 'Refresh'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-border/50 shrink-0 bg-gray-50/50">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors cursor-pointer ${
                filter === 'all' ? 'text-violet-700 border-b-2 border-violet-600' : 'text-muted hover:text-foreground'
              }`}
            >
              {nl ? 'Alles' : 'All'} ({suggestions.length})
            </button>
            <button
              onClick={() => setFilter('page')}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors cursor-pointer ${
                filter === 'page' ? 'text-violet-700 border-b-2 border-violet-600' : 'text-muted hover:text-foreground'
              }`}
            >
              {nl ? 'Deze pagina' : 'This page'} ({suggestions.filter(s => s.relevantPages.some(p => pathname.startsWith(p))).length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading && !data && (
              <div className="flex items-center justify-center gap-2 py-12 text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">{nl ? 'Laden...' : 'Loading...'}</span>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-xs text-red-600">
                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                {nl ? 'Kon suggesties niet laden.' : 'Could not load suggestions.'}
                <button onClick={fetchData} className="block mx-auto mt-2 text-violet-600 underline cursor-pointer">
                  {nl ? 'Opnieuw proberen' : 'Retry'}
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="p-6 text-center text-xs text-muted">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                {nl ? 'Geen suggesties voor deze pagina.' : 'No suggestions for this page.'}
              </div>
            )}

            {!error && filtered.length > 0 && (
              <div className="p-2.5 space-y-1.5">
                {filtered.map((s) => {
                  const cfg = URGENCY_CONFIG[s.urgency];
                  const Icon = cfg.icon;
                  const isExpanded = expandedId === s.id;
                  const hasDetails = s.items && s.items.length > 0;

                  return (
                    <div key={s.id} className={`rounded-lg border ${cfg.border} ${cfg.bg} transition-all`}>
                      <button
                        onClick={() => hasDetails ? setExpandedId(isExpanded ? null : s.id) : undefined}
                        className={`w-full text-left p-2.5 ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 shrink-0 ${cfg.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${cfg.text} leading-tight`}>
                                {s.title}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-foreground/60 leading-relaxed">
                              {s.detail}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 mt-0.5">
                            {s.href && (
                              <Link
                                href={s.href}
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className={`p-1 rounded hover:bg-white/60 transition-colors ${cfg.text}`}
                                title={nl ? 'Ga naar' : 'Go to'}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                            {hasDetails && (
                              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail items */}
                      <AnimatePresence>
                        {isExpanded && s.items && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="px-2.5 pb-2.5 pt-0">
                              <div className="bg-white/60 rounded-md border border-white/80 divide-y divide-border/30">
                                {s.items.map((item, j) => (
                                  <div key={j} className="px-2.5 py-1.5 flex items-center justify-between">
                                    <span className="text-[11px] font-medium text-foreground/80 truncate">{item.label}</span>
                                    <span className="text-[10px] text-muted shrink-0 ml-2">{item.sub}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer: last update + stats */}
          {data && !error && (
            <div className="px-3 py-2 border-t border-border/40 bg-gray-50/50 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-muted">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {nl ? 'Deze maand' : 'This month'}: {data.monthlyBookings} {nl ? 'boekingen' : 'bookings'}
                </span>
              </div>
              {loading && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
