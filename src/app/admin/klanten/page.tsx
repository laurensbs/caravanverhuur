'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  User,
  Mail,
  Phone,
  Loader2,
  Users,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Shield,
  MessageCircle,
  ChevronRight,
  ArrowLeft,
  FileText,
} from 'lucide-react';

import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  last_login: string | null;
}

interface ChatHistory {
  id: string;
  visitor_name: string | null;
  status: string;
  summary: string | null;
  created_at: string;
  last_message_at: string;
  message_count: number;
  last_message: string | null;
}

type ModalType = 'create' | 'edit' | 'delete' | null;

export default function AdminKlanten() {
  const { t, role, locale } = useAdmin();
  const { toast } = useToast();
  const isNl = locale === 'nl';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirmation
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Generated password display
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Customer detail view with communication
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Close modals on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modal) setModal(null);
        else if (detailCustomer) setDetailCustomer(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modal, detailCustomer]);
  const [customerChats, setCustomerChats] = useState<ChatHistory[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCustomerDetail = async (customer: Customer) => {
    setDetailCustomer(customer);
    setLoadingChats(true);
    try {
      const res = await fetch(`/api/admin/customers?action=chats&customerId=${customer.id}`);
      const data = await res.json();
      setCustomerChats(data.chats || []);
    } catch {
      setCustomerChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [search]);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return t('common.never');
    return new Date(d).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openCreateModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setShowPassword(false);
    setError('');
    setSuccess('');
    setGeneratedPassword('');
    setModal('create');
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormName(customer.name || '');
    setFormEmail(customer.email);
    setFormPhone(customer.phone || '');
    setError('');
    setSuccess('');
    setModal('edit');
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setAdminPassword('');
    setShowAdminPassword(false);
    setError('');
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedCustomer(null);
    setError('');
    setSuccess('');
    setGeneratedPassword('');
    setCopied(false);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      setError(t('customers.nameEmailRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || undefined,
          password: formPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('customers.createError'));
        return;
      }
      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword);
        setSuccess(t('customers.customerCreated'));
      } else {
        setSuccess(t('customers.customerCreatedSimple'));
        setTimeout(() => { closeModal(); }, 1200);
      }
      fetchCustomers();
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCustomer) return;
    if (!formName.trim() || !formEmail.trim()) {
      setError(t('customers.nameEmailRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('customers.updateError'));
        return;
      }
      setSuccess(t('customers.customerUpdated'));
      fetchCustomers();
      setTimeout(() => { closeModal(); }, 1000);
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (!adminPassword) {
      setError(t('customers.adminPasswordRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('customers.deleteError'));
        return;
      }
      fetchCustomers();
      closeModal();
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="text-primary" size={28} />
            {t('customers.title')}
          </h1>
          <p className="text-muted text-sm mt-1">
            {customers.length}  </p> </div> <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm" > <Plus size={18} /> Nieuwe klant </button> </div> {/* Search */} <div className="relative max-w-md"> <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /> <input type="text" placeholder={t("customers.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> {/* Stats cards */} <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4"> <div className="bg-white rounded-xl p-2.5 sm:p-4"> <div className="text-xl sm:text-2xl font-bold text-foreground">{customers.length}</div> <div className="text-xs text-muted mt-1">{t('customers.totalCustomers')}</div> </div> <div className="bg-white rounded-xl p-2.5 sm:p-4"> <div className="text-xl sm:text-2xl font-bold text-foreground"> {customers.filter(c => { if (!c.last_login) return false; const diff = Date.now() - new Date(c.last_login).getTime(); return diff < 7 * 24 * 60 * 60 * 1000; }).length} </div> <div className="text-xs text-muted mt-1">{t('customers.activeWeek')}</div> </div> <div className="bg-white rounded-xl p-2.5 sm:p-4"> <div className="text-xl sm:text-2xl font-bold text-foreground"> {customers.filter(c => c.phone).length} </div> <div className="text-xs text-muted mt-1">{t('customers.withPhone')}</div> </div> <div className="bg-white rounded-xl p-2.5 sm:p-4"> <div className="text-xl sm:text-2xl font-bold text-foreground"> {customers.filter(c => { const diff = Date.now() - new Date(c.created_at).getTime(); return diff < 30 * 24 * 60 * 60 * 1000; }).length} </div> <div className="text-xs text-muted mt-1">{t('customers.newMonth')}</div> </div> </div> {/* Table */} {filtered.length === 0 ? ( <div className="bg-white rounded-xl p-12 text-center"> <User size={48} className="mx-auto text-muted/50 mb-4" /> <p className="text-muted font-medium"> {search ?t('customers.noCustomers') : t('customers.noCustomersYet')}
          </p>
          <p className="text-muted text-sm mt-1">
            {search
              ? t('customers.tryOtherSearch')
              : t('customers.customersAppearHere')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface/50">
                  <th className="text-left px-4 py-3 font-medium text-muted">{t('customers.customer')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">{t('customers.email')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">{t('customers.phone')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">{t('customers.registered')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">{t('customers.lastLogin')}</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">{t('customers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-primary-50/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                          {customer.name
                            ? customer.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : customer.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">
                          {customer.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{customer.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {customer.phone || '—'} </td> <td className="px-4 py-3 text-muted"> {formatDate(customer.created_at)} </td> <td className="px-4 py-3"> <div className="flex items-center gap-1.5 text-muted"> <Clock size={14} /> <span>{formatDateTime(customer.last_login)}</span> </div> </td> <td className="px-4 py-3"> <div className="flex items-center justify-end gap-1"> <button onClick={() => openCustomerDetail(customer)} className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title={isNl ? 'Communicatie' : 'Communication'} > <MessageCircle size={15} /> </button> <button onClick={() => openEditModal(customer)} className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title={t("common.edit")} > <Pencil size={15} /> </button> <button onClick={() => openDeleteModal(customer)} className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t("common.delete")} > <Trash2 size={15} /> </button> </div> </td> </tr> ))} </tbody> </table> </div> {/* Mobile cards */} <div className="md:hidden"> {paginated.map(customer => ( <div key={customer.id} className="p-3 sm:p-4 space-y-1.5 sm:space-y-2"> <div className="flex items-center justify-between"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm"> {customer.name ? customer.name .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : customer.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {customer.name || t('customers.noName')}
                      </div>
                      <div className="text-xs text-muted">
                        {t('customers.registered')} {formatDate(customer.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCustomerDetail(customer)}
                      className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(customer)}
                      className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(customer)}
                      className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 pl-[52px]">
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-sm text-muted flex items-center gap-2 hover:text-primary"
                  >
                    <Mail size={14} className="text-muted" />
                    {customer.email}
                  </a>
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-sm text-muted flex items-center gap-2 hover:text-primary"
                    >
                      <Phone size={14} className="text-muted" />
                      {customer.phone}
                    </a>
                  )}
                  <div className="text-xs text-muted flex items-center gap-2 mt-1">
                    <Clock size={12} />
                    {t('customers.lastLogin')}: {formatDateTime(customer.last_login)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2 flex-wrap">
          <button onClick={() => setCurrentPage(1)} disabled={safePage <= 1} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">«</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">‹</button>
          {(() => {
            const pages: number[] = [];
            const start = Math.max(1, safePage - 2);
            const end = Math.min(totalPages, safePage + 2);
            if (start > 1) pages.push(1);
            if (start > 2) pages.push(-1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push(-2);
            if (end < totalPages) pages.push(totalPages);
            return pages.map((p, i) =>
              p < 0 ? <span key={`e${i}`} className="px-1 text-sm text-muted">…</span> : (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 text-sm rounded-lg transition-colors cursor-pointer ${safePage === p ? 'bg-primary text-white font-bold' : 'bg-white text-foreground hover:bg-surface'}`}>{p}</button>
              )
            );
          })()}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages} className="px-2 py-1.5 text-sm rounded-lg bg-white text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default">»</button>
        </div>
      )}

      {/* ===== CUSTOMER DETAIL PANEL ===== */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-stretch">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailCustomer(null)} />

          {/* Panel */}
          <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <button onClick={() => setDetailCustomer(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  {detailCustomer.name || detailCustomer.email}
                </h2>
                <button onClick={() => setDetailCustomer(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Customer info */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {detailCustomer.name
                      ? detailCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : detailCustomer.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{detailCustomer.name || '—'}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Mail size={12} />
                      <span>{detailCustomer.email}</span>
                    </div>
                    {detailCustomer.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <Phone size={12} />
                        <span>{detailCustomer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      <Clock size={12} />
                      <span>{t('customers.registered')} {formatDate(detailCustomer.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Communication section */}
              <div className="px-5 py-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <MessageCircle size={16} className="text-primary" />
                  {isNl ? 'Communicatie' : 'Communication'}
                  <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {customerChats.length}
                  </span>
                </h3>

                {loadingChats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : customerChats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">{isNl ? 'Geen chatgesprekken gevonden' : 'No chat conversations found'}</p>
                    <p className="text-xs mt-1">{isNl ? 'Gesprekken worden automatisch gekoppeld wanneer de klant ingelogd is' : 'Conversations are auto-linked when the customer is logged in'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerChats.map(chat => (
                      <div key={chat.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                chat.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                              }`}>
                                {chat.status === 'CLOSED' ? (isNl ? 'Gesloten' : 'Closed') : (isNl ? 'Actief' : 'Active')}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(chat.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {chat.message_count} {isNl ? 'berichten' : 'messages'}
                              </span>
                            </div>
                            {chat.last_message && (
                              <p className="text-xs text-gray-500 mt-1.5 truncate">
                                {chat.last_message}
                              </p>
                            )}
                            {chat.summary && (
                              <div className="mt-2 bg-white rounded-lg p-2.5 border border-gray-100">
                                <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 mb-1 flex items-center gap-1">
                                  <FileText size={10} />
                                  {isNl ? 'Samenvatting' : 'Summary'}
                                </p>
                                <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{chat.summary}</p>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={14} className="text-gray-300 mt-1 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Create / Edit Modal */}
            {(modal === 'create' || modal === 'edit') && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {modal === 'create'? ( <> <Plus size={20} className="text-primary" /> Nieuwe klant </> ) : ( <> <Pencil size={20} className="text-primary" /> Klant bewerken </> )} </h2> <button onClick={closeModal} className="p-1.5 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors" > <X size={18} /> </button> </div> {error && ( <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2"> <AlertTriangle size={16} /> {error} </div> )} {success && ( <div className="mb-4 p-3 bg-green-50 border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2"> <Check size={16} /> {success} </div> )} {generatedPassword && ( <div className="mb-4 p-4 bg-amber-50 border-amber-200 rounded-xl"> <p className="text-sm font-medium text-amber-800 mb-2"> {t('customers.generatedPassword')} </p> <div className="flex items-center gap-2"> <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-mono border-amber-200"> {generatedPassword} </code> <button onClick={copyPassword} className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors" title={t("common.copy")} > {copied ? <Check size={16} /> : <Copy size={16} />} </button> </div> </div> )} <div className="space-y-4"> <div> <label className="block text-sm font-medium text-foreground mb-1.5"> {t('customers.fullName')} <span className="text-red-500">*</span> </label> <div className="relative"> <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /> <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder={t("customers.fullName")} className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> </div> <div> <label className="block text-sm font-medium text-foreground mb-1.5"> {t('customers.email')} <span className="text-red-500">*</span> </label> <div className="relative"> <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /> <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder={t("customers.emailPlaceholder")} className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> </div> <div> <label className="block text-sm font-medium text-foreground mb-1.5"> Telefoon </label> <div className="relative"> <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /> <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder={t("customers.phonePlaceholder")} className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> </div> </div> {modal ==='create' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('customers.password')}
                        <span className="text-muted font-normal ml-1">{t('customers.passwordHint')}</span>
                      </label>
                      <div className="relative">
                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type={showPassword ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={t("customers.passwordPlaceholder")} className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /> <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground" > {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} </button> </div> </div> )} </div> <div className="flex gap-3 mt-6"> <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface transition-colors" > Annuleren </button> <button onClick={modal ==='create' ? handleCreate : handleEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {modal === 'create' ? t('common.create') : t('common.save')}
                  </button>
                </div>
              </div>
            )}

            {/* Delete confirmation modal */}
            {modal === 'delete'&& selectedCustomer && ( <div className="p-6"> <div className="flex items-center justify-between mb-6"> <h2 className="text-lg font-bold text-red-600 flex items-center gap-2"> <Trash2 size={20} /> Klant verwijderen </h2> <button onClick={closeModal} className="p-1.5 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors" > <X size={18} /> </button> </div> <div className="mb-4 p-4 bg-red-50 rounded-xl"> <div className="flex items-start gap-3"> <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" /> <div> <p className="text-sm font-medium text-red-800 mb-1"> {t('customers.deleteWarning')} </p> <p className="text-sm text-red-700"> {t('customers.deleteDetail', { name: selectedCustomer.name || selectedCustomer.email })} </p> </div> </div> </div> <div className="mb-4 p-3 bg-surface rounded-xl"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm"> {selectedCustomer.name ? selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : selectedCustomer.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {selectedCustomer.name || t('customers.noName')} </div> <div className="text-xs text-muted">{selectedCustomer.email}</div> </div> </div> </div> {error && ( <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2"> <AlertTriangle size={16} /> {error} </div> )} <div className="mb-4"> <label className="block text-sm font-medium text-foreground mb-1.5"> {t('customers.adminPasswordConfirm')} <span className="text-red-500">*</span> </label> <div className="relative"> <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /> <input type={showAdminPassword ?'text' : 'password'}
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder={t("customers.adminPasswordPlaceholder")}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    {t('customers.adminPasswordSecurity')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving || !adminPassword}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    {t('customers.permanentDelete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
