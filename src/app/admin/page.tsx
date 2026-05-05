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
  Download,
  ClipboardCheck,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import ActivityFeed from '@/components/admin/ActivityFeed';
import {
  getBookingCaravan,
  getBookingCamping,
  getStatusColor,
  getContactStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  loadCustomData,
  type Booking,
  type ContactSubmission,
} from '@/data/admin';

interface DashboardData {
  stats: {
    bookings: { total: string; active: string; new: string };
    payments: { total_paid: string; paid_count: string; total_open: string; open_count: string };
    contacts: { total: string; new: string };
    monthly: { bookings_this_month: string; revenue_this_month: string };
    borg?: { pending: string; awaiting_customer: string };
    occupancy?: { booked_this_month: string };
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
        className="block bg-white rounded-xl p-2.5 sm:p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-muted font-medium leading-tight">{label}</p>
            <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{value}</p>
            {sub && <p className="text-[10px] sm:text-xs text-muted leading-tight">{sub}</p>}
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
  const [exporting, setExporting] = useState(false);
  const [stripeTestLoading, setStripeTestLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendConfirmation = async () => {
    const ref = prompt('Boekingsreferentie (BK-...) om bevestigingsmail opnieuw te sturen:');
    if (!ref) return;
    setResendLoading(true);
    try {
      const res = await fetch('/api/admin/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: ref.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { alert(`Mislukt: ${data.error || 'onbekende fout'}`); setResendLoading(false); return; }
      alert(`Mail verstuurd: ${data.success ? 'ja' : 'nee'}\nNaar: ${data.guestEmail}\nNieuw account: ${data.newAccountCreated ? 'ja' : 'bestond al'}\n${data.mailError ? `Fout: ${data.mailError}` : ''}`);
    } catch (err) {
      alert(`Mislukt: ${err}`);
    } finally {
      setResendLoading(false);
    }
  };

  const handleDebugCustomer = async () => {
    const email = prompt('Welk e-mailadres bekijken?', 'laurensbs@proton.me');
    if (!email) return;
    try {
      const res = await fetch(`/api/admin/debug-customer?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      alert(`Mislukt: ${err}`);
    }
  };

  const handleResetCustomerPassword = async () => {
    const email = prompt('Welk e-mailadres reset je het wachtwoord van?', 'laurensbs@proton.me');
    if (!email) return;
    if (!confirm(`Genereer nieuw tijdelijk wachtwoord voor ${email}?`)) return;
    setResetPwdLoading(true);
    try {
      const res = await fetch('/api/admin/reset-customer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { alert(`Mislukt: ${data.error || 'onbekende fout'}`); setResetPwdLoading(false); return; }
      prompt(`Nieuw tijdelijk wachtwoord voor ${email} (kopiëren met Cmd+C):`, data.temporaryPassword);
    } catch (err) {
      alert(`Mislukt: ${err}`);
    } finally {
      setResetPwdLoading(false);
    }
  };

  const handleCleanupTestCustomer = async () => {
    const email = prompt('Welk e-mailadres opruimen? (verwijdert customer-account + 2099 test-boekingen)', 'laurensbs@proton.me');
    if (!email) return;
    if (!confirm(`Verwijder customer + test-boekingen voor ${email}?`)) return;
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/dev-cleanup-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { alert(`Mislukt: ${data.error || 'onbekende fout'}`); setCleanupLoading(false); return; }
      alert(`Klaar.\nCustomer verwijderd: ${data.deletedCustomer ? 'ja' : 'niet gevonden'}\nTest-boekingen verwijderd: ${data.deletedBookings}`);
    } catch (err) {
      alert(`Mislukt: ${err}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleStripeTest = async () => {
    if (!confirm('Een echte Stripe-checkout van €0,01 starten op jouw e-mail (laurensbs@proton.me)? Doorloopt de hele klant-flow inclusief mails. Refund daarna handmatig in Stripe.')) return;
    setStripeTestLoading(true);
    try {
      const res = await fetch('/api/admin/stripe-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        alert(`Mislukt: ${data.error || 'onbekende fout'}`);
        setStripeTestLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      alert(`Mislukt: ${err}`);
      setStripeTestLoading(false);
    }
  };

  useEffect(() => {
    loadCustomData();
    fetch('/api/admin/dashboard', { credentials: 'include' })
      .then(async res => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || `API error (${res.status})`);
        if (body?.error) throw new Error(body.error);
        setData(body);
      })
      .catch((e) => setError(e?.message || 'Could not load dashboard'))
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
  const borgPending = parseInt(stats.borg?.pending || '0');
  const borgAwaitingCustomer = parseInt(stats.borg?.awaiting_customer || '0');
  const occupancyThisMonth = parseInt(stats.occupancy?.booked_this_month || '0');

  const monthName = new Date().toLocaleDateString(dateLocale, { month: 'long' });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caravanverhuur-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert(t('common.error'));
    }
    setExporting(false);
  };

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
            <p className="text-xs sm:text-sm text-white/60">{t('dashboard.bookingsThisMonth')}</p>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-bold">{formatCurrency(revenueThisMonth)}</p>
            <p className="text-xs sm:text-sm text-white/60">{t('dashboard.revenueThisMonth')}</p>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-bold">{formatCurrency(totalOpen)}</p>
            <p className="text-xs sm:text-sm text-white/60">{t('dashboard.outstanding')}</p>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-bold">{occupancyThisMonth}</p>
            <p className="text-xs sm:text-sm text-white/60">{t('dashboard.occupancy')}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3">
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
          label={t('dashboard.openPayments')}
          value={String(openCount)}
          sub={totalOpen > 0 ? formatCurrency(totalOpen) : undefined}
          icon={CreditCard}
          color="bg-primary-50 text-primary"
          href={p('/betalingen')}
          index={1}
        />
        <StatCard
          label={t('dashboard.received')}
          value={String(paidCount)}
          sub={totalPaid > 0 ? formatCurrency(totalPaid) : undefined}
          icon={TrendingUp}
          color="bg-primary-light text-primary-dark"
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
      {(newBookings > 0 || openCount > 0 || newMessages > 0 || borgPending > 0 || borgAwaitingCustomer > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-xl p-2.5 sm:p-4"
        >
          <h3 className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 sm:mb-2">
            {t('dashboard.actionItems')}
          </h3>
          <div className="space-y-0.5 sm:space-y-1">
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
            {borgPending > 0 && (
              <Link href={p('/borg')} className="flex items-center gap-2 sm:gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary">
                <ClipboardCheck className="w-4 h-4 shrink-0" />
                <span>{t('dashboard.borgPending', { count: String(borgPending) })}</span>
                <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
              </Link>
            )}
            {borgAwaitingCustomer > 0 && (
              <Link href={p('/borg')} className="flex items-center gap-2 sm:gap-3 text-sm p-2 rounded-lg hover:bg-primary-50 transition-colors text-primary">
                <ClipboardCheck className="w-4 h-4 shrink-0" />
                <span>{t('dashboard.borgAwaitingCustomer', { count: String(borgAwaitingCustomer) })}</span>
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
              {t('dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
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
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">
            {t('dashboard.upcomingStays')}
          </h3>
          <Link href={p('/planning')} className="text-xs text-primary-dark font-medium hover:underline flex items-center gap-1">
            {t('dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
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
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">🚚 Deliver 15:00</span>
                      <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">🔙 Pickup 10:00</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`} > {ts(b.status)} </span> </div> </div> ); })} </div> )} </motion.div>

      {/* Recente activiteit — admin-acties van de laatste tijd */}
      <ActivityFeed limit={10} />

      {/* Export all data — admin only */}
      {role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="bg-white rounded-2xl p-3 sm:p-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary-50">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">{t('dashboard.exportData')}</h3>
                <p className="text-xs text-muted">{t('dashboard.exportDataDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStripeTest}
                disabled={stripeTestLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Maakt een echte Stripe-checkout van €0,01 op jouw e-mail om de end-to-end flow te testen"
              >
                {stripeTestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🧪'}
                Stripe €0,01 test
              </button>
              <button
                onClick={handleCleanupTestCustomer}
                disabled={cleanupLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Verwijdert customer-account en 2099 test-boekingen voor een opgegeven e-mail"
              >
                {cleanupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🗑️'}
                Test-customer opruimen
              </button>
              <button
                onClick={handleDebugCustomer}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                title="Toont accountstatus voor een e-mail (bestaat, email_verified, must_change_password, hash-prefix)"
              >
                🔍 Debug klant
              </button>
              <button
                onClick={handleResetCustomerPassword}
                disabled={resetPwdLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Genereert een nieuw tijdelijk wachtwoord en toont het — handig als klant niet kan inloggen"
              >
                {resetPwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔑'}
                Reset wachtwoord
              </button>
              <button
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Forceer de bevestigingsmail + Holded mark-paid voor een boeking — handig als webhook niet doorkwam"
              >
                {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '📧'}
                Bevestigingsmail forceren
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {t('dashboard.exportBtn')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
