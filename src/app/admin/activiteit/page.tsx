'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  CalendarCheck,
  CreditCard,
  Mail,
  Users,
  MessageCircle,
  Tag,
  Tent,
  CarFront,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { usePageActions } from '@/app/admin/layout';

interface ActivityEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  details: string | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  booking_created: <CalendarCheck size={16} className="text-green-600" />,
  booking_updated: <CalendarCheck size={16} className="text-blue-600" />,
  booking_status: <CalendarCheck size={16} className="text-amber-600" />,
  booking_deleted: <CalendarCheck size={16} className="text-red-500" />,
  payment_created: <CreditCard size={16} className="text-green-600" />,
  payment_status: <CreditCard size={16} className="text-blue-600" />,
  payment_refund: <CreditCard size={16} className="text-red-500" />,
  contact_replied: <Mail size={16} className="text-blue-600" />,
  contact_status: <Mail size={16} className="text-amber-600" />,
  chat_replied: <MessageCircle size={16} className="text-blue-600" />,
  customer_created: <Users size={16} className="text-green-600" />,
  customer_deleted: <Users size={16} className="text-red-500" />,
  discount_created: <Tag size={16} className="text-green-600" />,
  discount_deleted: <Tag size={16} className="text-red-500" />,
  camping_created: <Tent size={16} className="text-green-600" />,
  camping_updated: <Tent size={16} className="text-blue-600" />,
  caravan_updated: <CarFront size={16} className="text-blue-600" />,
  login: <Shield size={16} className="text-sky-600" />,
  export: <History size={16} className="text-purple-600" />,
};

const ACTION_COLORS: Record<string, string> = {
  booking_created: 'bg-green-50 border-green-200',
  booking_deleted: 'bg-red-50 border-red-200',
  payment_refund: 'bg-red-50 border-red-200',
  customer_deleted: 'bg-red-50 border-red-200',
  discount_deleted: 'bg-red-50 border-red-200',
  login: 'bg-sky-50 border-sky-200',
};

function getActionIcon(action: string) {
  return ACTION_ICONS[action] || <History size={16} className="text-gray-500" />;
}

function getActionColor(action: string) {
  return ACTION_COLORS[action] || 'bg-white border-gray-200';
}

const ENTITY_FILTERS = [
  { key: 'all', icon: <History size={14} /> },
  { key: 'booking', icon: <CalendarCheck size={14} /> },
  { key: 'payment', icon: <CreditCard size={14} /> },
  { key: 'contact', icon: <Mail size={14} /> },
  { key: 'customer', icon: <Users size={14} /> },
  { key: 'login', icon: <Shield size={14} /> },
];

export default function ActivityPage() {
  const { t, locale, dateLocale } = useAdmin();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const pageSize = 30;

  const actionLabel = useCallback((action: string): string => {
    const labels: Record<string, Record<string, string>> = {
      nl: {
        booking_created: 'Boeking aangemaakt',
        booking_updated: 'Boeking bijgewerkt',
        booking_status: 'Boekingstatus gewijzigd',
        booking_deleted: 'Boeking verwijderd',
        payment_created: 'Betaling aangemaakt',
        payment_status: 'Betalingsstatus gewijzigd',
        payment_refund: 'Terugbetaling verwerkt',
        contact_replied: 'Bericht beantwoord',
        contact_status: 'Berichtstatus gewijzigd',
        chat_replied: 'Chat beantwoord',
        customer_created: 'Klant aangemaakt',
        customer_deleted: 'Klant verwijderd',
        discount_created: 'Kortingscode aangemaakt',
        discount_deleted: 'Kortingscode verwijderd',
        camping_created: 'Camping aangemaakt',
        camping_updated: 'Camping bijgewerkt',
        caravan_updated: 'Caravan bijgewerkt',
        login: 'Ingelogd',
        export: 'Data geëxporteerd',
      },
      en: {
        booking_created: 'Booking created',
        booking_updated: 'Booking updated',
        booking_status: 'Booking status changed',
        booking_deleted: 'Booking deleted',
        payment_created: 'Payment created',
        payment_status: 'Payment status changed',
        payment_refund: 'Refund processed',
        contact_replied: 'Message replied',
        contact_status: 'Message status changed',
        chat_replied: 'Chat replied',
        customer_created: 'Customer created',
        customer_deleted: 'Customer deleted',
        discount_created: 'Discount code created',
        discount_deleted: 'Discount code deleted',
        camping_created: 'Camping created',
        camping_updated: 'Camping updated',
        caravan_updated: 'Caravan updated',
        login: 'Logged in',
        export: 'Data exported',
      },
    };
    return labels[locale]?.[action] || action.replace(/_/g, ' ');
  }, [locale]);

  // Houd actuele page bij in een ref zodat fetchLog (geheugen-stabiel via
  // useCallback met lege deps) niet hoeft te re-renderen bij page-changes.
  // Mutatie via useEffect — direct in render-body geeft Compiler-warning.
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);

  const fetchLog = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/activity?limit=${pageSize}&offset=${pageRef.current * pageSize}`)
      .then(r => r.ok ? r.json() : { log: [], total: 0 })
      .then(data => {
        setEntries(data.log || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLog(); }, [fetchLog, page]);

  usePageActions(
    useMemo(() => (
      <button onClick={() => fetchLog()} className="p-2 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer" title={locale === 'nl' ? 'Vernieuwen' : 'Refresh'}>
        <RefreshCw size={16} />
      </button>
    ), [fetchLog, locale])
  );

  const filteredEntries = filter === 'all'
    ? entries
    : filter === 'login'
      ? entries.filter(e => e.action === 'login')
      : entries.filter(e => e.entity_type === filter);

  const totalPages = Math.ceil(total / pageSize);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return locale === 'nl' ? 'Zojuist' : 'Just now';
    if (mins < 60) return `${mins}m ${locale === 'nl' ? 'geleden' : 'ago'}`;
    if (hours < 24) return `${hours}h ${locale === 'nl' ? 'geleden' : 'ago'}`;
    if (days < 7) return `${days}d ${locale === 'nl' ? 'geleden' : 'ago'}`;
    return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <History size={20} className="text-primary" />
            {locale === 'nl' ? 'Activiteitenlog' : 'Activity Log'}
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {locale === 'nl'
              ? `${total} activiteiten bijgehouden`
              : `${total} activities tracked`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={14} className="text-muted shrink-0" />
        {ENTITY_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filter === f.key ? 'bg-primary text-white' : 'bg-white text-muted hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f.icon}
            {f.key === 'all'
              ? (locale === 'nl' ? 'Alles' : 'All')
              : f.key === 'booking'
                ? t('nav.bookings')
                : f.key === 'payment'
                  ? t('nav.payments')
                  : f.key === 'contact'
                    ? t('nav.messages')
                    : f.key === 'customer'
                      ? t('nav.customers')
                      : f.key === 'login'
                        ? 'Login'
                        : f.key}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <History size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted">
              {locale === 'nl' ? 'Nog geen activiteiten' : 'No activities yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors ${getActionColor(entry.action).includes('red') ? 'bg-red-50/30' : ''}`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${getActionColor(entry.action)}`}>
                    {getActionIcon(entry.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {actionLabel(entry.action)}
                      </span>
                      {entry.entity_label && (
                        <span className="text-sm text-primary font-medium">
                          {entry.entity_label}
                        </span>
                      )}
                    </div>
                    {entry.details && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">{entry.details}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        {entry.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                        {entry.actor}
                      </span>
                      <span className="text-[11px] text-muted">{formatTime(entry.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {locale === 'nl'
              ? `Pagina ${page + 1} van ${totalPages}`
              : `Page ${page + 1} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
