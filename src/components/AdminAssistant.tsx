'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Users,
  Truck,
  Car,
  ClipboardList,
  Banknote,
  CircleDot,
  FileWarning,
  Send,
  BarChart3,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyItem = Record<string, any>;

type CountItems = { count: number; items: AnyItem[] };

type SuggestionData = {
  newBookings: CountItems;
  overduePayments: CountItems & { totalAmount: number };
  upcomingCheckins: CountItems;
  upcomingCheckouts: CountItems;
  pendingBorg: CountItems;
  unansweredContacts: CountItems;
  activeChats: CountItems;
  monthlyBookings: number;
  monthlyRevenue: number;
  openPayments: { count: number; total: number };
  overdueRemaining: CountItems;
  borgDisputes: CountItems;
  incompleteBookings: CountItems;
  pendingTasks: CountItems;
  noBorgSent: CountItems;
  activeBookings: CountItems;
  todayCheckins: CountItems;
  todayCheckouts: CountItems;
};

type ActionItem = {
  label: string;
  sub?: string;
  href: string;
  paymentId?: string;
  email?: string;
};

type Suggestion = {
  id: string;
  urgency: 'critical' | 'warning' | 'info' | 'success';
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  items?: ActionItem[];
};

type Props = {
  locale: 'nl' | 'en';
  pathname: string;
  open: boolean;
  onClose: () => void;
};

/* ─── urgency config ─── */
const U = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', btnBg: 'bg-red-600 hover:bg-red-700', dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', btnBg: 'bg-amber-600 hover:bg-amber-700', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', btnBg: 'bg-blue-600 hover:bg-blue-700', dot: 'bg-blue-500' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', btnBg: 'bg-emerald-600 hover:bg-emerald-700', dot: 'bg-emerald-500' },
};

const fmt = (n: number) => `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string, nl: boolean) => {
  try {
    const date = new Date(d);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return nl ? 'Vandaag' : 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return nl ? 'Morgen' : 'Tomorrow';
    return date.toLocaleDateString(nl ? 'nl-NL' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return d; }
};

const TASK_LABELS_NL: Record<string, string> = { PREP: 'Voorbereiding', TRANSPORT: 'Transport', SETUP: 'Opbouw', CHECKIN: 'Incheck', CHECKOUT: 'Uitcheck', PICKUP: 'Ophalen', CLEANING: 'Schoonmaak', INSPECTION: 'Inspectie' };
const TASK_LABELS_EN: Record<string, string> = { PREP: 'Preparation', TRANSPORT: 'Transport', SETUP: 'Setup', CHECKIN: 'Check-in', CHECKOUT: 'Check-out', PICKUP: 'Pickup', CLEANING: 'Cleaning', INSPECTION: 'Inspection' };
const MISSING_NL: Record<string, string> = { caravan: 'Geen caravan', camping: 'Geen camping', email: 'Geen e-mail', prijs: 'Geen prijs' };
const MISSING_EN: Record<string, string> = { caravan: 'No caravan', camping: 'No campsite', email: 'No email', prijs: 'No price' };

/* ═══════════════════════════════════════════════════
   Build suggestions from live data
   ═══════════════════════════════════════════════════ */
function buildSuggestions(data: SuggestionData, nl: boolean): Suggestion[] {
  const s: Suggestion[] = [];
  const taskLabels = nl ? TASK_LABELS_NL : TASK_LABELS_EN;
  const missingLabels = nl ? MISSING_NL : MISSING_EN;

  // ── TODAY's check-ins ──
  if (data.todayCheckins.count > 0) {
    s.push({
      id: 'today-checkins', urgency: 'critical', icon: CalendarCheck,
      title: nl ? `${data.todayCheckins.count} aankomst${data.todayCheckins.count > 1 ? 'en' : ''} vandaag` : `${data.todayCheckins.count} arrival${data.todayCheckins.count > 1 ? 's' : ''} today`,
      detail: nl ? 'Gasten komen vandaag aan. Zorg dat alles klaar staat.' : 'Guests arriving today. Make sure everything is ready.',
      href: '/admin/planning', actionLabel: nl ? 'Bekijk planning' : 'View planning',
      items: data.todayCheckins.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: i.caravan || '', href: `/admin/boekingen` })),
    });
  }

  // ── TODAY's check-outs ──
  if (data.todayCheckouts.count > 0) {
    s.push({
      id: 'today-checkouts', urgency: 'critical', icon: CalendarX,
      title: nl ? `${data.todayCheckouts.count} vertrek${data.todayCheckouts.count > 1 ? 'ken' : ''} vandaag` : `${data.todayCheckouts.count} departure${data.todayCheckouts.count > 1 ? 's' : ''} today`,
      detail: nl ? 'Plan borginspectie en schoonmaak voor vertrekkende gasten.' : 'Schedule deposit inspection and cleaning for departing guests.',
      href: '/admin/borg', actionLabel: nl ? 'Naar borginspecties' : 'Go to inspections',
      items: data.todayCheckouts.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, href: `/admin/boekingen` })),
    });
  }

  // ── Overdue payments ──
  if (data.overduePayments.count > 0) {
    s.push({
      id: 'overdue-payments', urgency: 'critical', icon: Banknote,
      title: nl ? `${fmt(data.overduePayments.totalAmount)} achterstallig` : `${fmt(data.overduePayments.totalAmount)} overdue`,
      detail: nl ? `${data.overduePayments.count} betaling${data.overduePayments.count > 1 ? 'en' : ''} > 3 dagen openstaand. Stuur herinneringen.` : `${data.overduePayments.count} payment${data.overduePayments.count > 1 ? 's' : ''} > 3 days overdue. Send reminders.`,
      href: '/admin/betalingen', actionLabel: nl ? 'Herinneringen sturen' : 'Send reminders',
      items: data.overduePayments.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: `${fmt(i.amount)} · ${i.days}d`, href: `/admin/betalingen`, paymentId: i.payment_id, email: i.email })),
    });
  }

  // ── Borg disputes ──
  if (data.borgDisputes.count > 0) {
    s.push({
      id: 'borg-disputes', urgency: 'critical', icon: ShieldAlert,
      title: nl ? `${data.borgDisputes.count} borg bezwaar${data.borgDisputes.count > 1 ? 'en' : ''}` : `${data.borgDisputes.count} deposit dispute${data.borgDisputes.count > 1 ? 's' : ''}`,
      detail: nl ? 'Klant(en) hebben bezwaar gemaakt. Bekijk en behandel direct.' : 'Customer(s) disputed inspection. Review and handle immediately.',
      href: '/admin/borg', actionLabel: nl ? 'Bezwaren bekijken' : 'View disputes',
      items: data.borgDisputes.items.slice(0, 5).map(i => ({ label: `${i.booking_ref} — ${i.guest}`, sub: i.notes ? `"${(i.notes as string).slice(0, 40)}..."` : '', href: `/admin/borg` })),
    });
  }

  // ── New bookings ──
  if (data.newBookings.count > 0) {
    s.push({
      id: 'new-bookings', urgency: data.newBookings.count >= 3 ? 'critical' : 'warning', icon: ClipboardList,
      title: nl ? `${data.newBookings.count} nieuwe boeking${data.newBookings.count > 1 ? 'en' : ''}` : `${data.newBookings.count} new booking${data.newBookings.count > 1 ? 's' : ''}`,
      detail: nl ? 'Wachtend op bevestiging. Controleer gegevens en bevestig.' : 'Awaiting confirmation. Check details and confirm.',
      href: '/admin/boekingen', actionLabel: nl ? 'Boekingen bekijken' : 'View bookings',
      items: data.newBookings.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: `${fmtDate(i.date, nl)} · ${fmt(i.total || 0)}`, href: `/admin/boekingen` })),
    });
  }

  // ── Remaining payments before check-in ──
  if (data.overdueRemaining.count > 0) {
    s.push({
      id: 'remaining-due', urgency: 'warning', icon: CreditCard,
      title: nl ? `${data.overdueRemaining.count} restbetaling${data.overdueRemaining.count > 1 ? 'en' : ''} nog open` : `${data.overdueRemaining.count} remaining payment${data.overdueRemaining.count > 1 ? 's' : ''} due`,
      detail: nl ? 'Check-in binnen 7 dagen maar restbedrag niet ontvangen.' : 'Check-in within 7 days but balance not received.',
      href: '/admin/betalingen', actionLabel: nl ? 'Betalingen bekijken' : 'View payments',
      items: data.overdueRemaining.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: `${fmt(i.remaining)} · ${fmtDate(i.check_in, nl)}`, href: `/admin/betalingen` })),
    });
  }

  // ── Incomplete bookings ──
  if (data.incompleteBookings.count > 0) {
    s.push({
      id: 'incomplete', urgency: 'warning', icon: FileWarning,
      title: nl ? `${data.incompleteBookings.count} onvolledige boeking${data.incompleteBookings.count > 1 ? 'en' : ''}` : `${data.incompleteBookings.count} incomplete booking${data.incompleteBookings.count > 1 ? 's' : ''}`,
      detail: nl ? 'Boekingen missen belangrijke gegevens (caravan, camping, e-mail of prijs).' : 'Bookings missing key data (caravan, campsite, email or price).',
      href: '/admin/boekingen', actionLabel: nl ? 'Aanvullen' : 'Complete',
      items: data.incompleteBookings.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: missingLabels[i.missing] || i.missing, href: `/admin/boekingen` })),
    });
  }

  // ── Pending tasks ──
  if (data.pendingTasks.count > 0) {
    s.push({
      id: 'pending-tasks', urgency: 'warning', icon: Truck,
      title: nl ? `${data.pendingTasks.count} openstaande ${data.pendingTasks.count > 1 ? 'taken' : 'taak'}` : `${data.pendingTasks.count} pending task${data.pendingTasks.count > 1 ? 's' : ''}`,
      detail: nl ? 'Transport, schoonmaak of voorbereidingstaken die nog gedaan moeten worden.' : 'Transport, cleaning or preparation tasks that need to be done.',
      href: '/admin/planning', actionLabel: nl ? 'Taken bekijken' : 'View tasks',
      items: data.pendingTasks.items.slice(0, 5).map(i => ({
        label: `${taskLabels[i.type] || i.type} — ${i.ref}`,
        sub: i.assigned ? i.assigned : (nl ? 'Niet toegewezen' : 'Unassigned'),
        href: `/admin/planning`,
      })),
    });
  }

  // ── Unanswered contacts ──
  if (data.unansweredContacts.count > 0) {
    s.push({
      id: 'unanswered', urgency: 'warning', icon: Mail,
      title: nl ? `${data.unansweredContacts.count} onbeantwoord${data.unansweredContacts.count > 1 ? 'e berichten' : ' bericht'}` : `${data.unansweredContacts.count} unanswered message${data.unansweredContacts.count > 1 ? 's' : ''}`,
      detail: nl ? 'Ouder dan 24 uur zonder reactie.' : 'Over 24 hours without a reply.',
      href: '/admin/berichten', actionLabel: nl ? 'Beantwoorden' : 'Reply',
      items: data.unansweredContacts.items.slice(0, 3).map(i => ({ label: `${i.name}`, sub: `${i.age_hours}h — ${i.subject || i.email}`, href: `/admin/berichten` })),
    });
  }

  // ── Active chats ──
  if (data.activeChats.count > 0) {
    s.push({
      id: 'chats', urgency: 'warning', icon: MessageCircle,
      title: nl ? `${data.activeChats.count} actieve chat${data.activeChats.count > 1 ? 's' : ''}` : `${data.activeChats.count} active chat${data.activeChats.count > 1 ? 's' : ''}`,
      detail: nl ? 'Bezoekers wachten op antwoord in de live chat.' : 'Visitors waiting for a reply in live chat.',
      href: '/admin/chat', actionLabel: nl ? 'Chat openen' : 'Open chat',
      items: data.activeChats.items?.slice(0, 3).map(i => ({ label: i.visitor, sub: i.needs_human ? (nl ? 'Vraagt om medewerker' : 'Needs human') : '', href: `/admin/chat` })),
    });
  }

  // ── Pending borg inspections ──
  if (data.pendingBorg.count > 0) {
    s.push({
      id: 'pending-borg', urgency: 'warning', icon: ClipboardCheck,
      title: nl ? `${data.pendingBorg.count} borginspectie${data.pendingBorg.count > 1 ? 's' : ''} open` : `${data.pendingBorg.count} deposit inspection${data.pendingBorg.count > 1 ? 's' : ''} open`,
      detail: nl ? 'Rond inspecties af zodat borg geretourneerd kan worden.' : 'Complete inspections so deposits can be returned.',
      href: '/admin/borg', actionLabel: nl ? 'Inspecties bekijken' : 'View inspections',
      items: data.pendingBorg.items.slice(0, 5).map(i => ({ label: `${i.booking_ref} — ${i.guest}`, sub: i.type === 'UITCHECKEN' ? (nl ? 'Uitcheck' : 'Check-out') : (nl ? 'Incheck' : 'Check-in'), href: `/admin/borg` })),
    });
  }

  // ── No borg sent for upcoming arrivals ──
  if (data.noBorgSent.count > 0) {
    s.push({
      id: 'no-borg', urgency: 'warning', icon: Send,
      title: nl ? `${data.noBorgSent.count} aankomst${data.noBorgSent.count > 1 ? 'en' : ''} zonder borgformulier` : `${data.noBorgSent.count} arrival${data.noBorgSent.count > 1 ? 's' : ''} without deposit form`,
      detail: nl ? 'Stuur borgformulier naar gasten vóór aankomst.' : 'Send deposit form to guests before arrival.',
      href: '/admin/borg', actionLabel: nl ? 'Borgformulieren versturen' : 'Send deposit forms',
      items: data.noBorgSent.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: fmtDate(i.date, nl), href: `/admin/boekingen` })),
    });
  }

  // ── Upcoming check-ins ──
  if (data.upcomingCheckins.count > 0) {
    s.push({
      id: 'checkins', urgency: 'info', icon: CalendarCheck,
      title: nl ? `${data.upcomingCheckins.count} aankomst${data.upcomingCheckins.count > 1 ? 'en' : ''} komende 7 dagen` : `${data.upcomingCheckins.count} arrival${data.upcomingCheckins.count > 1 ? 's' : ''} next 7 days`,
      detail: nl ? 'Controleer voorbereidingen: caravan, schoonmaak, sleutels, gastinfo.' : 'Check preparations: caravan, cleaning, keys, guest info.',
      href: '/admin/planning', actionLabel: nl ? 'Planning bekijken' : 'View planning',
      items: data.upcomingCheckins.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: `${fmtDate(i.date, nl)} · ${i.caravan || ''}`, href: `/admin/boekingen` })),
    });
  }

  // ── Upcoming check-outs ──
  if (data.upcomingCheckouts.count > 0) {
    s.push({
      id: 'checkouts', urgency: 'info', icon: CalendarX,
      title: nl ? `${data.upcomingCheckouts.count} vertrek${data.upcomingCheckouts.count > 1 ? 'ken' : ''} komende 7 dagen` : `${data.upcomingCheckouts.count} departure${data.upcomingCheckouts.count > 1 ? 's' : ''} next 7 days`,
      detail: nl ? 'Plan borginspecties en schoonmaak.' : 'Schedule inspections and cleaning.',
      href: '/admin/planning', actionLabel: nl ? 'Planning bekijken' : 'View planning',
      items: data.upcomingCheckouts.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: fmtDate(i.date, nl), href: `/admin/boekingen` })),
    });
  }

  // ── Active stays ──
  if (data.activeBookings.count > 0) {
    s.push({
      id: 'active-stays', urgency: 'info', icon: Car,
      title: nl ? `${data.activeBookings.count} gast${data.activeBookings.count > 1 ? 'en' : ''} momenteel op locatie` : `${data.activeBookings.count} guest${data.activeBookings.count > 1 ? 's' : ''} currently on site`,
      detail: nl ? 'Actieve verblijven op dit moment.' : 'Active stays right now.',
      href: '/admin/planning', actionLabel: nl ? 'Planning bekijken' : 'View planning',
      items: data.activeBookings.items.slice(0, 5).map(i => ({ label: `${i.ref} — ${i.guest}`, sub: `${nl ? 'Vertrek' : 'Checkout'} ${fmtDate(i.checkout, nl)}`, href: `/admin/boekingen` })),
    });
  }

  // ── Open payments ──
  if (data.openPayments.count > 0) {
    s.push({
      id: 'open-payments', urgency: 'info', icon: CreditCard,
      title: nl ? `${fmt(data.openPayments.total)} openstaand` : `${fmt(data.openPayments.total)} outstanding`,
      detail: nl ? `Verdeeld over ${data.openPayments.count} betaling${data.openPayments.count > 1 ? 'en' : ''}.` : `Across ${data.openPayments.count} payment${data.openPayments.count > 1 ? 's' : ''}.`,
      href: '/admin/betalingen', actionLabel: nl ? 'Naar betalingen' : 'Go to payments',
    });
  }

  // ── Monthly summary ──
  if (data.monthlyRevenue > 0 || data.monthlyBookings > 0) {
    s.push({
      id: 'monthly', urgency: 'success', icon: BarChart3,
      title: nl ? `${data.monthlyBookings} boekingen · ${fmt(data.monthlyRevenue)} ontvangen` : `${data.monthlyBookings} bookings · ${fmt(data.monthlyRevenue)} received`,
      detail: nl ? `Overzicht van deze maand.` : `This month's overview.`,
      href: '/admin', actionLabel: nl ? 'Dashboard bekijken' : 'View dashboard',
    });
  }

  // ── All clear ──
  if (s.filter(x => x.urgency === 'critical' || x.urgency === 'warning').length === 0) {
    s.push({
      id: 'all-clear', urgency: 'success', icon: CheckCircle2,
      title: nl ? 'Alles onder controle!' : 'Everything under control!',
      detail: nl ? 'Geen urgente zaken. Boekingen, betalingen en berichten zijn up-to-date.' : 'No urgent matters. Bookings, payments and messages are up to date.',
      href: '/admin', actionLabel: nl ? 'Naar dashboard' : 'Go to dashboard',
    });
  }

  return s;
}

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export default function AdminAssistant({ locale, pathname, open, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = useState<SuggestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState<string | null>(null);
  const [paymentLinkResult, setPaymentLinkResult] = useState<Record<string, { url?: string; error?: string }>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const nl = locale === 'nl';

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

  useEffect(() => {
    if (open) { fetchData(); setExpandedId(null); setPaymentLinkResult({}); setPaymentLinkLoading(null); }
  }, [open, fetchData]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [open, onClose]);

  const navigate = (href: string) => { router.push(href); onClose(); };

  const createPaymentLink = async (paymentId: string) => {
    setPaymentLinkLoading(paymentId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setPaymentLinkResult(prev => ({ ...prev, [paymentId]: { url } }));
      // Copy to clipboard
      if (url) await navigator.clipboard.writeText(url).catch(() => {});
    } catch {
      setPaymentLinkResult(prev => ({ ...prev, [paymentId]: { error: nl ? 'Fout bij aanmaken' : 'Failed to create' } }));
    } finally {
      setPaymentLinkLoading(null);
    }
  };

  const sendReminder = async (paymentId: string) => {
    setPaymentLinkLoading(paymentId);
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, action: 'send-reminder' }),
      });
      if (!res.ok) throw new Error();
      setPaymentLinkResult(prev => ({ ...prev, [paymentId]: { url: '__reminder_sent__' } }));
    } catch {
      setPaymentLinkResult(prev => ({ ...prev, [paymentId]: { error: nl ? 'Fout bij versturen' : 'Failed to send' } }));
    } finally {
      setPaymentLinkLoading(null);
    }
  };

  const suggestions = data ? buildSuggestions(data, nl) : [];
  const criticalCount = suggestions.filter(x => x.urgency === 'critical').length;
  const warningCount = suggestions.filter(x => x.urgency === 'warning').length;

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
          className="fixed top-14 right-3 sm:right-5 w-[370px] sm:w-[420px] max-h-[calc(100vh-80px)] bg-white rounded-xl shadow-2xl border border-border/60 z-[60] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <CircleDot className="w-4 h-4" />
              <span className="font-semibold text-sm">Smart Suggestions</span>
              {criticalCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">{criticalCount}</span>
              )}
              {warningCount > 0 && (
                <span className="bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{warningCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={fetchData} disabled={loading} className="p-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer disabled:opacity-50" title={nl ? 'Vernieuwen' : 'Refresh'}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Summary bar */}
          {data && !error && (
            <div className="px-4 py-2 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-border/30 flex items-center gap-4 text-[10px] text-muted shrink-0">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-violet-500" />{fmt(data.monthlyRevenue)} {nl ? 'deze maand' : 'this month'}</span>
              <span>{data.monthlyBookings} {nl ? 'boekingen' : 'bookings'}</span>
              {data.activeBookings.count > 0 && <span className="text-emerald-600 font-medium">{data.activeBookings.count} {nl ? 'actief' : 'active'}</span>}
              {loading && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading && !data && (
              <div className="flex items-center justify-center gap-2 py-12 text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">{nl ? 'Analyseren...' : 'Analyzing...'}</span>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-xs text-red-600">
                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                {nl ? 'Kon suggesties niet laden.' : 'Could not load suggestions.'}
                <button onClick={fetchData} className="block mx-auto mt-2 text-violet-600 underline cursor-pointer">{nl ? 'Opnieuw' : 'Retry'}</button>
              </div>
            )}

            {!error && suggestions.length > 0 && (
              <div className="p-2.5 space-y-2">
                {suggestions.map((sg) => {
                  const cfg = U[sg.urgency];
                  const Icon = sg.icon;
                  const isExpanded = expandedId === sg.id;
                  const hasItems = sg.items && sg.items.length > 0;

                  return (
                    <div key={sg.id} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
                      {/* Main suggestion row */}
                      <div className="p-3" role="button" tabIndex={0} onClick={() => hasItems ? setExpandedId(isExpanded ? null : sg.id) : navigate(sg.href)} onKeyDown={(e) => e.key === 'Enter' && (hasItems ? setExpandedId(isExpanded ? null : sg.id) : navigate(sg.href))} className-extra="cursor-pointer">
                        <div className="flex items-start gap-2.5 cursor-pointer">
                          <div className={`mt-0.5 shrink-0 ${cfg.text}`}><Icon className="w-4 h-4" /></div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold ${cfg.text} leading-tight block`}>{sg.title}</span>
                            <p className="mt-0.5 text-[11px] text-foreground/55 leading-relaxed">{sg.detail}</p>
                          </div>
                          {hasItems ? (
                            <ChevronDown className={`w-4 h-4 ${cfg.text} shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          ) : (
                            <ArrowRight className={`w-3.5 h-3.5 ${cfg.text} shrink-0 mt-0.5`} />
                          )}
                        </div>
                      </div>

                      {/* Expanded items — each individually clickable */}
                      <AnimatePresence>
                        {isExpanded && sg.items && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                            <div className="px-3 pb-2 space-y-1">
                              {sg.items.map((item, j) => {
                                const pid = item.paymentId;
                                const result = pid ? paymentLinkResult[pid] : null;
                                const isLoading = pid ? paymentLinkLoading === pid : false;
                                const hasPaymentActions = !!pid && (sg.id === 'overdue-payments' || sg.id === 'remaining-due');

                                return (
                                  <div key={j} className="rounded-lg bg-white/70 border border-white/80 hover:border-border/40 transition-all">
                                    <button onClick={() => navigate(item.href)} className="w-full flex items-center gap-2 px-2.5 py-2 cursor-pointer group text-left">
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[11px] font-medium text-foreground/80 block truncate">{item.label}</span>
                                        {item.sub && <span className="text-[10px] text-muted">{item.sub}</span>}
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                    {hasPaymentActions && (
                                      <div className="px-2.5 pb-2 flex items-center gap-1.5">
                                        {result?.url && result.url !== '__reminder_sent__' ? (
                                          <div className="flex items-center gap-1.5 w-full">
                                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" />{nl ? 'Link gekopieerd!' : 'Link copied!'}</span>
                                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-violet-600 hover:text-violet-700 flex items-center gap-0.5">
                                              <ExternalLink className="w-3 h-3" />{nl ? 'Openen' : 'Open'}
                                            </a>
                                          </div>
                                        ) : result?.url === '__reminder_sent__' ? (
                                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" />{nl ? 'Herinnering verstuurd!' : 'Reminder sent!'}</span>
                                        ) : result?.error ? (
                                          <span className="text-[10px] text-red-500 font-medium">{result.error}</span>
                                        ) : (
                                          <>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); createPaymentLink(pid!); }}
                                              disabled={isLoading}
                                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                                              {nl ? 'Betaallink' : 'Payment link'}
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); sendReminder(pid!); }}
                                              disabled={isLoading}
                                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                              {nl ? 'Herinnering' : 'Reminder'}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {/* Action button */}
                            <div className="px-3 pb-3">
                              <button onClick={() => navigate(sg.href)} className={`w-full py-2 rounded-lg text-[11px] font-semibold text-white ${cfg.btnBg} transition-colors cursor-pointer flex items-center justify-center gap-1.5`}>
                                {sg.actionLabel}
                                <ArrowRight className="w-3 h-3" />
                              </button>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
