'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Send,
  Calendar,
  MapPin,
  Newspaper,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Tag,
  Users,
  Eye,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Newsletter {
  id: string;
  title: string;
  content: string;
  category: string;
  event_date: string | null;
  event_location: string | null;
  status: string;
  sent_at: string | null;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

type ModalType = 'create' | 'edit' | 'preview' | 'send' | 'delete' | null;

const CATEGORIES = [
  { value: 'algemeen', label: 'Algemeen nieuws', emoji: '📣' },
  { value: 'activiteit', label: 'Activiteit', emoji: '🎉' },
  { value: 'feestdag', label: 'Feestdag', emoji: '🎊' },
  { value: 'markt', label: 'Markt', emoji: '🛍️' },
  { value: 'evenement', label: 'Evenement', emoji: '🎭' },
];

function getCategoryInfo(cat: string) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminNieuwsbrieven() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'concept' | 'verzonden'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Newsletter | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendResult, setSendResult] = useState<{ sentCount: number; totalEmails: number } | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('algemeen');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');

  const fetchNewsletters = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletters');
      const data = await res.json();
      setNewsletters(data.newsletters || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  const filtered = newsletters.filter(n => {
    const q = search.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || n.status === filterStatus;
    const matchCategory = filterCategory === 'all' || n.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('algemeen');
    setFormEventDate('');
    setFormEventLocation('');
    setError('');
    setSuccess('');
    setSendResult(null);
  };

  const openCreate = () => {
    resetForm();
    setSelected(null);
    setModal('create');
  };

  const openEdit = (n: Newsletter) => {
    setSelected(n);
    setFormTitle(n.title);
    setFormContent(n.content);
    setFormCategory(n.category);
    setFormEventDate(n.event_date ? new Date(n.event_date).toISOString().split('T')[0] : '');
    setFormEventLocation(n.event_location || '');
    setError('');
    setSuccess('');
    setModal('edit');
  };

  const openPreview = (n: Newsletter) => {
    setSelected(n);
    setModal('preview');
  };

  const openSend = (n: Newsletter) => {
    setSelected(n);
    setError('');
    setSuccess('');
    setSendResult(null);
    setModal('send');
  };

  const openDelete = (n: Newsletter) => {
    setSelected(n);
    setError('');
    setModal('delete');
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setError('Titel en inhoud zijn verplicht');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: formTitle,
        content: formContent,
        category: formCategory,
        eventDate: formEventDate || null,
        eventLocation: formEventLocation || null,
      };

      if (modal === 'edit' && selected) {
        const res = await fetch('/api/admin/newsletters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selected.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch('/api/admin/newsletters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      setModal(null);
      fetchNewsletters();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', id: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSendResult({ sentCount: data.sentCount, totalEmails: data.totalEmails });
      setSuccess(`Nieuwsbrief verzonden naar ${data.sentCount} van ${data.totalEmails} ontvangers`);
      fetchNewsletters();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/newsletters?id=${selected.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModal(null);
      fetchNewsletters();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const totalCount = newsletters.length;
  const conceptCount = newsletters.filter(n => n.status === 'concept').length;
  const sentCount = newsletters.filter(n => n.status === 'verzonden').length;
  const totalRecipients = newsletters.reduce((sum, n) => sum + (n.sent_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Totaal', value: totalCount, icon: Newspaper, color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10' },
          { label: 'Concepten', value: conceptCount, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Verzonden', value: sentCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Totaal ontvangers', value: totalRecipients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Zoeken..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-48"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'concept' | 'verzonden')}
            className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">Alle statussen</option>
            <option value="concept">Concepten</option>
            <option value="verzonden">Verzonden</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">Alle categorieën</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          Nieuwe nieuwsbrief
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-border">
          <Newspaper className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground">Geen nieuwsbrieven gevonden</p>
          <p className="text-sm text-muted mt-1">
            {newsletters.length === 0 ? 'Maak je eerste nieuwsbrief aan' : 'Pas je zoekopdracht aan'}
          </p>
          {newsletters.length === 0 && (
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4 inline -mt-0.5 mr-1" />
              Nieuwsbrief aanmaken
            </button>
          )}
        </div>
      )}

      {/* Newsletter list */}
      <div className="space-y-3">
        {filtered.map((n) => {
          const cat = getCategoryInfo(n.category);
          const isSent = n.status === 'verzonden';

          return (
            <div
              key={n.id}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FAFAF9] text-foreground border border-border">
                      {cat.emoji} {cat.label}
                    </span>
                    {isSent ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                        Verzonden
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                        Concept
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-foreground truncate">{n.title}</h3>
                  <p className="text-sm text-muted mt-0.5 line-clamp-2">{n.content}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted flex-wrap">
                    {n.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(n.event_date)}
                      </span>
                    )}
                    {n.event_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {n.event_location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(n.created_at)}
                    </span>
                    {isSent && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {n.sent_count} ontvangers
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openPreview(n)}
                    className="p-2 rounded-lg hover:bg-[#FAFAF9] transition cursor-pointer"
                    title="Voorbeeld"
                  >
                    <Eye className="w-4 h-4 text-muted" />
                  </button>
                  {!isSent && (
                    <>
                      <button
                        onClick={() => openEdit(n)}
                        className="p-2 rounded-lg hover:bg-[#FAFAF9] transition cursor-pointer"
                        title="Bewerken"
                      >
                        <Pencil className="w-4 h-4 text-muted" />
                      </button>
                      <button
                        onClick={() => openSend(n)}
                        className="p-2 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                        title="Verzenden"
                      >
                        <Send className="w-4 h-4 text-emerald-600" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openDelete(n)}
                    className="p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => { if (!saving) { setModal(null); resetForm(); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Create / Edit Modal */}
              {(modal === 'create' || modal === 'edit') && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {modal === 'create' ? <Plus className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                      {modal === 'create' ? 'Nieuwe nieuwsbrief' : 'Nieuwsbrief bewerken'}
                    </h2>
                    <button onClick={() => { setModal(null); resetForm(); }} className="p-1.5 hover:bg-muted/10 rounded-lg cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        <Tag className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                        Categorie
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CATEGORIES.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setFormCategory(c.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer border ${
                              formCategory === c.value
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-[#FAFAF9] border-border text-muted hover:text-foreground'
                            }`}
                          >
                            {c.emoji} {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        <Newspaper className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                        Titel *
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="bijv. Zomermarkt in Lloret de Mar"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          <Calendar className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                          Datum evenement
                        </label>
                        <input
                          type="date"
                          value={formEventDate}
                          onChange={(e) => setFormEventDate(e.target.value)}
                          className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          <MapPin className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                          Locatie
                        </label>
                        <input
                          type="text"
                          value={formEventLocation}
                          onChange={(e) => setFormEventLocation(e.target.value)}
                          className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="bijv. Lloret de Mar"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        <FileText className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                        Inhoud *
                      </label>
                      <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                        placeholder="Schrijf hier de inhoud van je nieuwsbrief. Elke regel wordt een aparte paragraaf in de e-mail."
                      />
                      <p className="text-xs text-muted mt-1">Elke nieuwe regel wordt een aparte paragraaf in de e-mail</p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => { setModal(null); resetForm(); }}
                        className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#FAFAF9] transition cursor-pointer"
                        disabled={saving}
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : modal === 'create' ? (
                          'Opslaan als concept'
                        ) : (
                          'Wijzigingen opslaan'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Modal */}
              {modal === 'preview' && selected && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Voorbeeld
                    </h2>
                    <button onClick={() => setModal(null)} className="p-1.5 hover:bg-muted/10 rounded-lg cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Email preview */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="bg-[#FAFAF9] px-5 py-3 border-b border-border text-sm text-muted">
                      <span className="font-medium text-foreground">Onderwerp:</span> {getCategoryInfo(selected.category).emoji} {selected.title}
                    </div>
                    <div className="p-6 bg-white">
                      <div className="text-center mb-4">
                        <span className="inline-block bg-[#F0F9FF] text-[#0284C7] text-xs font-semibold px-3 py-1 rounded-full">
                          {getCategoryInfo(selected.category).emoji} {getCategoryInfo(selected.category).label}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground text-center mb-4">{selected.title}</h3>

                      {(selected.event_date || selected.event_location) && (
                        <div className="bg-[#FAFAF9] border border-border rounded-lg p-4 mb-4">
                          {selected.event_date && (
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted">📅 Datum</span>
                              <span className="font-semibold">{formatDate(selected.event_date)}</span>
                            </div>
                          )}
                          {selected.event_location && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted">📍 Locatie</span>
                              <span className="font-semibold">{selected.event_location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {selected.content.split('\n').filter(l => l.trim()).map((line, i) => (
                        <p key={i} className="text-sm text-foreground mb-3 leading-relaxed">{line}</p>
                      ))}

                      <hr className="my-4 border-border" />

                      <div className="bg-[#F0F9FF] border border-[#7DD3FC] rounded-xl p-4 mb-4">
                        <p className="text-sm text-foreground">
                          Wil je de Costa Brava zelf ervaren? Bekijk onze beschikbare caravans en boek jouw perfecte vakantie.
                        </p>
                      </div>

                      <div className="text-center">
                        <span className="inline-block bg-[#0284C7] text-white px-6 py-3 rounded-xl font-semibold text-sm">
                          Bekijk caravans →
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setModal(null)}
                      className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#FAFAF9] transition cursor-pointer"
                    >
                      Sluiten
                    </button>
                    {selected.status !== 'verzonden' && (
                      <button
                        onClick={() => openSend(selected)}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Verzenden
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Send Confirmation Modal */}
              {modal === 'send' && selected && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Send className="w-5 h-5 text-emerald-600" />
                      Nieuwsbrief verzenden
                    </h2>
                    <button onClick={() => { setModal(null); resetForm(); }} className="p-1.5 hover:bg-muted/10 rounded-lg cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {!sendResult ? (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800 mb-1">Let op!</p>
                            <p className="text-sm text-amber-700">
                              Deze nieuwsbrief wordt naar alle geregistreerde klanten en gasten gestuurd. Dit kan niet ongedaan worden gemaakt.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FAFAF9] border border-border rounded-xl p-4 mb-5">
                        <p className="text-sm font-semibold text-foreground mb-1">{selected.title}</p>
                        <p className="text-xs text-muted">{getCategoryInfo(selected.category).emoji} {getCategoryInfo(selected.category).label}</p>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 mb-4">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setModal(null); resetForm(); }}
                          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#FAFAF9] transition cursor-pointer"
                          disabled={saving}
                        >
                          Annuleren
                        </button>
                        <button
                          onClick={handleSend}
                          disabled={saving}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Bezig met verzenden...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Ja, verzenden
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">Nieuwsbrief verzonden!</h3>
                        <p className="text-sm text-muted">
                          Succesvol verzonden naar <span className="font-semibold text-foreground">{sendResult.sentCount}</span> van {sendResult.totalEmails} ontvangers
                        </p>
                      </div>

                      {success && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-2.5 mb-4">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          {success}
                        </div>
                      )}

                      <button
                        onClick={() => { setModal(null); resetForm(); }}
                        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition cursor-pointer"
                      >
                        Sluiten
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {modal === 'delete' && selected && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Nieuwsbrief verwijderen
                    </h2>
                    <button onClick={() => setModal(null)} className="p-1.5 hover:bg-muted/10 rounded-lg cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-muted mb-4">
                    Weet je zeker dat je <span className="font-semibold text-foreground">&ldquo;{selected.title}&rdquo;</span> wilt verwijderen?
                    Dit kan niet ongedaan worden gemaakt.
                  </p>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 mb-4">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModal(null)}
                      className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-[#FAFAF9] transition cursor-pointer"
                      disabled={saving}
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verwijderen'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
