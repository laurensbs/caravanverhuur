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
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
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
        className="block bg-white rounded-2xl p-3 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted font-medium">{label}</p>
            <p className="text-lg sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{value}</p>
            {sub && <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">{sub}</p>}
          </div>
          <div className={`p-2 sm:p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const pathname = usePathname();
  const p = (sub: string) => pathname.startsWith('/admin') ? `/admin${sub}` : (sub || '/');
  const { t, ts, role, dateLocale } = useAdmin();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPurge, setShowPurge] = useState(false);
  const [purgePassword, setPurgePassword] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ success: boolean; message: string } | null>(null);

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
      .catch(() => setError('Could not load dashboard'))
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
        <p className="text-danger">{error || t('dashboard.somethingWrong')}</p>
        <p className="text-sm text-muted mt-2">
          {t('dashboard.checkSetup')}
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

  const monthName = new Date().toLocaleDateString(dateLocale, { month: 'long' });

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Monthly overview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-primary-dark rounded-2xl p-3 sm:p-5 text-white"
      >
        <p className="text-xs sm:text-sm text-white/70 font-medium uppercase tracking-wider">
          {t('dashboard.overview', { month: monthName, year: String(new Date().getFullYear()) })}
        </p>
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-6 mt-2 sm:mt-3">
          <div>
            <p className="text-xl sm:text-3xl font-bold">{bookingsThisMonth}</p>
            <p className="text-[10px] sm:text-sm text-white/60">{t('dashboard.bookingsThisMonth')}</p>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-bold">{formatCurrency(revenueThisMonth)}</p>
            <p className="text-[10px] sm:text-sm text-white/60">{t('dashboard.revenueThisMonth')}</p>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-bold">{formatCurrency(totalOpen)}</p>
            <p className="text-[10px] sm:text-sm text-white/60">{t('dashboard.outstanding')}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          label={t('dashboard.activeBookings')}
          value={String(activeBookings)}
          sub={t('dashboard.totalNew', { total: String(totalBookings), new: String(newBookings) })}
          icon={CalendarCheck}
          color="bg-primary-100 text-primary"
          href={p('/boekingen')}
          index={0}
        />
        <StatCard
          label={t('dashboard.received')}
          value={formatCurrency(totalPaid)}
          sub={t('dashboard.paymentsCount', { count: String(paidCount) })}
          icon={TrendingUp}
          color="bg-primary-light text-primary-dark"
          href={p('/betalingen')}
          index={1}
        />
        <StatCard
          label={t('dashboard.openPayments')}
          value={formatCurrency(totalOpen)}
          sub={t('dashboard.paymentsCount', { count: String(openCount) })}
          icon={CreditCard}
          color="bg-primary-50 text-primary"
          href={p('/betalingen')}
          index={2}
        />
        <StatCard
          label={t('dashboard.messages')}
          value={String(totalMessages)}
          sub={t('dashboard.unread', { count: String(newMessages) })}
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
          className="bg-white rounded-2xl p-3 sm:p-5"
        >
          <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider mb-2 sm:mb-3">
            {t('dashboard.actionItems')}
          </h3>
          <div className="space-y-1 sm:space-y-2">
            {newBookings > 0 && (
              <Link href={p('/boekingen')} className="flex items-center gap-2 sm:gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary-dark">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t('dashboard.newBookingsWaiting', { count: String(newBookings) })}</span>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
              </Link>
            )}
            {openCount > 0 && (
              <Link href={p('/betalingen')} className="flex items-center gap-2 sm:gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{t('dashboard.openPaymentsAmount', { count: String(openCount), amount: formatCurrency(totalOpen) })}</span>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
              </Link>
            )}
            {newMessages > 0 && (
              <Link href={p('/berichten')} className="flex items-center gap-2 sm:gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary-dark">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{t('dashboard.unreadMessages', { count: String(newMessages) })}</span>
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
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6"
      >
        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('dashboard.recentBookings')}
            </h3>
            <Link href={p('/boekingen')} className="text-xs text-primary-dark font-medium hover:underline flex items-center gap-1">
              {t('dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">{t('dashboard.noBookings')}</p>
          ) : (
            <div>
              {recentBookings.map((booking) => {
                const caravan = getBookingCaravan(booking);
                const camping = getBookingCamping(booking);
                return (
                  <Link
                    key={booking.id}
                    href={p('/boekingen')}
                    className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-surface transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{booking.guest_name}</p>
                      <p className="text-xs text-muted truncate">{caravan?.name} • {camping?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                      >
                        {ts(booking.status)}
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
        <div className="bg-white rounded-2xl p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('dashboard.messages')}
            </h3>
            <Link
              href={p('/berichten')}
              className="text-xs text-primary-dark font-medium hover:underline flex items-center gap-1"
            >
              Alles <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">{t('dashboard.noMessages')}</p>
          ) : (
            <div className="space-y-1 sm:space-y-3">
              {recentContacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={p('/berichten')}
                  className="block p-2 sm:p-3 rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm text-foreground">{contact.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getContactStatusColor(contact.status as 'NIEUW' | 'GELEZEN' | 'BEANTWOORD')}`}
                    >
                      {ts(contact.status)}
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
        className="bg-white rounded-2xl p-3 sm:p-5"
      >
        <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider mb-2 sm:mb-4">
          {t('dashboard.upcomingStays')}
        </h3>
        {upcomingStays.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">{t('dashboard.noUpcoming')}</p>
        ) : (
          <div className="space-y-1 sm:space-y-3">
            {upcomingStays.map((b) => {
              const caravan = getBookingCaravan(b);
              const camping = getBookingCamping(b);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl"
                >
                  <div className="text-center bg-surface rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 shrink-0">
                    <p className="text-lg font-bold text-primary-dark">
                      {new Date(b.check_in).getDate()}
                    </p>
                    <p className="text-xs text-muted uppercase">
                      {new Date(b.check_in).toLocaleDateString(dateLocale, { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{b.guest_name}</p>
                    <p className="text-xs text-muted truncate">
                      {caravan?.name} → {camping?.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(b.check_in)} – {formatDate(b.check_out)} ({b.nights} {t('common.nights')})
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`} > {ts(b.status)} </span> </div> </div> ); })} </div> )} </motion.div> {/* Test data purge — admin only */}
      {role === 'admin' && (<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.4 }} className="bg-white rounded-2xl p-3 sm:p-5" > <div className="flex items-center justify-between flex-wrap gap-2"> <div className="flex items-center gap-2 sm:gap-3"> <div className="p-2 sm:p-2.5 rounded-xl bg-red-50"> <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> </div> <div> <h3 className="text-xs sm:text-sm font-semibold text-foreground">{t('dashboard.cleanDatabase')}</h3> <p className="text-[10px] sm:text-xs text-muted">{t('dashboard.cleanDatabaseDesc')}</p> </div> </div> {!showPurge && ( <button onClick={() => setShowPurge(true)} className="px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer" > <Trash2 className="w-4 h-4 inline -mt-0.5 mr-1" /> {t('dashboard.wipeTestData')} </button> )} </div> {showPurge && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height:'auto' }} className="mt-4 pt-4 space-y-3" > {purgeResult ? ( <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${purgeResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}> {purgeResult.success ? <AlertCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {purgeResult.message} </div> ) : ( <> <div className="bg-red-50 rounded-xl p-3"> <p className="text-xs text-red-700 font-medium"> ⚠️ {t('dashboard.wipeWarning')} </p> </div> <div> <label className="text-xs font-medium text-foreground mb-1 block">{t('dashboard.confirmAdminPassword')}</label> <input type="password" value={purgePassword} onChange={(e) => setPurgePassword(e.target.value)} placeholder={t('dashboard.adminPassword')} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200" /> </div> <div className="flex gap-2"> <button onClick={async () => { if (!purgePassword) return; setPurging(true); try { const res = await fetch('/api/admin/dashboard', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminPassword: purgePassword }),
                        });
                        const d = await res.json();
                        if (res.ok) {
                          setPurgeResult({ success: true, message: t('dashboard.dataDeleted') });
                          // Refresh data after purge
                          setTimeout(() => window.location.reload(), 2000);
                        } else {
                          setPurgeResult({ success: false, message: d.error || t('dashboard.deleteError') });
                        }
                      } catch {
                        setPurgeResult({ success: false, message: t('dashboard.networkError') });
                      }
                      setPurging(false);
                    }}
                    disabled={purging || !purgePassword}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {t('dashboard.permanentDelete')}
                  </button>
                  <button
                    onClick={() => { setShowPurge(false); setPurgePassword(''); setPurgeResult(null); }}
                    className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-surface transition-colors cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </motion.div>)}
    </div>
  );
}
