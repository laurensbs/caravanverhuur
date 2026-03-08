"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Search, Users, Calendar, CheckCircle2, Wrench, CalendarCheck, ChevronDown, ChevronUp,
  Loader2, XCircle, Power, Plus, Pencil, Trash2, X, Check, ImagePlus, Camera,
  AlertTriangle, RotateCcw, Video,
} from "lucide-react";
import { useAdmin } from "@/i18n/admin-context";
import { type Caravan } from "@/data/caravans";
import { formatCurrency, formatDate, getStatusColor, type Booking } from "@/data/admin";

const KNOWN_AMENITIES = [
  "Airco", "Verwarming", "Warmtepomp", "Koelkast", "Kookplaat", "Magnetron",
  "Douche", "Toilet", "TV", "Luifel", "Voortent", "Grondzeil",
  "Rondzit", "Treinzit", "Frans bed", "Vast bed", "Stapelbed",
  "Fietsdrager", "Buitentafel",
];

const KNOWN_INVENTORY = [
  "Dekbedden", "Kussens", "Servies", "Kookgerei", "Handdoeken",
  "Toiletpapier", "Schoonmaakmiddelen", "Bezem", "Emmer",
  "Afwasmiddel", "Vuilniszakken",
];

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
  manufacturer: string;
  year: number;
  type: string;
  maxPersons: number;
  description: string;
  pricePerDay: number;
  pricePerWeek: number;
  deposit: number;
  amenities: string[];
  inventory: string[];
  photos: string;
  videoUrl: string;
  customAmenity: string;
  customInventory: string;
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
  return {
    name: "", manufacturer: "", year: new Date().getFullYear(), type: "FAMILIE",
    maxPersons: 4, description: "", pricePerDay: 0, pricePerWeek: 0, deposit: 0,
    amenities: [], inventory: [], photos: "", videoUrl: "",
    customAmenity: "", customInventory: "",
  };
}

function caravanToFormData(c: AdminCaravan): CaravanFormData {
  return {
    name: c.name, manufacturer: c.manufacturer, year: c.year, type: c.type,
    maxPersons: c.maxPersons, description: c.description,
    pricePerDay: c.pricePerDay, pricePerWeek: c.pricePerWeek, deposit: c.deposit,
    amenities: [...c.amenities], inventory: [...(c.inventory || [])],
    photos: c.photos.join("\n"), videoUrl: c.videoUrl || "",
    customAmenity: "", customInventory: "",
  };
}

/* ── CheckboxGroup ── */
function CheckboxGroup({ label, knownItems, selected, onToggle, customValue, onCustomChange, onAddCustom, customPlaceholder }: {
  label: string; knownItems: string[]; selected: string[];
  onToggle: (item: string) => void; customValue: string;
  onCustomChange: (v: string) => void; onAddCustom: () => void; customPlaceholder: string;
}) {
  const customItems = selected.filter(s => !knownItems.includes(s));
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {knownItems.map(item => {
          const active = selected.includes(item);
          return (
            <button key={item} type="button" onClick={() => onToggle(item)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${active ? "bg-primary text-white" : "bg-surface text-muted hover:bg-surface-alt"}`}>
              {item}
            </button>
          );
        })}
        {customItems.map(item => (
          <button key={item} type="button" onClick={() => onToggle(item)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/80 text-white cursor-pointer">
            {item} <X size={10} className="inline ml-1" />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={customValue} onChange={e => onCustomChange(e.target.value)}
          placeholder={customPlaceholder} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAddCustom(); } }}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
        <button type="button" onClick={onAddCustom} disabled={!customValue.trim()}
          className="px-2.5 py-1.5 bg-surface text-muted rounded-lg text-xs hover:bg-surface-alt disabled:opacity-40 cursor-pointer">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
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
  const [success, setSuccess] = useState("");

  useEffect(() => { if (isOpen) { setForm(initialData); setError(""); setSuccess(""); } }, [isOpen, initialData]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleAmenity = (item: string) => {
    setForm(p => ({ ...p, amenities: p.amenities.includes(item) ? p.amenities.filter(a => a !== item) : [...p.amenities, item] }));
  };
  const addCustomAmenity = () => {
    const v = form.customAmenity.trim();
    if (v && !form.amenities.includes(v)) { setForm(p => ({ ...p, amenities: [...p.amenities, v], customAmenity: "" })); }
  };
  const toggleInventory = (item: string) => {
    setForm(p => ({ ...p, inventory: p.inventory.includes(item) ? p.inventory.filter(i => i !== item) : [...p.inventory, item] }));
  };
  const addCustomInventory = () => {
    const v = form.customInventory.trim();
    if (v && !form.inventory.includes(v)) { setForm(p => ({ ...p, inventory: [...p.inventory, v], customInventory: "" })); }
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.manufacturer.trim()) { setError(t("caravans.nameManufacturerRequired")); return; }
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
          {success && (<div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2"><Check size={16} />{success}</div>)}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.name")} <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t("caravans.namePlaceholder")} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.manufacturer")} <span className="text-red-500">*</span></label>
                <input type="text" value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer: e.target.value }))}
                  placeholder={t("caravans.manufacturerPlaceholder")} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.type")}</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white border border-gray-200">
                  <option value="FAMILIE">{t("caravans.family")}</option>
                  <option value="COMPACT">{t("caravans.compact")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.buildYear")}</label>
                <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) || 2020 }))}
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.maxPersons")}</label>
                <input type="number" value={form.maxPersons} onChange={e => setForm(p => ({ ...p, maxPersons: parseInt(e.target.value) || 2 }))}
                  min={1} max={10} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.description")}</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3} placeholder={t("caravans.descriptionPlaceholder")}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none border border-gray-200" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.priceDay")}</label>
                <input type="number" value={form.pricePerDay || ""} onChange={e => setForm(p => ({ ...p, pricePerDay: parseFloat(e.target.value) || 0 }))}
                  placeholder="75" className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.priceWeek")}</label>
                <input type="number" value={form.pricePerWeek || ""} onChange={e => setForm(p => ({ ...p, pricePerWeek: parseFloat(e.target.value) || 0 }))}
                  placeholder="450" className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.depositAmount")}</label>
                <input type="number" value={form.deposit || ""} onChange={e => setForm(p => ({ ...p, deposit: parseFloat(e.target.value) || 0 }))}
                  placeholder="400" className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
              </div>
            </div>

            <CheckboxGroup label={t("caravans.amenitiesLabel")} knownItems={KNOWN_AMENITIES} selected={form.amenities}
              onToggle={toggleAmenity} customValue={form.customAmenity}
              onCustomChange={v => setForm(p => ({ ...p, customAmenity: v }))} onAddCustom={addCustomAmenity}
              customPlaceholder={t("caravans.customAmenityPlaceholder")} />

            <CheckboxGroup label={t("caravans.inventoryLabel")} knownItems={KNOWN_INVENTORY} selected={form.inventory}
              onToggle={toggleInventory} customValue={form.customInventory}
              onCustomChange={v => setForm(p => ({ ...p, customInventory: v }))} onAddCustom={addCustomInventory}
              customPlaceholder={t("caravans.customInventoryPlaceholder")} />

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.videoUrl")}</label>
              <input type="url" value={form.videoUrl} onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
                placeholder={t("caravans.videoUrlPlaceholder")}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">{t("caravans.photoUrls")}</label>
              <textarea value={form.photos} onChange={e => setForm(p => ({ ...p, photos: e.target.value }))}
                rows={3} placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-xs border border-gray-200" />
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
      .catch(() => {}).finally(() => setLoading(false));
  }, [caravan.id]);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const newAvailable = newStatus === "BESCHIKBAAR";
    try {
      await fetch("/api/admin/caravan-settings", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caravanId: caravan.id, available: newAvailable, status: newStatus }) });
      onSettingChange({ caravan_id: caravan.id, available: newAvailable, status: newStatus, admin_notes: setting?.admin_notes || null });
    } catch { /* silent */ }
    setSaving(false);
  };

  const savePhotos = async (updatedPhotos: string[]) => {
    setPhotoSaving(true);
    try {
      const isStaticCaravan = !caravan.isCustom;
      await fetch("/api/admin/caravans", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: caravan.id, photos: updatedPhotos, isStaticOverride: isStaticCaravan }) });
      if (onPhotosUpdate) onPhotosUpdate(updatedPhotos);
    } catch { /* silent */ }
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
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
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
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" title={t("common.delete")}><X size={10} /></button>
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

      {/* Specs + Prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("caravans.specifications")}</h4>
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("caravans.manufacturer")}</span><span className="text-foreground font-medium">{caravan.manufacturer}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t("caravans.buildYear")}</span><span className="text-foreground font-medium">{caravan.year}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t("caravans.type")}</span><span className="text-foreground font-medium">{caravan.type}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t("caravans.maxPersons")}</span><span className="text-foreground font-medium">{caravan.maxPersons}</span></div>
            {caravan.videoUrl && (
              <div className="flex justify-between"><span className="text-muted">Video</span>
                <a href={caravan.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1"><Video size={14} /> YouTube</a></div>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("caravans.prices")}</h4>
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("caravans.perDay")}</span><span className="text-foreground font-medium">{formatCurrency(caravan.pricePerDay)}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t("caravans.perWeek")}</span><span className="text-foreground font-medium">{formatCurrency(caravan.pricePerWeek)}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t("caravans.deposit")}</span><span className="text-foreground font-medium">{formatCurrency(caravan.deposit)}</span></div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("caravans.amenities")}</h4>
        <div className="flex flex-wrap gap-1.5">{caravan.amenities.map(a => (<span key={a} className="px-2.5 py-1 bg-white rounded-lg text-xs text-muted">{a}</span>))}</div>
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

  // Close modals on Escape
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
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch("/api/admin/caravan-settings")
      .then(res => res.json())
      .then(data => {
        const map: Record<string, CaravanSettingData> = {};
        (data.settings || []).forEach((s: CaravanSettingData) => { map[s.caravan_id] = s; });
        setSettings(map);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
    fetchCaravans();
  }, [fetchCaravans]);

  useEffect(() => {
    if (allCaravans.length === 0) return;
    Promise.all(
      allCaravans.map(c =>
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
  }, [allCaravans]);

  const handleSettingChange = (s: CaravanSettingData) => {
    setSettings(prev => ({ ...prev, [s.caravan_id]: s }));
  };

  const getEffectiveStatus = (caravan: AdminCaravan) => settings[caravan.id]?.status || caravan.status;

  const filtered = allCaravans.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q) ||
      c.manufacturer.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
  });

  const totalCaravans = allCaravans.length;
  const beschikbaar = allCaravans.filter(c => getEffectiveStatus(c) === "BESCHIKBAAR").length;
  const onderhoud = allCaravans.filter(c => getEffectiveStatus(c) === "ONDERHOUD").length;
  const nietBeschikbaar = allCaravans.filter(c => getEffectiveStatus(c) === "NIET_BESCHIKBAAR").length;

  const handleCreateCaravan = async (formData: CaravanFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/caravans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(), manufacturer: formData.manufacturer.trim(),
          year: formData.year, type: formData.type, maxPersons: formData.maxPersons,
          description: formData.description.trim(),
          pricePerDay: formData.pricePerDay, pricePerWeek: formData.pricePerWeek, deposit: formData.deposit,
          amenities: formData.amenities, inventory: formData.inventory,
          photos: formData.photos.split("\n").map(p => p.trim()).filter(Boolean),
          videoUrl: formData.videoUrl.trim() || undefined,
        }),
      });
      if (res.ok) { fetchCaravans(); setShowNewModal(false); }
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleEditCaravan = async (formData: CaravanFormData) => {
    if (!editingCaravan) return;
    setSaving(true);
    try {
      const isStaticCaravan = !editingCaravan.isCustom;
      const body: Record<string, unknown> = {
        id: editingCaravan.id,
        name: formData.name.trim(), manufacturer: formData.manufacturer.trim(),
        year: formData.year, type: formData.type, maxPersons: formData.maxPersons,
        description: formData.description.trim(),
        pricePerDay: formData.pricePerDay, pricePerWeek: formData.pricePerWeek, deposit: formData.deposit,
        amenities: formData.amenities, inventory: formData.inventory,
        photos: formData.photos.split("\n").map(p => p.trim()).filter(Boolean),
        videoUrl: formData.videoUrl.trim() || undefined,
      };
      if (isStaticCaravan) body.isStaticOverride = true;
      const res = await fetch("/api/admin/caravans", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { fetchCaravans(); setEditingCaravan(null); }
    } catch { /* silent */ }
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
      fetchCaravans(); setDeleteCaravan(null);
    } catch { /* silent */ }
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
      fetchCaravans(); setResetCaravan(null);
    } catch { /* silent */ }
    setResetting(false);
  };

  const handlePhotosUpdate = (caravanId: string, photos: string[]) => {
    setAllCaravans(prev => prev.map(c => c.id === caravanId ? { ...c, photos } : c));
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("caravans.title")}</h1>
          <p className="text-sm text-muted">{totalCaravans} caravan{totalCaravans !== 1 ? "s" : ""} {t("caravans.inTotal")}</p>
        </div>
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm cursor-pointer">
          <Plus size={18} />{t("caravans.newCaravan")}
        </button>
      </div>

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
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {caravan.maxPersons}p</span>
                    <span>{caravan.type}</span>
                    <span>{caravan.manufacturer} {caravan.year}</span>
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
                  {caravan.isCustom && (
                    <button onClick={e => { e.stopPropagation(); setDeleteCaravan(caravan); }}
                      className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title={t("common.delete")}>
                      <Trash2 size={15} />
                    </button>
                  )}
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(caravan.pricePerWeek)}/wk</p>
                  </div>
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

      {/* New Caravan Modal */}
      <CaravanFormModal isOpen={showNewModal} onClose={() => setShowNewModal(false)}
        onSave={handleCreateCaravan} initialData={emptyFormData()} isEdit={false} saving={saving} />

      {/* Edit Caravan Modal */}
      <CaravanFormModal isOpen={!!editingCaravan} onClose={() => setEditingCaravan(null)}
        onSave={handleEditCaravan} initialData={editingCaravan ? caravanToFormData(editingCaravan) : emptyFormData()}
        isEdit={true} saving={saving} />

      {/* Delete Modal */}
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

      {/* Reset Modal */}
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
