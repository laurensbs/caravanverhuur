"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Search, Calendar, CheckCircle2, Wrench, CalendarCheck, ChevronDown, ChevronUp,
  Loader2, XCircle, Power, Plus, Pencil, Trash2, X, Check, ImagePlus, Camera,
  AlertTriangle, RotateCcw, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAdmin } from "@/i18n/admin-context";
import { useToast } from "@/components/AdminToast";
import { usePageActions } from "@/app/admin/layout";
import { type Caravan } from "@/data/caravans";
import { formatCurrency, formatDate, getStatusColor, type Booking } from "@/data/admin";

interface CaravanSettingData {
  caravan_id: string;
  available: boolean;
  status: string;
  admin_notes: string | null;
}

interface AdminCaravan extends Caravan {
  isCustom: boolean;
  isStaticOverride?: boolean;
  videoUrl?: string;
  createdAt?: string;
}

interface CaravanFormData {
  name: string;
  photos: string;
}

function getCaravanStatusColor(status: string) {
  switch (status) {
    case "BESCHIKBAAR": return "bg-primary-50 text-primary-dark";
    case "ONDERHOUD": return "bg-primary-50 text-primary";
    case "GEBOEKT": return "bg-primary-50 text-primary";
    case "NIET_BESCHIKBAAR": return "bg-danger/10 text-danger";
    default: return "bg-surface-alt text-muted";
  }
}

function getCaravanStatusIcon(status: string) {
  switch (status) {
    case "BESCHIKBAAR": return CheckCircle2;
    case "ONDERHOUD": return Wrench;
    case "GEBOEKT": return CalendarCheck;
    case "NIET_BESCHIKBAAR": return XCircle;
    default: return CheckCircle2;
  }
}

function emptyFormData(): CaravanFormData {
  return { name: "", photos: "" };
}

function caravanToFormData(c: AdminCaravan): CaravanFormData {
  return { name: c.name, photos: c.photos.join("\n") };
}

/* ── CaravanFormModal ── */
function CaravanFormModal({ isOpen, onClose, onSave, initialData, isEdit, saving }: {
  isOpen: boolean; onClose: () => void;
  onSave: (data: CaravanFormData) => void;
  initialData: CaravanFormData; isEdit: boolean; saving: boolean;
}) {
  const { t } = useAdmin();
  const [form, setForm] = useState<CaravanFormData>(initialData);
  const [error, setError] = useState("");

  useEffect(() => { if (isOpen) { setForm(initialData); setError(""); } }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!form.name.trim()) { setError("Naam is verplicht"); return; }
    setError("");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              {isEdit ? <Pencil size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
              {isEdit ? t("caravans.editCaravanTitle") : t("caravans.newCaravan")}
            </h2>
            <button onClick={onClose} className="p-1.5 text-muted hover:text-foreground hover:bg-surface rounded-lg cursor-pointer"><X size={18} /></button>
          </div>

          {error && (<div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2"><AlertTriangle size={16} />{error}</div>)}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.name")} <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={t("caravans.namePlaceholder")} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.photoUrls")}</label>
              {form.photos.trim() && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                  {form.photos.split("\n").map(p => p.trim()).filter(Boolean).map((photoUrl, i) => (
                    <div key={i} className="relative w-24 h-18 shrink-0 rounded-lg overflow-hidden group border border-gray-200">
                      <Image src={photoUrl} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="96px" />
                      <button
                        type="button"
                        onClick={() => {
                          const photos = form.photos.split("\n").map(p => p.trim()).filter(Boolean);
                          photos.splice(i, 1);
                          setForm(p => ({ ...p, photos: photos.join("\n") }));
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                      <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded">{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
              <textarea value={form.photos} onChange={e => setForm(p => ({ ...p, photos: e.target.value }))}
                rows={3} placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-xs border border-gray-200" />
              <p className="text-[11px] text-muted mt-1">{t("caravans.photoUrlsHint")}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface transition-colors cursor-pointer">{t("common.cancel")}</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isEdit ? t("caravans.saveChanges") : t("caravans.addCaravanBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── CaravanDetail ── */
function CaravanDetail({ caravan, setting, onSettingChange, onEdit, onPhotosUpdate }: {
  caravan: AdminCaravan; setting: CaravanSettingData | null;
  onSettingChange: (s: CaravanSettingData) => void; onEdit: () => void;
  onPhotosUpdate?: (photos: string[]) => void;
}) {
  const { t, ts } = useAdmin();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currentStatus = setting?.status || "BESCHIKBAAR";
  const isAvailable = setting?.available !== false;
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/caravan-bookings?caravanId=${caravan.id}`)
      .then(res => res.json()).then(data => setBookings(data.bookings || []))
      .catch((e) => { console.error('Fetch error:', e); }).finally(() => setLoading(false));
  }, [caravan.id]);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const newAvailable = newStatus === "BESCHIKBAAR";
    try {
      await fetch("/api/admin/caravan-settings", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caravanId: caravan.id, available: newAvailable, status: newStatus }) });
      onSettingChange({ caravan_id: caravan.id, available: newAvailable, status: newStatus, admin_notes: setting?.admin_notes || null });
    } catch { toast(t('common.actionFailed'), 'error'); }
    setSaving(false);
  };

  const savePhotos = async (updatedPhotos: string[]) => {
    setPhotoSaving(true);
    try {
      const isStaticCaravan = !caravan.isCustom;
      await fetch("/api/admin/caravans", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: caravan.id, photos: updatedPhotos, isStaticOverride: isStaticCaravan }) });
      if (onPhotosUpdate) onPhotosUpdate(updatedPhotos);
    } catch { toast(t('common.actionFailed'), 'error'); }
    setPhotoSaving(false);
  };

  const addPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    await savePhotos([...caravan.photos, newPhotoUrl.trim()]);
    setNewPhotoUrl("");
  };
  const removePhoto = async (index: number) => {
    await savePhotos(caravan.photos.filter((_, i) => i !== index));
  };
  const movePhoto = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= caravan.photos.length) return;
    const photos = [...caravan.photos];
    [photos[index], photos[newIndex]] = [photos[newIndex], photos[index]];
    await savePhotos(photos);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="bg-surface rounded-2xl p-3 sm:p-5 mt-2 space-y-3 sm:space-y-5">
      <div className="flex justify-end">
        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer">
          <Pencil size={14} />{t("caravans.editBtn")}
        </button>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />{t("caravans.photos", { count: String(caravan.photos.length) })}
          </h4>
          <button onClick={() => setShowPhotoModal(!showPhotoModal)} className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 cursor-pointer">
            <ImagePlus size={14} />{t("caravans.addPhoto")}
          </button>
        </div>
        {showPhotoModal && (
          <div className="mb-3 p-3 bg-white rounded-xl space-y-2">
            <input type="url" value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} placeholder={t("caravans.photoPlaceholder")}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPhoto(); } }}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
            {newPhotoUrl.trim() && (
              <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200">
                <Image src={newPhotoUrl.trim()} alt="Preview" fill className="object-cover" sizes="128px" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={addPhoto} disabled={!newPhotoUrl.trim() || photoSaving}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center gap-1 cursor-pointer">
                {photoSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}{t("caravans.addPhoto")}
              </button>
              <button onClick={() => { setShowPhotoModal(false); setNewPhotoUrl(""); }} className="px-3 py-1.5 rounded-lg text-xs text-muted hover:bg-surface cursor-pointer">{t("common.cancel")}</button>
            </div>
          </div>
        )}
        {caravan.photos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {caravan.photos.map((photo, i) => (
              <div key={i} className="relative w-32 h-24 shrink-0 rounded-xl overflow-hidden group">
                <Image src={photo} alt={`${caravan.name} foto ${i + 1}`} fill className="object-cover" sizes="128px" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" title={t("common.delete")}><X size={10} /></button>
                {i > 0 && (
                  <button onClick={() => movePhoto(i, -1)} className="absolute left-1 top-1/2 -translate-y-1/2 p-0.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" title={t("caravans.moveLeft")}><ChevronLeft size={12} /></button>
                )}
                {i < caravan.photos.length - 1 && (
                  <button onClick={() => movePhoto(i, 1)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" title={t("caravans.moveRight")}><ChevronRight size={12} /></button>
                )}
                <span className={`absolute bottom-1 left-1 text-white text-[9px] px-1.5 py-0.5 rounded font-medium ${i === 0 ? 'bg-primary' : 'bg-black/60'}`}>{i === 0 ? '★' : i + 1}</span>
              </div>
            ))}
          </div>
        ) : (<p className="text-sm text-muted italic">{t("caravans.noPhotos")}</p>)}
      </div>

      {/* Availability */}
      <div className="bg-white rounded-xl p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5"><Power className="w-3.5 h-3.5" />{t("caravans.manageAvailability")}</h4>
        <div className="flex flex-wrap gap-2">
          {(["BESCHIKBAAR", "ONDERHOUD", "NIET_BESCHIKBAAR"] as const).map((s) => {
            const isActive = currentStatus === s;
            const StatusIcon = getCaravanStatusIcon(s);
            return (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={saving || isActive}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-60 ${isActive ? `${getCaravanStatusColor(s)} ring-2 ring-offset-1 ring-current` : "bg-surface text-muted hover:bg-surface-alt"}`}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StatusIcon className="w-3.5 h-3.5" />}{ts(s)}
              </button>
            );
          })}
        </div>
        {!isAvailable && (<p className="text-xs text-danger mt-2 font-medium">{t("caravans.notVisibleWarning")}</p>)}
      </div>

      {/* Bookings */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("caravans.bookings")} {!loading && `(${bookings.length})`}</h4>
        {loading ? (<div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}</div>
        ) : bookings.length > 0 ? (
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3 flex items-center justify-between"><span className="text-sm text-muted">{t("caravans.totalRevenue")}</span><span className="text-sm font-bold text-foreground">{formatCurrency(totalRevenue)}</span></div>
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-xl p-3 flex items-center justify-between text-sm">
                <div><p className="font-medium text-foreground">{b.guest_name}</p><p className="text-xs text-muted">{formatDate(b.check_in)} – {formatDate(b.check_out)}</p></div>
                <div className="flex items-center gap-2"><span className="font-medium text-foreground">{formatCurrency(Number(b.total_price))}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>{ts(b.status)}</span></div>
              </div>
            ))}
          </div>
        ) : (<p className="text-sm text-muted">{t("caravans.noBookingsYet")}</p>)}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function CaravansAdminPage() {
  const { t, ts } = useAdmin();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<Record<string, CaravanSettingData>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [allCaravans, setAllCaravans] = useState<AdminCaravan[]>([]);

  // Modal states
  const [editingCaravan, setEditingCaravan] = useState<AdminCaravan | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteCaravan, setDeleteCaravan] = useState<AdminCaravan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetCaravan, setResetCaravan] = useState<AdminCaravan | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteCaravan) setDeleteCaravan(null);
        else if (resetCaravan) setResetCaravan(null);
        else if (editingCaravan) setEditingCaravan(null);
        else if (showNewModal) setShowNewModal(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [deleteCaravan, resetCaravan, editingCaravan, showNewModal]);

  const fetchCaravans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/caravans");
      const data = await res.json();
      setAllCaravans(data.caravans || []);
    } catch { toast(t('common.actionFailed'), 'error'); }
  }, []);

  useEffect(() => {
    fetch("/api/admin/caravan-settings")
      .then(res => res.json())
      .then(data => {
        const map: Record<string, CaravanSettingData> = {};
        (data.settings || []).forEach((s: CaravanSettingData) => { map[s.caravan_id] = s; });
        setSettings(map);
      })
      .catch((e) => { console.error('Fetch error:', e); })
      .finally(() => setLoadingSettings(false));
    fetchCaravans();
  }, [fetchCaravans]);

  usePageActions(
    useMemo(() => (
      <>
        <button onClick={() => fetchCaravans()} className="p-2 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer" title="Refresh">
          <RefreshCw size={18} />
        </button>
        <button onClick={() => setShowNewModal(true)} className="p-2 bg-primary-dark text-white rounded-xl hover:bg-primary-dark/90 transition-colors cursor-pointer" title={t('caravans.newCaravan')}>
          <Plus size={18} />
        </button>
      </>
    ), [fetchCaravans, t])
  );

  useEffect(() => {
    if (allCaravans.length === 0) return;
    Promise.all(
      allCaravans.map(c =>
        fetch(`/api/admin/caravan-bookings?caravanId=${c.id}`).then(r => r.json()).then(d => ({ id: c.id, count: (d.bookings || []).length }))
      )
    ).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(r => { counts[r.id] = r.count; });
      setBookingCounts(counts);
    }).catch(() => {});
  }, [allCaravans]);

  const handleCreateCaravan = async (formData: CaravanFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/caravans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          manufacturer: '-',
          year: new Date().getFullYear(),
          maxPersons: 4,
          description: '',
          pricePerDay: 79, pricePerWeek: 550, deposit: 400,
          amenities: ['Koelkast', 'Kookplaat (3 pits)', 'Toilet', 'Luifel'],
          inventory: [],
          photos: formData.photos.split("\n").map(p => p.trim()).filter(Boolean),
        }),
      });
      if (res.ok) { fetchCaravans(); setShowNewModal(false); toast(t('common.created'), 'success'); }
    } catch { toast(t('common.actionFailed'), 'error'); }
    setSaving(false);
  };

  const handleEditCaravan = async (formData: CaravanFormData) => {
    if (!editingCaravan) return;
    setSaving(true);
    try {
      const isStaticCaravan = !editingCaravan.isCustom;
      const body: Record<string, unknown> = {
        id: editingCaravan.id,
        name: formData.name.trim(),
        photos: formData.photos.split("\n").map(p => p.trim()).filter(Boolean),
      };
      if (isStaticCaravan) body.isStaticOverride = true;
      const res = await fetch("/api/admin/caravans", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { fetchCaravans(); setEditingCaravan(null); toast(t('common.saved'), 'success'); }
    } catch { toast(t('common.actionFailed'), 'error'); }
    setSaving(false);
  };

  const handleDeleteCaravan = async () => {
    if (!deleteCaravan) return;
    setDeleting(true);
    try {
      await fetch("/api/admin/caravans", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteCaravan.id }),
      });
      fetchCaravans(); setDeleteCaravan(null); toast(t('common.deleted'), 'success');
    } catch { toast(t('common.actionFailed'), 'error'); }
    setDeleting(false);
  };

  const handleResetCaravan = async () => {
    if (!resetCaravan) return;
    setResetting(true);
    try {
      await fetch("/api/admin/caravans", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetCaravan.id }),
      });
      fetchCaravans(); setResetCaravan(null); toast(t('common.saved'), 'success');
    } catch { toast(t('common.actionFailed'), 'error'); }
    setResetting(false);
  };

  const handleSettingChange = (s: CaravanSettingData) => {
    setSettings(prev => ({ ...prev, [s.caravan_id]: s }));
  };

  const handlePhotosUpdate = (caravanId: string, photos: string[]) => {
    setAllCaravans(prev => prev.map(c => c.id === caravanId ? { ...c, photos } : c));
  };

  const getEffectiveStatus = (caravan: AdminCaravan) => {
    const s = settings[caravan.id];
    if (s?.status) return s.status;
    return "BESCHIKBAAR";
  };

  const totalCaravans = allCaravans.length;
  const beschikbaar = allCaravans.filter(c => getEffectiveStatus(c) === "BESCHIKBAAR").length;
  const onderhoud = allCaravans.filter(c => getEffectiveStatus(c) === "ONDERHOUD").length;
  const nietBeschikbaar = allCaravans.filter(c => getEffectiveStatus(c) === "NIET_BESCHIKBAAR").length;

  const filtered = allCaravans.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q);
  });

  if (loadingSettings) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-foreground">{totalCaravans}</p><p className="text-xs text-muted">{t("common.total")}</p></div>
        <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-primary-dark">{beschikbaar}</p><p className="text-xs text-muted">{t("caravans.available")}</p></div>
        <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-primary">{onderhoud}</p><p className="text-xs text-muted">{t("caravans.maintenance")}</p></div>
        <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-danger">{nietBeschikbaar}</p><p className="text-xs text-muted">{t("caravans.unavailable")}</p></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("caravans.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark" />
      </div>

      <div className="space-y-2">
        {filtered.map(caravan => {
          const isExpanded = expandedId === caravan.id;
          const effectiveStatus = getEffectiveStatus(caravan);
          const StatusIcon = getCaravanStatusIcon(effectiveStatus);
          const bookingCount = bookingCounts[caravan.id] || 0;

          return (
            <div key={caravan.id} className="bg-white rounded-2xl overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : caravan.id)}
                className="w-full px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-2 sm:gap-4 text-left hover:bg-surface transition-colors cursor-pointer">
                {caravan.photos[0] && (
                  <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 hidden sm:block">
                    <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover" sizes="64px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{caravan.name}</p>
                    <span className="text-xs text-muted">{caravan.reference}</span>
                    {caravan.isCustom && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded">CUSTOM</span>
                    )}
                    {caravan.isStaticOverride && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">AANGEPAST</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
                    <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {caravan.photos.length} foto&apos;s</span>
                    {bookingCount > 0 && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {bookingCount} boeking{bookingCount !== 1 ? "en" : ""}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditingCaravan(caravan); }}
                    className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title={t("caravans.editBtn")}>
                    <Pencil size={15} />
                  </button>
                  {caravan.isStaticOverride && (
                    <button onClick={e => { e.stopPropagation(); setResetCaravan(caravan); }}
                      className="p-2 text-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" title={t("caravans.resetToDefault")}>
                      <RotateCcw size={15} />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); setDeleteCaravan(caravan); }}
                    className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title={t("common.delete")}>
                    <Trash2 size={15} />
                  </button>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCaravanStatusColor(effectiveStatus)}`}>
                    <StatusIcon className="w-3 h-3" />{ts(effectiveStatus)}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </div>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 sm:px-5 sm:pb-5">
                  <CaravanDetail caravan={caravan} setting={settings[caravan.id] || null}
                    onSettingChange={handleSettingChange} onEdit={() => setEditingCaravan(caravan)}
                    onPhotosUpdate={photos => handlePhotosUpdate(caravan.id, photos)} />
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted"><p className="text-lg">{t("caravans.noCaravans")}</p></div>
        )}
      </div>

      <CaravanFormModal isOpen={showNewModal} onClose={() => setShowNewModal(false)}
        onSave={handleCreateCaravan} initialData={emptyFormData()} isEdit={false} saving={saving} />

      <CaravanFormModal isOpen={!!editingCaravan} onClose={() => setEditingCaravan(null)}
        onSave={handleEditCaravan} initialData={editingCaravan ? caravanToFormData(editingCaravan) : emptyFormData()}
        isEdit={true} saving={saving} />

      {deleteCaravan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteCaravan(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full"><Trash2 size={20} className="text-red-600" /></div>
              <div><h3 className="font-bold text-foreground">{t("caravans.deleteCaravan")}</h3><p className="text-xs text-muted">{t("caravans.cannotUndo")}</p></div>
            </div>
            <p className="text-sm text-muted mb-4">{t("caravans.deleteConfirm", { name: deleteCaravan.name + " (" + deleteCaravan.reference + ")" })}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCaravan(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface cursor-pointer">{t("common.cancel")}</button>
              <button onClick={handleDeleteCaravan} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetCaravan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResetCaravan(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full"><RotateCcw size={20} className="text-amber-600" /></div>
              <div><h3 className="font-bold text-foreground">{t("caravans.resetToDefault")}</h3><p className="text-xs text-muted">{t("caravans.resetConfirm")}</p></div>
            </div>
            <p className="text-sm text-muted mb-4">{resetCaravan.name} ({resetCaravan.reference})</p>
            <div className="flex gap-3">
              <button onClick={() => setResetCaravan(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface cursor-pointer">{t("common.cancel")}</button>
              <button onClick={handleResetCaravan} disabled={resetting}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {resetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}{t("caravans.resetToDefault")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
