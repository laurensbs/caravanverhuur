'use client';

import { useState, useEffect, useCallback } from 'react';
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
  XCircle,
  Power,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ImagePlus,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { caravans as staticCaravans, type Caravan } from '@/data/caravans';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  type Booking,
} from '@/data/admin';

interface CaravanSettingData {
  caravan_id: string;
  available: boolean;
  status: string;
  admin_notes: string | null;
}

interface CustomCaravan extends Caravan {
  isCustom: boolean;
  createdAt?: string;
}

function getCaravanStatusColor(status: string) {
  switch (status) {
    case 'BESCHIKBAAR': return 'bg-primary-50 text-primary-dark';
    case 'ONDERHOUD': return 'bg-primary-50 text-accent';
    case 'GEBOEKT': return 'bg-primary-50 text-primary';
    case 'NIET_BESCHIKBAAR': return 'bg-danger/10 text-danger';
    default: return 'bg-surface-alt text-muted';
  }
}

function getCaravanStatusIcon(status: string) {
  switch (status) {
    case 'BESCHIKBAAR': return CheckCircle2;
    case 'ONDERHOUD': return Wrench;
    case 'GEBOEKT': return CalendarCheck;
    case 'NIET_BESCHIKBAAR': return XCircle;
    default: return CheckCircle2;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'BESCHIKBAAR': return 'Beschikbaar';
    case 'ONDERHOUD': return 'Onderhoud';
    case 'GEBOEKT': return 'Geboekt';
    case 'NIET_BESCHIKBAAR': return 'Niet beschikbaar';
    default: return status;
  }
}

function CaravanDetail({ caravan, setting, onSettingChange, isCustom, onPhotosUpdate }: { caravan: Caravan; setting: CaravanSettingData | null; onSettingChange: (s: CaravanSettingData) => void; isCustom: boolean; onPhotosUpdate?: (photos: string[]) => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currentStatus = setting?.status || 'BESCHIKBAAR';
  const isAvailable = setting?.available !== false;

  // Photo management
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/caravan-bookings?caravanId=${caravan.id}`)
      .then(res => res.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [caravan.id]);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const newAvailable = newStatus === 'BESCHIKBAAR';
    try {
      await fetch('/api/admin/caravan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caravanId: caravan.id,
          available: newAvailable,
          status: newStatus,
        }),
      });
      onSettingChange({
        caravan_id: caravan.id,
        available: newAvailable,
        status: newStatus,
        admin_notes: setting?.admin_notes || null,
      });
    } catch { /* silent */ }
    setSaving(false);
  };

  const addPhoto = async () => {
    if (!newPhotoUrl.trim() || !isCustom || !onPhotosUpdate) return;
    setPhotoSaving(true);
    try {
      const updatedPhotos = [...caravan.photos, newPhotoUrl.trim()];
      const res = await fetch('/api/admin/caravans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caravan.id, photos: updatedPhotos }),
      });
      if (res.ok) {
        onPhotosUpdate(updatedPhotos);
        setNewPhotoUrl('');
      }
    } catch { /* silent */ }
    setPhotoSaving(false);
  };

  const removePhoto = async (index: number) => {
    if (!isCustom || !onPhotosUpdate) return;
    setPhotoSaving(true);
    try {
      const updatedPhotos = caravan.photos.filter((_, i) => i !== index);
      const res = await fetch('/api/admin/caravans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caravan.id, photos: updatedPhotos }),
      });
      if (res.ok) {
        onPhotosUpdate(updatedPhotos);
      }
    } catch { /* silent */ }
    setPhotoSaving(false);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border mt-2 space-y-5">
      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            Foto&apos;s ({caravan.photos.length})
          </h4>
          {isCustom && (
            <button
              onClick={() => setShowPhotoModal(!showPhotoModal)}
              className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
            >
              <ImagePlus size={14} />
              Foto toevoegen
            </button>
          )}
        </div>

        {showPhotoModal && isCustom && (
          <div className="mb-3 p-3 bg-white rounded-xl border border-border space-y-2">
            <input
              type="url"
              value={newPhotoUrl}
              onChange={e => setNewPhotoUrl(e.target.value)}
              placeholder="https://voorbeeld.nl/foto.jpg"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={addPhoto}
                disabled={!newPhotoUrl.trim() || photoSaving}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center gap-1"
              >
                {photoSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Toevoegen
              </button>
              <button
                onClick={() => { setShowPhotoModal(false); setNewPhotoUrl(''); }}
                className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted hover:bg-surface"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {caravan.photos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {caravan.photos.map((photo, i) => (
              <div key={i} className="relative w-32 h-24 shrink-0 rounded-xl overflow-hidden group">
                <Image
                  src={photo}
                  alt={`${caravan.name} foto ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                {isCustom && (
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Verwijderen"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted italic">Geen foto&apos;s beschikbaar</p>
        )}
      </div>

      {/* Availability control */}
      <div className="bg-white rounded-xl p-4 border border-border">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
          <Power className="w-3.5 h-3.5" />
          Beschikbaarheid beheren
        </h4>
        <div className="flex flex-wrap gap-2">
          {(['BESCHIKBAAR', 'ONDERHOUD', 'NIET_BESCHIKBAAR'] as const).map((s) => {
            const isActive = currentStatus === s;
            const StatusIcon = getCaravanStatusIcon(s);
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={saving || isActive}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-60 ${
                  isActive
                    ? `${getCaravanStatusColor(s)} ring-2 ring-offset-1 ring-current`
                    : 'bg-surface text-muted hover:bg-surface-alt'
                }`}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StatusIcon className="w-3.5 h-3.5" />}
                {getStatusLabel(s)}
              </button>
            );
          })}
        </div>
        {!isAvailable && (
          <p className="text-xs text-danger mt-2 font-medium">
            Deze caravan is niet zichtbaar voor klanten op de boekingspagina
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Specificaties</h4>
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Fabrikant</span>
              <span className="text-foreground font-medium">{caravan.manufacturer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Bouwjaar</span>
              <span className="text-foreground font-medium">{caravan.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Type</span>
              <span className="text-foreground font-medium">{caravan.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Max personen</span>
              <span className="text-foreground font-medium">{caravan.maxPersons}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Prijzen</h4>
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Per dag</span>
              <span className="text-foreground font-medium">{formatCurrency(caravan.pricePerDay)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Per week</span>
              <span className="text-foreground font-medium">{formatCurrency(caravan.pricePerWeek)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Borg</span>
              <span className="text-foreground font-medium">{formatCurrency(caravan.deposit)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Voorzieningen</h4>
        <div className="flex flex-wrap gap-1.5">
          {caravan.amenities.map((a) => (
            <span
              key={a}
              className="px-2.5 py-1 bg-white border border-border rounded-lg text-xs text-muted"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Boekingen {!loading && `(${bookings.length})`}
        </h4>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Laden...
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-muted">Totale omzet</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
            </div>
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{b.guest_name}</p>
                  <p className="text-xs text-muted">
                    {formatDate(b.check_in)} – {formatDate(b.check_out)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{formatCurrency(Number(b.total_price))}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Nog geen boekingen</p>
        )}
      </div>
    </div>
  );
}

export default function CaravansAdminPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<Record<string, CaravanSettingData>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [customCaravans, setCustomCaravans] = useState<CustomCaravan[]>([]);

  // New caravan modal state
  const [showNewCaravanModal, setShowNewCaravanModal] = useState(false);
  const [newCaravan, setNewCaravan] = useState({
    name: '', manufacturer: '', year: new Date().getFullYear(),
    type: 'FAMILIE' as string, maxPersons: 4, description: '',
    pricePerDay: 0, pricePerWeek: 0, deposit: 0,
    amenities: '' as string, inventory: '' as string,
    photos: '' as string,
  });
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError] = useState('');
  const [newSuccess, setNewSuccess] = useState('');

  // Delete modal state
  const [deleteCaravan, setDeleteCaravan] = useState<CustomCaravan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomCaravans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/caravans');
      const data = await res.json();
      setCustomCaravans(data.caravans || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // Fetch caravan settings
    fetch('/api/admin/caravan-settings')
      .then(res => res.json())
      .then(data => {
        const map: Record<string, CaravanSettingData> = {};
        (data.settings || []).forEach((s: CaravanSettingData) => { map[s.caravan_id] = s; });
        setSettings(map);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));

    // Fetch custom caravans
    fetchCustomCaravans();
  }, [fetchCustomCaravans]);

  // Fetch booking counts for all caravans
  useEffect(() => {
    const allIds = [...staticCaravans.map(c => c.id), ...customCaravans.map(c => c.id)];
    Promise.all(
      allIds.map(id =>
        fetch(`/api/admin/caravan-bookings?caravanId=${id}`)
          .then(res => res.json())
          .then(data => ({ id, count: (data.bookings || []).length }))
          .catch(() => ({ id, count: 0 }))
      )
    ).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(r => { counts[r.id] = r.count; });
      setBookingCounts(counts);
    });
  }, [customCaravans]);

  const handleSettingChange = (s: CaravanSettingData) => {
    setSettings(prev => ({ ...prev, [s.caravan_id]: s }));
  };

  const getEffectiveStatus = (caravan: Caravan) => {
    return settings[caravan.id]?.status || caravan.status;
  };

  // Merge static + custom caravans
  const allCaravans: (Caravan & { isCustom: boolean })[] = [
    ...staticCaravans.map(c => ({ ...c, isCustom: false })),
    ...customCaravans.map(c => ({ ...c, isCustom: true })),
  ];

  const filtered = allCaravans.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.reference.toLowerCase().includes(q) ||
      c.manufacturer.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  });

  const totalCaravans = allCaravans.length;
  const beschikbaar = allCaravans.filter((c) => getEffectiveStatus(c) === 'BESCHIKBAAR').length;
  const onderhoud = allCaravans.filter((c) => getEffectiveStatus(c) === 'ONDERHOUD').length;
  const nietBeschikbaar = allCaravans.filter((c) => getEffectiveStatus(c) === 'NIET_BESCHIKBAAR').length;

  const handleCreateCaravan = async () => {
    if (!newCaravan.name.trim() || !newCaravan.manufacturer.trim()) {
      setNewError('Naam en fabrikant zijn verplicht');
      return;
    }
    setSavingNew(true);
    setNewError('');
    try {
      const res = await fetch('/api/admin/caravans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCaravan.name.trim(),
          manufacturer: newCaravan.manufacturer.trim(),
          year: newCaravan.year,
          type: newCaravan.type,
          maxPersons: newCaravan.maxPersons,
          description: newCaravan.description.trim(),
          pricePerDay: newCaravan.pricePerDay,
          pricePerWeek: newCaravan.pricePerWeek,
          deposit: newCaravan.deposit,
          amenities: newCaravan.amenities.split(',').map(a => a.trim()).filter(Boolean),
          inventory: newCaravan.inventory.split(',').map(i => i.trim()).filter(Boolean),
          photos: newCaravan.photos.split('\n').map(p => p.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewError(data.error || 'Fout bij aanmaken');
        return;
      }
      setNewSuccess(`Caravan aangemaakt (${data.reference})`);
      fetchCustomCaravans();
      setTimeout(() => {
        setShowNewCaravanModal(false);
        setNewSuccess('');
        setNewCaravan({
          name: '', manufacturer: '', year: new Date().getFullYear(),
          type: 'FAMILIE', maxPersons: 4, description: '',
          pricePerDay: 0, pricePerWeek: 0, deposit: 0,
          amenities: '', inventory: '', photos: '',
        });
      }, 1500);
    } catch {
      setNewError('Er ging iets mis');
    } finally {
      setSavingNew(false);
    }
  };

  const handleDeleteCaravan = async () => {
    if (!deleteCaravan) return;
    setDeleting(true);
    try {
      await fetch('/api/admin/caravans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteCaravan.id }),
      });
      fetchCustomCaravans();
      setDeleteCaravan(null);
    } catch { /* silent */ }
    setDeleting(false);
  };

  const handlePhotosUpdate = (caravanId: string, photos: string[]) => {
    setCustomCaravans(prev =>
      prev.map(c => c.id === caravanId ? { ...c, photos } : c)
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Caravans beheren</h1>
          <p className="text-sm text-muted">{totalCaravans} caravan{totalCaravans !== 1 ? 's' : ''} in totaal</p>
        </div>
        <button
          onClick={() => { setShowNewCaravanModal(true); setNewError(''); setNewSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus size={18} />
          Nieuwe caravan
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalCaravans}</p>
          <p className="text-xs text-muted">Totaal</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary-dark">{beschikbaar}</p>
          <p className="text-xs text-muted">Beschikbaar</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-accent">{onderhoud}</p>
          <p className="text-xs text-muted">Onderhoud</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-danger">{nietBeschikbaar}</p>
          <p className="text-xs text-muted">Niet beschikbaar</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam, referentie, fabrikant..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((caravan) => {
          const isExpanded = expandedId === caravan.id;
          const effectiveStatus = getEffectiveStatus(caravan);
          const StatusIcon = getCaravanStatusIcon(effectiveStatus);
          const bookingCount = bookingCounts[caravan.id] || 0;

          return (
            <div key={caravan.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : caravan.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-surface transition-colors cursor-pointer"
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
                    <p className="font-semibold text-sm text-foreground">{caravan.name}</p>
                    <span className="text-xs text-muted">{caravan.reference}</span>
                    {caravan.isCustom && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded">
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
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
                  {caravan.isCustom && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteCaravan(caravan as CustomCaravan); }}
                      className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(caravan.pricePerWeek)}/wk</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCaravanStatusColor(effectiveStatus)}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {getStatusLabel(effectiveStatus)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5">
                  <CaravanDetail
                    caravan={caravan}
                    setting={settings[caravan.id] || null}
                    onSettingChange={handleSettingChange}
                    isCustom={caravan.isCustom}
                    onPhotosUpdate={caravan.isCustom ? (photos) => handlePhotosUpdate(caravan.id, photos) : undefined}
                  />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-lg">Geen caravans gevonden</p>
          </div>
        )}
      </div>

      {/* ===== NEW CARAVAN MODAL ===== */}
      {showNewCaravanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewCaravanModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Plus size={20} className="text-primary" />
                  Nieuwe caravan toevoegen
                </h2>
                <button onClick={() => setShowNewCaravanModal(false)} className="p-1.5 text-muted hover:text-foreground hover:bg-surface rounded-lg">
                  <X size={18} />
                </button>
              </div>

              {newError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <AlertTriangle size={16} /> {newError}
                </div>
              )}

              {newSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
                  <Check size={16} /> {newSuccess}
                </div>
              )}

              <div className="space-y-4">
                {/* Name + Manufacturer row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Naam <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newCaravan.name}
                      onChange={e => setNewCaravan(p => ({ ...p, name: e.target.value }))}
                      placeholder="bijv. Dethleffs Camper 560"
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Fabrikant <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newCaravan.manufacturer}
                      onChange={e => setNewCaravan(p => ({ ...p, manufacturer: e.target.value }))}
                      placeholder="bijv. Dethleffs"
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Type, Year, MaxPersons row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                    <select
                      value={newCaravan.type}
                      onChange={e => setNewCaravan(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    >
                      <option value="FAMILIE">Familie</option>
                      <option value="COMPACT">Compact</option>
                      <option value="LUXE">Luxe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Bouwjaar</label>
                    <input
                      type="number"
                      value={newCaravan.year}
                      onChange={e => setNewCaravan(p => ({ ...p, year: parseInt(e.target.value) || 2020 }))}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Max personen</label>
                    <input
                      type="number"
                      value={newCaravan.maxPersons}
                      onChange={e => setNewCaravan(p => ({ ...p, maxPersons: parseInt(e.target.value) || 2 }))}
                      min={1}
                      max={10}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Beschrijving</label>
                  <textarea
                    value={newCaravan.description}
                    onChange={e => setNewCaravan(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Beschrijving van de caravan..."
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Prijs/dag (€)</label>
                    <input
                      type="number"
                      value={newCaravan.pricePerDay || ''}
                      onChange={e => setNewCaravan(p => ({ ...p, pricePerDay: parseFloat(e.target.value) || 0 }))}
                      placeholder="75"
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Prijs/week (€)</label>
                    <input
                      type="number"
                      value={newCaravan.pricePerWeek || ''}
                      onChange={e => setNewCaravan(p => ({ ...p, pricePerWeek: parseFloat(e.target.value) || 0 }))}
                      placeholder="450"
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Borg (€)</label>
                    <input
                      type="number"
                      value={newCaravan.deposit || ''}
                      onChange={e => setNewCaravan(p => ({ ...p, deposit: parseFloat(e.target.value) || 0 }))}
                      placeholder="400"
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Voorzieningen <span className="text-muted font-normal">(kommagescheiden)</span>
                  </label>
                  <input
                    type="text"
                    value={newCaravan.amenities}
                    onChange={e => setNewCaravan(p => ({ ...p, amenities: e.target.value }))}
                    placeholder="Airco, Verwarming, Koelkast, Douche, Toilet, Luifel"
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Inventory */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Inventaris <span className="text-muted font-normal">(kommagescheiden)</span>
                  </label>
                  <input
                    type="text"
                    value={newCaravan.inventory}
                    onChange={e => setNewCaravan(p => ({ ...p, inventory: e.target.value }))}
                    placeholder="Dekbedden (4x), Kussens, Servies, Kookgerei"
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Foto URLs <span className="text-muted font-normal">(één per regel)</span>
                  </label>
                  <textarea
                    value={newCaravan.photos}
                    onChange={e => setNewCaravan(p => ({ ...p, photos: e.target.value }))}
                    rows={3}
                    placeholder={"https://voorbeeld.nl/foto1.jpg\nhttps://voorbeeld.nl/foto2.jpg"}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewCaravanModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted hover:bg-surface transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateCaravan}
                  disabled={savingNew}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingNew ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Caravan toevoegen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteCaravan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteCaravan(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Caravan verwijderen</h3>
                <p className="text-xs text-muted">Dit kan niet ongedaan worden gemaakt</p>
              </div>
            </div>
            <p className="text-sm text-muted mb-4">
              Weet je zeker dat je <strong className="text-foreground">{deleteCaravan.name}</strong> ({deleteCaravan.reference}) wilt verwijderen?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCaravan(null)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted hover:bg-surface"
              >
                Annuleren
              </button>
              <button
                onClick={handleDeleteCaravan}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
