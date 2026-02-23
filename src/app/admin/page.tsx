'use client';

import Link from 'next/link';
import {
  CalendarCheck,
  CreditCard,
  Mail,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  mockBookings,
  mockContacts,
  getBookingCaravan,
  getBookingCamping,
  getStatusColor,
  getContactStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  type Booking,
} from '@/data/admin';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-5 border border-[#e2e8f0] hover:shadow-lg transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#64748b] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[#1a1a2e] mt-1">{value}</p>
          {sub && <p className="text-xs text-[#64748b] mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}

function RecentBookingRow({ booking }: { booking: Booking }) {
  const caravan = getBookingCaravan(booking);
  const camping = getBookingCamping(booking);
  return (
    <Link
      href="/admin/boekingen"
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f8fafc] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[#1a1a2e] truncate">{booking.guestName}</p>
        <p className="text-xs text-[#64748b] truncate">
          {caravan?.name} • {camping?.name}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {booking.status.replace('_', ' ')}
        </span>
        <p className="text-xs text-[#64748b] mt-0.5">{formatDate(booking.createdAt)}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const totalBookings = mockBookings.length;
  const activeBookings = mockBookings.filter(
    (b) => !['GEANNULEERD', 'AFGEROND'].includes(b.status)
  ).length;
  const newBookings = mockBookings.filter((b) => b.status === 'NIEUW').length;

  const allPayments = mockBookings.flatMap((b) => b.payments);
  const paidPayments = allPayments.filter((p) => p.status === 'BETAALD');
  const openPayments = allPayments.filter((p) => p.status === 'OPENSTAAND');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const openAmount = openPayments.reduce((sum, p) => sum + p.amount, 0);

  const newMessages = mockContacts.filter((c) => c.status === 'NIEUW').length;
  const totalMessages = mockContacts.length;

  const recentBookings = [...mockBookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentContacts = [...mockContacts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

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
        />
        <StatCard
          label="Ontvangen"
          value={formatCurrency(totalRevenue)}
          sub={`${paidPayments.length} betalingen`}
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
          href="/admin/betalingen"
        />
        <StatCard
          label="Openstaand"
          value={formatCurrency(openAmount)}
          sub={`${openPayments.length} betalingen`}
          icon={CreditCard}
          color="bg-orange-100 text-orange-600"
          href="/admin/betalingen"
        />
        <StatCard
          label="Berichten"
          value={String(totalMessages)}
          sub={`${newMessages} ongelezen`}
          icon={Mail}
          color="bg-purple-100 text-purple-600"
          href="/admin/berichten"
        />
      </div>

      {/* Alerts */}
      {(newBookings > 0 || openPayments.length > 0 || newMessages > 0) && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
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
            {openPayments.length > 0 && (
              <Link
                href="/admin/betalingen"
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-orange-50 transition-colors text-orange-700"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{openPayments.length}</strong> openstaande betaling(en) ({formatCurrency(openAmount)})
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
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <div className="divide-y divide-[#e2e8f0]">
            {recentBookings.map((booking) => (
              <RecentBookingRow key={booking.id} booking={booking} />
            ))}
          </div>
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
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getContactStatusColor(contact.status)}`}
                  >
                    {contact.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#1a1a2e]">{contact.subject}</p>
                <p className="text-xs text-[#64748b] line-clamp-2 mt-0.5">{contact.message}</p>
                <p className="text-xs text-[#94a3b8] mt-1">{formatDateTime(contact.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick calendar/timeline */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
        <h3 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wider mb-4">
          Aankomende Verblijven
        </h3>
        <div className="space-y-3">
          {mockBookings
            .filter((b) => !['GEANNULEERD', 'AFGEROND'].includes(b.status))
            .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
            .map((b) => {
              const caravan = getBookingCaravan(b);
              const camping = getBookingCamping(b);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-[#e2e8f0]"
                >
                  <div className="text-center bg-[#f8fafc] rounded-xl px-3 py-2 shrink-0">
                    <p className="text-lg font-bold text-[#1a3c6e]">
                      {new Date(b.checkIn).getDate()}
                    </p>
                    <p className="text-xs text-[#64748b] uppercase">
                      {new Date(b.checkIn).toLocaleDateString('nl-NL', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#1a1a2e]">{b.guestName}</p>
                    <p className="text-xs text-[#64748b] truncate">
                      {caravan?.name} → {camping?.name}
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      {formatDate(b.checkIn)} – {formatDate(b.checkOut)} ({b.nights} nachten)
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
