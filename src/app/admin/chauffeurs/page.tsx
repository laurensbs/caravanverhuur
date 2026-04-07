'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  Phone,
  User,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Truck,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export default function ChauffeurPage() {
  const { t } = useAdmin();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchDrivers = () => {
    fetch('/api/admin/drivers')
      .then(res => res.json())
      .then(data => setDrivers(data.drivers || []))
      .catch(() => toast(t('common.error'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() || undefined }),
      });
      if (res.ok) {
        setNewName('');
        setNewPhone('');
        setShowAdd(false);
        fetchDrivers();
        toast(t('common.saved'), 'success');
      }
    } catch {
      toast(t('common.error'), 'error');
    }
    setAdding(false);
  };

  const handleToggle = async (driver: Driver) => {
    try {
      await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: driver.id, active: !driver.active }),
      });
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, active: !d.active } : d));
      toast(t('common.saved'), 'success');
    } catch {
      toast(t('common.error'), 'error');
    }
  };

  const startEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setEditName(driver.name);
    setEditPhone(driver.phone || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSavingId(id);
    try {
      await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim(), phone: editPhone.trim() || undefined }),
      });
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, name: editName.trim(), phone: editPhone.trim() || null } : d));
      setEditingId(null);
      toast(t('common.saved'), 'success');
    } catch {
      toast(t('common.error'), 'error');
    }
    setSavingId(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch('/api/admin/drivers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setDrivers(prev => prev.filter(d => d.id !== id));
      setDeleteConfirmId(null);
      toast(t('common.saved'), 'success');
    } catch {
      toast(t('common.error'), 'error');
    }
    setDeletingId(null);
  };

  const activeCount = drivers.filter(d => d.active).length;
  const inactiveCount = drivers.filter(d => !d.active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{drivers.length}</p>
          <p className="text-xs text-muted">{t('drivers.total')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-muted">{t('drivers.active')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
          <p className="text-xs text-muted">{t('drivers.inactive')}</p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-sm text-blue-800">
        <p className="font-semibold flex items-center gap-2 mb-1">
          <Truck className="w-4 h-4" /> {t('drivers.whatIsThis')}
        </p>
        <p className="text-xs text-blue-700 leading-relaxed">{t('drivers.explanation')}</p>
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {drivers.length} {t('drivers.driversFound')}
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary-dark/90 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('drivers.add')}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl p-4 space-y-3 border-2 border-primary/20">
          <h3 className="font-semibold text-sm text-foreground">{t('drivers.addTitle')}</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('drivers.namePlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder={t('drivers.phonePlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-xl text-sm font-medium hover:bg-primary-dark/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('drivers.addBtn')}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(''); setNewPhone(''); }}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Drivers list */}
      <div className="space-y-1.5 sm:space-y-2">
        {drivers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Truck className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">{t('drivers.noDrivers')}</p>
            <p className="text-xs text-muted mt-1">{t('drivers.addFirst')}</p>
          </div>
        ) : (
          drivers.map((driver) => (
            <div
              key={driver.id}
              className={`bg-white rounded-2xl px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4 transition-all ${
                !driver.active ? 'opacity-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                driver.active ? 'bg-primary-100 text-primary-dark' : 'bg-gray-100 text-gray-400'
              }`}>
                {driver.name.charAt(0).toUpperCase()}
              </div>

              {/* Name & phone */}
              {editingId === driver.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(driver.id)}
                  />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder={t('drivers.phonePlaceholder')}
                    className="flex-1 px-3 py-1.5 bg-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(driver.id)}
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSaveEdit(driver.id)} disabled={savingId === driver.id}
                      className="p-1.5 rounded-lg bg-primary-dark text-white hover:bg-primary-dark/90 cursor-pointer disabled:opacity-50">
                      {savingId === driver.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => startEdit(driver)} className="flex-1 min-w-0 text-left cursor-pointer">
                  <p className="font-semibold text-sm text-foreground">{driver.name}</p>
                  {driver.phone && (
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {driver.phone}
                    </p>
                  )}
                </button>
              )}

              {/* Toggle active */}
              <button
                onClick={() => handleToggle(driver)}
                className="shrink-0 cursor-pointer"
                title={driver.active ? t('drivers.deactivate') : t('drivers.activate')}
              >
                {driver.active ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-300" />
                )}
              </button>

              {/* Delete */}
              {deleteConfirmId === driver.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(driver.id)}
                    disabled={deletingId === driver.id}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === driver.id ? '...' : t('drivers.confirmDelete')}
                  </button>
                  <button onClick={() => setDeleteConfirmId(null)} className="px-1 py-1 text-xs text-muted cursor-pointer">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(driver.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors cursor-pointer shrink-0"
                  title={t('drivers.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
