'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

interface BookingSummary {
  reference: string;
  guestName: string;
  guestEmail: string;
  caravanName: string;
  campingName: string;
  spotNumber: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalPrice: number;
  depositAmount: number;
  paymentStatus: string | null;
}

const COUNTRIES = [
  { code: 'NL', label: 'Nederland' },
  { code: 'BE', label: 'België' },
  { code: 'DE', label: 'Duitsland' },
  { code: 'FR', label: 'Frankrijk' },
  { code: 'ES', label: 'Spanje' },
  { code: 'LU', label: 'Luxemburg' },
];

export default function BetaalPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const sp = useSearchParams();
  const token = sp.get('token') || '';

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('NL');

  useEffect(() => {
    fetch(`/api/betalen/${ref}?token=${encodeURIComponent(token)}`)
      .then(async r => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || `Status ${r.status}`);
        }
        return r.json();
      })
      .then((d: BookingSummary) => setBooking(d))
      .catch(err => setError(String(err.message || err)))
      .finally(() => setLoading(false));
  }, [ref, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/betalen/${ref}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street, postalCode, city, country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onbekende fout');
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Geen betaal-URL ontvangen');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md bg-white rounded-2xl p-6 shadow-sm text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground mb-2">Link werkt niet</h1>
          <p className="text-sm text-muted">{error}</p>
          <p className="text-xs text-muted mt-4">Neem contact met ons op via info@caravanverhuurspanje.com.</p>
        </div>
      </div>
    );
  }

  if (booking?.paymentStatus === 'BETAALD') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md bg-white rounded-2xl p-6 shadow-sm text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground mb-2">Aanbetaling al voldaan</h1>
          <p className="text-sm text-muted">Je aanbetaling voor boeking {booking.reference} is al ontvangen. Tot ziens aan de Costa Brava!</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Aanbetaling — {booking.reference}</h1>
        <p className="text-sm text-muted mb-6">
          Hoi {booking.guestName.split(' ')[0]}, vul je adresgegevens in voor de officiële factuur. Daarna word je doorgestuurd naar de beveiligde betaalpagina.
        </p>

        {/* Booking summary card */}
        <div className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-3">Jouw boeking</h2>
          <dl className="grid grid-cols-3 gap-y-2 text-sm">
            <dt className="text-muted col-span-1">Camping</dt>
            <dd className="col-span-2 text-foreground">{booking.campingName}{booking.spotNumber ? ` (plek ${booking.spotNumber})` : ''}</dd>
            <dt className="text-muted col-span-1">Verblijf</dt>
            <dd className="col-span-2 text-foreground">
              {new Date(booking.checkIn).toLocaleDateString('nl-NL')} t/m {new Date(booking.checkOut).toLocaleDateString('nl-NL')} ({booking.nights} nachten)
            </dd>
            <dt className="text-muted col-span-1">Gasten</dt>
            <dd className="col-span-2 text-foreground">{booking.adults} volw.{booking.children > 0 ? ` + ${booking.children} kind.` : ''}</dd>
            <dt className="text-muted col-span-1">Totaalprijs</dt>
            <dd className="col-span-2 text-foreground">€{booking.totalPrice.toFixed(2)}</dd>
          </dl>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-muted">Aanbetaling (25%)</span>
            <span className="text-xl font-bold text-primary-dark">€{booking.depositAmount.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-muted mt-1">Restbedrag + borg betaal je op de camping (contant of pin).</p>
        </div>

        {/* Address form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Adresgegevens (voor de factuur)
          </h2>

          <div>
            <label className="text-xs text-muted block mb-1">Straat + huisnummer</label>
            <input
              required
              value={street}
              onChange={e => setStreet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Voorbeeldstraat 12"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Postcode</label>
              <input
                required
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1234 AB"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Stad</label>
              <input
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Amsterdam"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Land</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? 'Doorsturen naar beveiligde betaalpagina…' : `Doorgaan naar betaling (€${booking.depositAmount.toFixed(2)})`}
          </button>

          <p className="text-[11px] text-muted text-center">
            Veilig betalen via Stripe — iDEAL, Bancontact of creditcard.
          </p>
        </form>
      </div>
    </div>
  );
}
