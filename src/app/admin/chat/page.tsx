'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Search,
  Send,
  User,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Globe,
  Circle,
  Trash2,
  Link2,
  FileText,
  Sparkles,
  Zap,
  UserPlus,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';

/* ── Types ────────────────────────────────────── */
interface ChatConversation {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  customer_id: string | null;
  summary: string | null;
  status: string;
  needs_human: boolean;
  assigned_to: string | null;
  locale: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
  last_message: string | null;
  last_message_role: string | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'bot' | 'staff';
  message: string;
  created_at: string;
}

interface CustomerResult {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

// Pure relative-time formatter — gehoist buiten de component zodat de
// React Compiler 'm niet als impure-during-render flagged.
function formatRelativeTime(dateStr: string, isNl: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return isNl ? 'Zojuist' : 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

/* ── Component ────────────────────────────────── */
export default function AdminChatPage() {
  const { t, locale } = useAdmin();
  const { toast } = useToast();
  const isNl = locale === 'nl';

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'needs_human' | 'active' | 'closed'>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCanned, setShowCanned] = useState(false);

  const cannedResponses = isNl ? [
    { label: '👋 Begroeting', text: 'Hallo! Bedankt voor je bericht. Waarmee kan ik je helpen?' },
    { label: '📅 Beschikbaarheid', text: 'Ik ga de beschikbaarheid voor je controleren. Welke periode had je in gedachten?' },
    { label: '💰 Prijzen', text: 'Onze prijzen beginnen vanaf €45/nacht. Bekijk gerust onze website voor actuele tarieven: caravanverhuurspanje.com/caravans' },
    { label: '📞 Contact', text: 'Je kunt ons ook bereiken via het contactformulier op onze website of per e-mail.' },
    { label: '✅ Afsluiting', text: 'Graag gedaan! Als je nog vragen hebt, laat het gerust weten. Fijne dag!' },
  ] : [
    { label: '👋 Greeting', text: 'Hello! Thank you for your message. How can I help you?' },
    { label: '📅 Availability', text: 'I will check the availability for you. Which period did you have in mind?' },
    { label: '💰 Prices', text: 'Our prices start from €45/night. Feel free to check our website for current rates: caravanverhuurspanje.com/caravans' },
    { label: '📞 Contact', text: 'You can also reach us via the contact form on our website or by email.' },
    { label: '✅ Closing', text: 'You\'re welcome! If you have any more questions, feel free to ask. Have a great day!' },
  ];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* ── Fetch conversations ────────────── */
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chat');
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
      } else if (data.conversations && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  /* ── Poll conversations every 15s (pauses when tab is hidden) ── */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const start = () => { interval = setInterval(fetchConversations, 15000); };
    const handleVisibility = () => {
      clearInterval(interval);
      if (document.visibilityState === 'visible') {
        fetchConversations(); // immediate refresh on return
        start();
      }
    };
    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVisibility); };
  }, [fetchConversations]);

  /* ── Fetch messages for active conversation ── */
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/admin/chat?id=${convId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch { /* silent */ }
  }, []);

  /* ── Poll messages every 8s when chat is open (pauses when hidden) ── */
  useEffect(() => {
    if (!activeConv) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    fetchMessages(activeConv.id);
    const startPoll = () => {
      pollingRef.current = setInterval(() => fetchMessages(activeConv.id), 8000);
    };
    startPoll();

    const handleVis = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (document.visibilityState === 'visible') {
        fetchMessages(activeConv.id);
        startPoll();
      }
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [activeConv, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* ── Send reply ──────────────────── */
  const handleSend = async () => {
    if (!reply.trim() || !activeConv) return;
    setSending(true);
    try {
      await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConv.id,
          message: reply.trim(),
          staffName: isNl ? 'Medewerker' : 'Staff',
        }),
      });
      setReply('');
      fetchMessages(activeConv.id);
      fetchConversations();
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setSending(false);
  };

  /* ── Close conversation ─────────── */
  const handleClose = async (convId: string) => {
    try {
      // Generate summary from user messages before closing
      const conv = messages.filter(m => m.role === 'user').map(m => m.message);
      if (conv.length > 0) {
        const summary = conv.slice(0, 10).map((msg, i) => `${i + 1}. ${msg.length > 80 ? msg.slice(0, 80) + '...' : msg}`).join('\n');
        await fetch('/api/admin/chat', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: convId, summary }),
        });
      }

      await fetch('/api/admin/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, status: 'CLOSED' }),
      });
      fetchConversations();
      if (activeConv?.id === convId) setActiveConv(null);
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
  };

  /* ── Delete conversation ────────── */
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [cleanupConfirm, setCleanupConfirm] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  /* ── Multi-select ────────────────── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    try {
      const res = await fetch('/api/admin/chat?action=bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      toast(isNl ? `${data.deleted || selectedIds.size} gesprek(ken) verwijderd` : `${data.deleted || selectedIds.size} conversation(s) deleted`, 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setSelectedIds(new Set());
    setSelectMode(false);
    setDeleteConfirm(null);
    fetchConversations();
    if (activeConv && selectedIds.has(activeConv.id)) {
      setActiveConv(null);
      setMessages([]);
    }
  };

  const handleDeleteAllClosed = async () => {
    try {
      const res = await fetch('/api/admin/chat?action=closed', { method: 'DELETE' });
      const data = await res.json();
      toast(isNl ? `${data.deleted || 0} gesloten gesprek(ken) verwijderd` : `${data.deleted || 0} closed conversation(s) deleted`, 'success');
      fetchConversations();
      if (activeConv && activeConv.status === 'CLOSED') {
        setActiveConv(null);
        setMessages([]);
      }
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setDeleteConfirm(null);
  };

  /* ── Customer Linking ────────────── */
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [linking, setLinking] = useState(false);

  const searchCustomers = async (q: string) => {
    setCustomerSearch(q);
    if (q.length < 2) { setCustomerResults([]); return; }
    setSearchingCustomers(true);
    try {
      const res = await fetch(`/api/admin/chat?action=searchCustomers&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCustomerResults(data.customers || []);
    } catch { setCustomerResults([]); }
    setSearchingCustomers(false);
  };

  const handleLinkCustomer = async (customerId: string) => {
    if (!activeConv) return;
    setLinking(true);
    try {
      await fetch('/api/admin/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConv.id, customerId }),
      });
      toast(isNl ? 'Klant gekoppeld' : 'Customer linked', 'success');
      setShowLinkModal(false);
      setCustomerSearch('');
      setCustomerResults([]);
      // Update activeConv to show link
      setActiveConv({ ...activeConv, customer_id: customerId });
      fetchConversations();
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setLinking(false);
  };

  // Close modals on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null);
        else if (cleanupConfirm) setCleanupConfirm(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [deleteConfirm, cleanupConfirm]);

  const handleDelete = async (convId: string) => {
    try {
      await fetch(`/api/admin/chat?id=${convId}`, { method: 'DELETE' });
      fetchConversations();
      if (activeConv?.id === convId) {
        setActiveConv(null);
        setMessages([]);
      }
      setDeleteConfirm(null);
      toast(t('common.deleted'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
  };

  const handleCleanup = async () => {
    try {
      const res = await fetch('/api/cron/cleanup-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setCleanupResult(
        isNl
          ? `${data.deleted || 0} oude chat(s) verwijderd`
          : `${data.deleted || 0} old chat(s) deleted`
      );
      setCleanupConfirm(false);
      fetchConversations();
      setTimeout(() => setCleanupResult(null), 4000);
    } catch {
      setCleanupResult(isNl ? 'Opschonen mislukt' : 'Cleanup failed');
      setTimeout(() => setCleanupResult(null), 4000);
    }
  };

  /* ── Filtering ──────────────────── */
  const filtered = conversations.filter(c => {
    if (filter === 'needs_human' && !c.needs_human) return false;
    if (filter === 'active' && c.status !== 'ACTIVE') return false;
    if (filter === 'closed' && c.status !== 'CLOSED') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.visitor_name?.toLowerCase().includes(q)) ||
        (c.visitor_email?.toLowerCase().includes(q)) ||
        (c.last_message?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const needsHumanCount = conversations.filter(c => c.needs_human && c.status === 'ACTIVE').length;

  const getStatusBadge = (conv: ChatConversation) => {
    if (conv.status === 'CLOSED') return { color: 'bg-gray-100 text-gray-600', label: isNl ? 'Gesloten' : 'Closed' };
    if (conv.needs_human) return { color: 'bg-red-100 text-red-700', label: isNl ? 'Hulp nodig' : 'Needs help' };
    if (conv.last_message_role === 'user') return { color: 'bg-amber-100 text-amber-700', label: isNl ? 'Wacht' : 'Waiting' };
    return { color: 'bg-green-100 text-green-700', label: isNl ? 'Actief' : 'Active' };
  };

  const timeAgo = (dateStr: string) => formatRelativeTime(dateStr, isNl);

  /* ── Render ─────────────────────── */
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Sidebar: Conversation List ── */}
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] md:border-r border-gray-200 bg-gray-50`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {needsHumanCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {needsHumanCount}
                </span>
              )}
              <button onClick={() => fetchConversations()}
                className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title={isNl ? 'Vernieuwen' : 'Refresh'}>
                <RefreshCw className="w-4 h-4" />
              </button>
              {selectMode && selectedIds.size > 0 && (
                <button
                  onClick={() => setDeleteConfirm('bulk')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {selectedIds.size}
                </button>
              )}
              {selectMode && (
                <button
                  onClick={() => {
                    const allFilteredIds = new Set(filtered.map(c => c.id));
                    const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));
                    setSelectedIds(allSelected ? new Set() : allFilteredIds);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  {filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))
                    ? (isNl ? 'Deselecteer' : 'Deselect all')
                    : (isNl ? 'Selecteer alles' : 'Select all')}
                </button>
              )}
              <button
                onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {selectMode ? (isNl ? 'Klaar' : 'Done') : (isNl ? 'Selecteer' : 'Select')}
              </button>
              <div className="relative">
              {cleanupResult && (
                <div className="absolute right-0 top-full mt-1 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200 whitespace-nowrap z-10 shadow-sm">
                  {cleanupResult}
                </div>
              )}
              {cleanupConfirm ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCleanup}
                    className="px-2.5 py-1 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    {isNl ? 'Bevestigen' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setCleanupConfirm(false)}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {isNl ? 'Annuleer' : 'Cancel'}
                  </button>
                </div>
              ) : deleteConfirm === 'all-closed' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDeleteAllClosed}
                    className="px-2.5 py-1 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    {isNl ? 'Bevestigen' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {isNl ? 'Annuleer' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {conversations.some(c => c.status === 'CLOSED') && (
                    <button
                      onClick={() => setDeleteConfirm('all-closed')}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title={isNl ? 'Alle gesloten chats verwijderen' : 'Delete all closed chats'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isNl ? 'Gesloten' : 'Closed'}
                    </button>
                  )}
                  <button
                    onClick={() => setCleanupConfirm(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title={isNl ? 'Oude chats opschonen (30+ dagen)' : 'Clean up old chats (30+ days)'}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isNl ? 'Opschonen' : 'Cleanup'}
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none border border-gray-200"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5">
            {([
              { key: 'all', label: isNl ? 'Alles' : 'All' },
              { key: 'needs_human', label: isNl ? 'Hulp nodig' : 'Needs help' },
              { key: 'active', label: isNl ? 'Actief' : 'Active' },
              { key: 'closed', label: isNl ? 'Gesloten' : 'Closed' },
            ] as { key: typeof filter; label: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                  filter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                {f.key === 'needs_human' && needsHumanCount > 0 && (
                  <span className="ml-1 bg-white/30 px-1 rounded-full">{needsHumanCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {isNl ? 'Geen gesprekken gevonden' : 'No conversations found'}
            </div>
          ) : (
            filtered.map(conv => {
              const badge = getStatusBadge(conv);
              const isActive = activeConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  className={`group relative w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-colors ${
                    isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  } ${selectMode ? 'pl-10' : ''}`}
                >
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(conv.id)}
                      onChange={() => toggleSelect(conv.id)}
                      className="absolute left-3 top-5 w-4 h-4 accent-primary cursor-pointer"
                    />
                  )}
                  <button
                    onClick={() => selectMode ? toggleSelect(conv.id) : setActiveConv(conv)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                            {conv.visitor_name || (isNl ? 'Bezoeker' : 'Visitor')}
                            {conv.customer_id && (
                              <span title={isNl ? 'Gekoppelde klant' : 'Linked customer'}><Link2 className="w-3 h-3 text-green-600" /></span>
                            )}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-gray-400 group-hover:hidden">{timeAgo(conv.last_message_at || conv.created_at)}</span>
                            {!selectMode && deleteConfirm !== conv.id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(conv.id); }}
                                className="hidden group-hover:flex p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title={isNl ? 'Verwijder gesprek' : 'Delete conversation'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {conv.last_message || (isNl ? 'Nieuw gesprek' : 'New conversation')}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                          {conv.visitor_email && <Mail className="w-3 h-3 text-gray-400" />}
                          {conv.visitor_phone && <Phone className="w-3 h-3 text-gray-400" />}
                          {conv.summary && <span title={isNl ? 'Samenvatting beschikbaar' : 'Summary available'}><FileText className="w-3 h-3 text-blue-400" /></span>}
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" />
                            {conv.locale?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {conv.needs_human && conv.status === 'ACTIVE' && (
                        <Circle className="w-2.5 h-2.5 text-red-500 fill-red-500 shrink-0 mt-2 animate-pulse" />
                      )}
                    </div>
                  </button>
                  {/* Delete confirmation */}
                  {deleteConfirm === conv.id && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-200 p-1.5 z-10">
                      <button
                        onClick={() => handleDelete(conv.id)}
                        className="px-2 py-1 text-[10px] font-medium bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                      >
                        {isNl ? 'Verwijder' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-[10px] font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 cursor-pointer"
                      >
                        {isNl ? 'Annuleer' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bulk delete confirmation */}
      {deleteConfirm === 'bulk' && selectedIds.size > 0 && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {isNl ? `${selectedIds.size} gesprek(ken) verwijderen?` : `Delete ${selectedIds.size} conversation(s)?`}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {isNl ? 'Dit kan niet ongedaan worden gemaakt.' : 'This cannot be undone.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer">
                {isNl ? 'Annuleer' : 'Cancel'}
              </button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer">
                {isNl ? 'Verwijderen' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link customer modal */}
      {showLinkModal && activeConv && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                {isNl ? 'Koppel aan klant' : 'Link to customer'}
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={e => searchCustomers(e.target.value)}
                placeholder={isNl ? 'Zoek op naam of e-mail...' : 'Search by name or email...'}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none border border-gray-200"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {searchingCustomers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              ) : customerResults.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {customerSearch.length < 2
                    ? (isNl ? 'Typ minstens 2 tekens...' : 'Type at least 2 characters...')
                    : (isNl ? 'Geen klanten gevonden' : 'No customers found')}
                </p>
              ) : (
                customerResults.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleLinkCustomer(c.id)}
                    disabled={linking}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {c.name ? c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : c.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{c.email}</p>
                    </div>
                    <Link2 className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main: Chat View ── */}
      <div className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-white">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {activeConv.visitor_name || (isNl ? 'Bezoeker' : 'Visitor')}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  {activeConv.visitor_email && (
                    <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{activeConv.visitor_email}</span>
                  )}
                  {activeConv.visitor_phone && (
                    <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{activeConv.visitor_phone}</span>
                  )}
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(activeConv.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeConv.customer_id ? (
                  <span className="px-2 py-1 text-[10px] font-medium bg-green-50 text-green-700 rounded-full flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    {isNl ? 'Klant' : 'Customer'}
                  </span>
                ) : (
                  <button
                    onClick={() => { setShowLinkModal(true); setCustomerSearch(''); setCustomerResults([]); }}
                    className="px-2.5 py-1.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded-full flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer"
                    title={isNl ? 'Koppel aan klant' : 'Link to customer'}
                  >
                    <UserPlus className="w-3 h-3" />
                    {isNl ? 'Koppel klant' : 'Link customer'}
                  </button>
                )}
                {activeConv.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleClose(activeConv.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isNl ? 'Sluiten' : 'Close'}
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirm(activeConv.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isNl ? 'Verwijder' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : msg.role === 'staff' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${
                    msg.role === 'user'
                      ? 'bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-gray-100'
                      : msg.role === 'staff'
                      ? 'bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5'
                      : 'bg-gray-100 text-gray-500 rounded-xl px-3 py-2 text-xs italic'
                  }`}>
                    {msg.role === 'staff' && (
                      <p className="text-[10px] text-white/60 mb-0.5 font-medium">
                        {isNl ? 'Jij' : 'You'}
                      </p>
                    )}
                    {msg.role === 'user' && (
                      <p className="text-[10px] text-gray-400 mb-0.5 font-medium">
                        {activeConv.visitor_name || (isNl ? 'Bezoeker' : 'Visitor')}
                      </p>
                    )}
                    {msg.role === 'bot' && (
                      <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Luna (bot)</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === 'staff' ? 'text-white/50' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            {activeConv.status === 'ACTIVE' && (
              <div className="border-t border-gray-200 bg-white">
                {showCanned && (
                  <div className="px-3 pt-2 flex gap-1.5 flex-wrap">
                    {cannedResponses.map((cr, i) => (
                      <button
                        key={i}
                        onClick={() => { setReply(cr.text); setShowCanned(false); }}
                        className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full text-muted transition-colors cursor-pointer"
                      >
                        {cr.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="px-3 py-2.5 flex items-center gap-2">
                  <button
                    onClick={() => setShowCanned(!showCanned)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${showCanned ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    title={isNl ? 'Snelle antwoorden' : 'Quick replies'}
                  >
                    <Zap size={14} />
                  </button>
                  <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={isNl ? 'Typ je antwoord...' : 'Type your reply...'}
                  className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200"
                  disabled={sending}
                />
                  <button
                    onClick={handleSend}
                    disabled={!reply.trim() || sending}
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-30 transition-opacity active:scale-95 cursor-pointer"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            )}

            {activeConv.status === 'CLOSED' && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-400">
                {isNl ? 'Dit gesprek is gesloten' : 'This conversation is closed'}
                {activeConv.summary && (
                  <div className="mt-2 text-left bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {isNl ? 'Samenvatting' : 'Summary'}
                    </p>
                    <p className="text-xs text-gray-600 whitespace-pre-line">{activeConv.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Delete confirmation overlay */}
            {deleteConfirm === activeConv.id && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="bg-white rounded-xl shadow-xl p-5 max-w-xs mx-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-gray-900 text-sm">
                      {isNl ? 'Gesprek verwijderen?' : 'Delete conversation?'}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    {isNl ? 'Dit gesprek en alle berichten worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.' : 'This conversation and all messages will be permanently deleted.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer"
                    >
                      {isNl ? 'Annuleer' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => handleDelete(activeConv.id)}
                      className="flex-1 px-3 py-2 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
                    >
                      {isNl ? 'Verwijder' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageCircle className="w-12 h-12 text-gray-300" />
            <p className="text-sm">{isNl ? 'Selecteer een gesprek om te beginnen' : 'Select a conversation to start'}</p>
            {needsHumanCount > 0 && (
              <p className="text-xs text-red-500 font-medium animate-pulse">
                {needsHumanCount} {isNl ? 'gesprek(ken) wachten op hulp' : 'conversation(s) need help'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
