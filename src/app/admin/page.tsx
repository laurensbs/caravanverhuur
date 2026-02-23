'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
        className="block bg-white rounded-2xl p-5 border border-[#e2e8f0] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[#64748b] font-medium">{label}</p>
            <p className="text-2xl font-bold text-[#1a1a2e] mt-1">{value}</p>
            {sub && <p className="text-xs text-[#64748b] mt-1">{sub}</p>}
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
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3c6e]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || 'Er ging iets mis'}</p>
        <p className="text-sm text-[#64748b] mt-2">
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Actieve Boekingen"
          value={String(activeBookings)}
          sub={`${totalBookings} totaal • ${newBookings} nieuw`}
          icon={CalendarCheck}
          color="bg-blue-100 text-blue-600"
          href="/admin/boekingen"
          index={0}
        />
        <StatCard
          label="Ontvangen"
          value={formatCurrency(totalPaid)}
          sub={`${paidCount} betalingen`}
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
          href="/admin/betalingen"
          index={1}
        />
        <StatCard
          label="Openstaand"
          value={formatCurrency(totalOpen)}
          sub={`${openCount} betalingen`}
          icon={CreditCard}
          color="bg-orange-100 text-orange-600"
          href="/admin/betalingen"
          index={2}
        />
        <StatCard
          label="Berichten"
          value={String(totalMessages)}
          sub={`${newMessages} ongelezen`}
          icon={Mail}
          color="bg-purple-100 text-purple-600"
          href="/admin/berichten"
          index={3}
        />
      </div>

      {/* Action items */}
      {(newBookings > 0 || openCount > 0 || newMessages > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-2xl border border-[#e2e8f0] p-5"
        >
          <h3 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wider mb-3">
            Actiepunten
          </h3>
          <div className="space-y-2">
            {newBookings > 0 && (
              <Link
                href="/admin/boekingen"
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors text-blue-700"
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
                href="/admin/betalingen"
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-orange-50 transition-colors text-orange-700"
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
                href="/admin/berichten"
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-purple-50 transition-colors text-purple-700"
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wider">
              Recente Boekingen
            </h3>
            <Link
              href="/admin/boekingen"
              className="text-xs text-[#1a3c6e] font-medium hover:underline flex items-center gap-1"
            >
              Alles bekijken <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-[#94a3b8] py-8 text-center">Nog geen boekingen</p>
          ) : (
            <div className="divide-y divide-[#e2e8f0]">
              {recentBookings.map((booking) => {
                const caravan = getBookingCaravan(booking);
                const camping = getBookingCamping(booking);
                return (
                  <Link
                    key={booking.id}
                    href="/admin/boekingen"
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f8fafc] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#1a1a2e] truncate">
                        {booking.guest_name}
                      </p>
                      <p className="text-xs text-[#64748b] truncate">
                        {caravan?.name} • {camping?.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-[#64748b] mt-0.5">
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
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wider">
              Berichten
            </h3>
            <Link
              href="/admin/berichten"
              className="text-xs text-[#1a3c6e] font-medium hover:underline flex items-center gap-1"
            >
              Alles <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="text-sm text-[#94a3b8] py-8 text-center">Nog geen berichten</p>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <Link
                  key={contact.id}
                  href="/admin/berichten"
                  className="block p-3 rounded-xl hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm text-[#1a1a2e]">{contact.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getContactStatusColor(contact.status as 'NIEUW' | 'GELEZEN' | 'BEANTWOORD')}`}
                    >
                      {contact.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#1a1a2e]">{contact.subject}</p>
                  <p className="text-xs text-[#64748b] line-clamp-2 mt-0.5">{contact.message}</p>
                  <p className="text-xs text-[#94a3b8] mt-1">{formatDateTime(contact.created_at)}</p>
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
        className="bg-white rounded-2xl border border-[#e2e8f0] p-5"
      >
        <h3 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wider mb-4">
          Aankomende Verblijven
        </h3>
        {upcomingStays.length === 0 ? (
          <p className="text-sm text-[#94a3b8] py-8 text-center">Geen aankomende verblijven</p>
        ) : (
          <div className="space-y-3">
            {upcomingStays.map((b) => {
              const caravan = getBookingCaravan(b);
              const camping = getBookingCamping(b);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-[#e2e8f0]"
                >
                  <div className="text-center bg-[#f8fafc] rounded-xl px-3 py-2 shrink-0">
                    <p className="text-lg font-bold text-[#1a3c6e]">
                      {new Date(b.check_in).getDate()}
                    </p>
                    <p className="text-xs text-[#64748b] uppercase">
                      {new Date(b.check_in).toLocaleDateString('nl-NL', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#1a1a2e]">{b.guest_name}</p>
                    <p className="text-xs text-[#64748b] truncate">
                      {caravan?.name} → {camping?.name}
                    </p>
                    <p className="text-xs text-[#94a3b8]">
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
