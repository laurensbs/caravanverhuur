'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Search,
  Users,
  Calendar,
  CheckCircle2,
  Wrench,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { caravans, type Caravan } from '@/data/caravans';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  type Booking,
} from '@/data/admin';

function getCaravanStatusColor(status: string) {
  switch (status) {
    case 'BESCHIKBAAR': return 'bg-green-100 text-green-700';
    case 'ONDERHOUD': return 'bg-yellow-100 text-yellow-700';
    case 'GEBOEKT': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getCaravanStatusIcon(status: string) {
  switch (status) {
    case 'BESCHIKBAAR': return CheckCircle2;
    case 'ONDERHOUD': return Wrench;
    case 'GEBOEKT': return CalendarCheck;
    default: return CheckCircle2;
  }
}

function CaravanDetail({ caravan }: { caravan: Caravan }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/caravan-bookings?caravanId=${caravan.id}`)
      .then(res => res.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [caravan.id]);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="bg-[#f8fafc] rounded-2xl p-5 border border-[#e2e8f0] mt-2 space-y-5">
      {caravan.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {caravan.photos.slice(0, 4).map((photo, i) => (
            <div key={i} className="relative w-32 h-24 shrink-0 rounded-xl overflow-hidden">
              <Image
                src={photo}
                alt={`${caravan.name} foto ${i + 1}`}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Specificaties</h4>
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748b]">Fabrikant</span>
              <span className="text-[#1a1a2e] font-medium">{caravan.manufacturer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Bouwjaar</span>
              <span className="text-[#1a1a2e] font-medium">{caravan.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Type</span>
              <span className="text-[#1a1a2e] font-medium">{caravan.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Max personen</span>
              <span className="text-[#1a1a2e] font-medium">{caravan.maxPersons}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Prijzen</h4>
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748b]">Per dag</span>
              <span className="text-[#1a1a2e] font-medium">{formatCurrency(caravan.pricePerDay)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Per week</span>
              <span className="text-[#1a1a2e] font-medium">{formatCurrency(caravan.pricePerWeek)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Borg</span>
              <span className="text-[#1a1a2e] font-medium">{formatCurrency(caravan.deposit)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Voorzieningen</h4>
        <div className="flex flex-wrap gap-1.5">
          {caravan.amenities.map((a) => (
            <span
              key={a}
              className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#64748b]"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">
          Boekingen {!loading && `(${bookings.length})`}
        </h4>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <Loader2 className="w-4 h-4 animate-spin" /> Laden...
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-[#64748b]">Totale omzet</span>
              <span className="text-sm font-bold text-[#1a1a2e]">{formatCurrency(totalRevenue)}</span>
            </div>
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[#1a1a2e]">{b.guest_name}</p>
                  <p className="text-xs text-[#64748b]">
                    {formatDate(b.check_in)} – {formatDate(b.check_out)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1a1a2e]">{formatCurrency(Number(b.total_price))}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8]">Nog geen boekingen</p>
        )}
      </div>
    </div>
  );
}

export default function CaravansAdminPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all(
      caravans.map(c =>
        fetch(`/api/admin/caravan-bookings?caravanId=${c.id}`)
          .then(res => res.json())
          .then(data => ({ id: c.id, count: (data.bookings || []).length }))
          .catch(() => ({ id: c.id, count: 0 }))
      )
    ).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(r => { counts[r.id] = r.count; });
      setBookingCounts(counts);
    });
  }, []);

  const filtered = caravans.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.reference.toLowerCase().includes(q) ||
      c.manufacturer.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  });

  const totalCaravans = caravans.length;
  const beschikbaar = caravans.filter((c) => c.status === 'BESCHIKBAAR').length;
  const onderhoud = caravans.filter((c) => c.status === 'ONDERHOUD').length;
  const geboekt = caravans.filter((c) => c.status === 'GEBOEKT').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
          <p className="text-2xl font-bold text-[#1a1a2e]">{totalCaravans}</p>
          <p className="text-xs text-[#64748b]">Totaal</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{beschikbaar}</p>
          <p className="text-xs text-[#64748b]">Beschikbaar</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{geboekt}</p>
          <p className="text-xs text-[#64748b]">Geboekt</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{onderhoud}</p>
          <p className="text-xs text-[#64748b]">Onderhoud</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam, referentie, fabrikant..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((caravan) => {
          const isExpanded = expandedId === caravan.id;
          const StatusIcon = getCaravanStatusIcon(caravan.status);
          const bookingCount = bookingCounts[caravan.id] || 0;

          return (
            <div key={caravan.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : caravan.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                {caravan.photos[0] && (
                  <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 hidden sm:block">
                    <Image
                      src={caravan.photos[0]}
                      alt={caravan.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[#1a1a2e]">{caravan.name}</p>
                    <span className="text-xs text-[#94a3b8]">{caravan.reference}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {caravan.maxPersons}p
                    </span>
                    <span>{caravan.type}</span>
                    <span>{caravan.manufacturer} {caravan.year}</span>
                    {bookingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {bookingCount} boeking{bookingCount !== 1 ? 'en' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-[#1a1a2e]">{formatCurrency(caravan.pricePerWeek)}/wk</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCaravanStatusColor(caravan.status)}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {caravan.status}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#94a3b8]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5">
                  <CaravanDetail caravan={caravan} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#94a3b8]">
            <p className="text-lg">Geen caravans gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
}
