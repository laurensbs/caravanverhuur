'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CreditCard,
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
  formatDate,
  formatCurrency,
  type Booking,
} from '@/data/admin';

interface DashboardData {
  stats: {
    bookings: { total: string; active: string; new: string };
    payments: { total_paid: string; paid_count: string; total_open: string; open_count: string };
    contacts: { total: string; new: string };
    monthly: { bookings_this_month: string; revenue_this_month: string };
  };
  recentBookings: Booking[];
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
        className="block bg-white rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
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

export default function StaffDashboard() {
  const pathname = usePathname();
  const p = (sub: string) => pathname.startsWith('/staff') ? `/staff${sub}` : (sub || '/');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async res => {
        if (!res.ok) {
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-danger">{error || 'Er ging iets mis'}</p>
      </div>
    );
  }

  const { stats, recentBookings, upcomingStays } = data;

  const totalBookings = parseInt(stats.bookings.total);
  const activeBookings = parseInt(stats.bookings.active);
  const newBookings = parseInt(stats.bookings.new);
  const totalPaid = parseFloat(stats.payments.total_paid);
  const paidCount = parseInt(stats.payments.paid_count);
  const totalOpen = parseFloat(stats.payments.total_open);
  const openCount = parseInt(stats.payments.open_count);
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
        className="bg-emerald-700 rounded-2xl p-5 text-white"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Actieve Boekingen"
          value={String(activeBookings)}
          sub={`${totalBookings} totaal • ${newBookings} nieuw`}
          icon={CalendarCheck}
          color="bg-emerald-50 text-emerald-600"
          href={p('/boekingen')}
          index={0}
        />
        <StatCard
          label="Ontvangen"
          value={formatCurrency(totalPaid)}
          sub={`${paidCount} betalingen`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-700"
          href={p('/boekingen')}
          index={1}
        />
        <StatCard
          label="Openstaand"
          value={formatCurrency(totalOpen)}
          sub={`${openCount} betalingen`}
          icon={CreditCard}
          color="bg-emerald-50 text-emerald-600"
          href={p('/boekingen')}
          index={2}
        />
      </div>

      {/* Action items */}
      {(newBookings > 0 || openCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
            Actiepunten
          </h3>
          <div className="space-y-2">
            {newBookings > 0 && (
              <Link
                href={p('/boekingen')}
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-emerald-50 transition-colors text-emerald-700"
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
                href={p('/boekingen')}
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-emerald-50 transition-colors text-emerald-600"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{openCount}</strong> openstaande betaling(en) ({formatCurrency(totalOpen)})
                </span>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Recent bookings + Upcoming stays */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent bookings */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Recente Boekingen
            </h3>
            <Link
              href={p('/boekingen')}
              className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1"
            >
              Alles bekijken <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Nog geen boekingen</p>
          ) : (
            <div>
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

        {/* Upcoming stays */}
        <div className="bg-white rounded-2xl p-5">
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
                  <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl">
                    <div className="text-center bg-surface rounded-xl px-3 py-2 shrink-0">
                      <p className="text-lg font-bold text-emerald-700">
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
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusColor(b.status)}`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
