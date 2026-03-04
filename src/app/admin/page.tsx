'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CreditCard,
  Mail,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  getBookingCaravan,
  getBookingCamping,
  getStatusColor,
  getContactStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  type Booking,
  type ContactSubmission,
} from '@/data/admin';

interface DashboardData {
  stats: {
    bookings: { total: string; active: string; new: string };
    payments: { total_paid: string; paid_count: string; total_open: string; open_count: string };
    contacts: { total: string; new: string };
    monthly: { bookings_this_month: string; revenue_this_month: string };
  };
  recentBookings: Booking[];
  recentContacts: ContactSubmission[];
  upcomingStays: Booking[];
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
  index = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
    >
      <Link
        href={href}
        className="block bg-white rounded-2xl p-5 border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const pathname = usePathname();
  const p = (sub: string) => pathname.startsWith('/admin') ? `/admin${sub}` : (sub || '/');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async res => {
        if (!res.ok) {
          // Try to auto-setup database
          await fetch('/api/setup');
          const retry = await fetch('/api/admin/dashboard');
          if (!retry.ok) throw new Error('API error');
          return retry.json();
        }
        return res.json();
      })
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(() => setError('Kon dashboard data niet laden'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-dark" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-danger">{error || 'Er ging iets mis'}</p>
        <p className="text-sm text-muted mt-2">
          Controleer of de database is opgezet via <code>/api/setup</code>
        </p>
      </div>
    );
  }

  const { stats, recentBookings, recentContacts, upcomingStays } = data;

  const totalBookings = parseInt(stats.bookings.total);
  const activeBookings = parseInt(stats.bookings.active);
  const newBookings = parseInt(stats.bookings.new);
  const totalPaid = parseFloat(stats.payments.total_paid);
  const paidCount = parseInt(stats.payments.paid_count);
  const totalOpen = parseFloat(stats.payments.total_open);
  const openCount = parseInt(stats.payments.open_count);
  const totalMessages = parseInt(stats.contacts.total);
  const newMessages = parseInt(stats.contacts.new);
  const bookingsThisMonth = parseInt(stats.monthly?.bookings_this_month || '0');
  const revenueThisMonth = parseFloat(stats.monthly?.revenue_this_month || '0');

  const monthName = new Date().toLocaleDateString('nl-NL', { month: 'long' });

  return (
    <div className="space-y-6">
      {/* Monthly overview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-primary-dark to-primary rounded-2xl p-5 text-white"
      >
        <p className="text-sm text-white/70 font-medium uppercase tracking-wider">
          Overzicht {monthName} {new Date().getFullYear()}
        </p>
        <div className="flex flex-wrap gap-6 mt-3">
          <div>
            <p className="text-3xl font-bold">{bookingsThisMonth}</p>
            <p className="text-sm text-white/60">boekingen deze maand</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatCurrency(revenueThisMonth)}</p>
            <p className="text-sm text-white/60">omzet deze maand</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatCurrency(totalOpen)}</p>
            <p className="text-sm text-white/60">openstaand</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Actieve Boekingen"
          value={String(activeBookings)}
          sub={`${totalBookings} totaal • ${newBookings} nieuw`}
          icon={CalendarCheck}
          color="bg-primary-100 text-primary"
          href={p('/boekingen')}
          index={0}
        />
        <StatCard
          label="Ontvangen"
          value={formatCurrency(totalPaid)}
          sub={`${paidCount} betalingen`}
          icon={TrendingUp}
          color="bg-primary-light text-primary-dark"
          href={p('/betalingen')}
          index={1}
        />
        <StatCard
          label="Openstaand"
          value={formatCurrency(totalOpen)}
          sub={`${openCount} betalingen`}
          icon={CreditCard}
          color="bg-primary-50 text-accent"
          href={p('/betalingen')}
          index={2}
        />
        <StatCard
          label="Berichten"
          value={String(totalMessages)}
          sub={`${newMessages} ongelezen`}
          icon={Mail}
          color="bg-primary-100 text-primary-dark"
          href={p('/berichten')}
          index={3}
        />
      </div>

      {/* Action items */}
      {(newBookings > 0 || openCount > 0 || newMessages > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-2xl border border-border p-5"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
            Actiepunten
          </h3>
          <div className="space-y-2">
            {newBookings > 0 && (
              <Link
                href={p('/boekingen')}
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary-dark"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{newBookings}</strong> nieuwe boeking(en) wacht(en) op bevestiging
                </span>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
              </Link>
            )}
            {openCount > 0 && (
              <Link
                href={p('/betalingen')}
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-accent"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{openCount}</strong> openstaande betaling(en) ({formatCurrency(totalOpen)})
                </span>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
              </Link>
            )}
            {newMessages > 0 && (
              <Link
                href={p('/berichten')}
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary-dark"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{newMessages}</strong> ongelezen bericht(en)
                </span>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
              </Link>
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Recente Boekingen
            </h3>
            <Link
              href={p('/boekingen')}
              className="text-xs text-primary-dark font-medium hover:underline flex items-center gap-1"
            >
              Alles bekijken <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Nog geen boekingen</p>
          ) : (
            <div className="divide-y divide-border">
              {recentBookings.map((booking) => {
                const caravan = getBookingCaravan(booking);
                const camping = getBookingCamping(booking);
                return (
                  <Link
                    key={booking.id}
                    href={p('/boekingen')}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {booking.guest_name}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {caravan?.name} • {camping?.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-muted mt-0.5">
                        {formatDate(booking.created_at)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Berichten
            </h3>
            <Link
              href={p('/berichten')}
              className="text-xs text-primary-dark font-medium hover:underline flex items-center gap-1"
            >
              Alles <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Nog geen berichten</p>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={p('/berichten')}
                  className="block p-3 rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm text-foreground">{contact.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getContactStatusColor(contact.status as 'NIEUW' | 'GELEZEN' | 'BEANTWOORD')}`}
                    >
                      {contact.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{contact.subject}</p>
                  <p className="text-xs text-muted line-clamp-2 mt-0.5">{contact.message}</p>
                  <p className="text-xs text-muted mt-1">{formatDateTime(contact.created_at)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Upcoming stays */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="bg-white rounded-2xl border border-border p-5"
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Aankomende Verblijven
        </h3>
        {upcomingStays.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">Geen aankomende verblijven</p>
        ) : (
          <div className="space-y-3">
            {upcomingStays.map((b) => {
              const caravan = getBookingCaravan(b);
              const camping = getBookingCamping(b);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border"
                >
                  <div className="text-center bg-surface rounded-xl px-3 py-2 shrink-0">
                    <p className="text-lg font-bold text-primary-dark">
                      {new Date(b.check_in).getDate()}
                    </p>
                    <p className="text-xs text-muted uppercase">
                      {new Date(b.check_in).toLocaleDateString('nl-NL', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{b.guest_name}</p>
                    <p className="text-xs text-muted truncate">
                      {caravan?.name} → {camping?.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(b.check_in)} – {formatDate(b.check_out)} ({b.nights} nachten)
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
