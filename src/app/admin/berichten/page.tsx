'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Mail,
  Phone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Loader2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import {
  getContactStatusColor,
  formatDateTime,
  type ContactSubmission,
  type ContactStatus,
} from '@/data/admin';

const STATUS_OPTIONS: ContactStatus[] = ['NIEUW', 'GELEZEN', 'BEANTWOORD'];

function ContactDetail({
  contact,
  onUpdate,
}: {
  contact: ContactSubmission;
  onUpdate: (updated: ContactSubmission) => void;
}) {
  const { t } = useAdmin();
  const { toast } = useToast();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contact.id, reply }),
      });
      onUpdate({ ...contact, status: 'BEANTWOORD', admin_reply: reply });
      setReply('');
      toast(t('common.sent'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setSending(false);
  };

  const handleMarkRead = async () => {
    setMarkingRead(true);
    try {
      await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contact.id, status: 'GELEZEN' }),
      });
      onUpdate({ ...contact, status: 'GELEZEN' });
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
    setMarkingRead(false);
  };

  return (
    <div className="bg-surface rounded-2xl p-3 sm:p-5 mt-2 space-y-3 sm:space-y-4">
      {/* Contact info */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Mail className="w-4 h-4" />
          <a href={`mailto:${contact.email}`} className="hover:text-primary-dark">
            {contact.email}
          </a>
        </div>
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Phone className="w-4 h-4" />
            <a href={`tel:${contact.phone}`} className="hover:text-primary-dark">
              {contact.phone}
            </a>
          </div>
        )}
      </div>

      {/* Message */}
      <div className="bg-white rounded-xl p-3 sm:p-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          {t('messages.message')}
        </p>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {contact.message}
        </p>
      </div>

      {/* Admin reply */}
      {contact.admin_reply && (
        <div className="bg-primary-light rounded-xl p-4">
          <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('messages.reply')}
          </p>
          <p className="text-sm text-primary-dark leading-relaxed whitespace-pre-wrap">
            {contact.admin_reply}
          </p>
        </div>
      )}

      {/* Reply box */}
      {contact.status !== 'BEANTWOORD' && (
        <div>
          {/* Template quick-replies */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              {t('messages.templates')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['templateAvailability', 'templatePricing', 'templateBookingInfo', 'templateThankYou'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReply(t(`messages.${key}`))}
                  className="px-2.5 py-1 bg-surface hover:bg-surface-alt rounded-lg text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {t(`messages.${key}`).slice(0, 40)}…
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t('messages.replyPlaceholder')}
            rows={3}
            className="w-full px-4 py-3 bg-white rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {t('messages.sendReply')}
            </button>
            {contact.status === 'NIEUW' && (
              <button
                onClick={handleMarkRead}
                disabled={markingRead}
                className="px-4 py-2 bg-primary-50 text-primary rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {markingRead ? t('messages.sending') : t('messages.markRead')}
              </button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        {t('messages.receivedOn')}{formatDateTime(contact.created_at)}
      </p>
    </div>
  );
}

export default function BerichtenPage() {
  const { t, ts } = useAdmin();
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'ALLE'>('ALLE');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchContacts = () => {
    fetch('/api/contacts')
      .then((res) => res.json())
      .then((data) => setContacts(data.contacts || []))
      .catch((e) => { console.error('Fetch error:', e); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleUpdate = (updated: ContactSubmission) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const filtered = contacts
    .filter((c) => {
      if (statusFilter !== 'ALLE' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.message.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const newCount = contacts.filter((c) => c.status === 'NIEUW').length;
  const readCount = contacts.filter((c) => c.status === 'GELEZEN').length;
  const answeredCount = contacts.filter((c) => c.status === 'BEANTWOORD').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{newCount}</p>
          <p className="text-xs text-muted">{t('messages.newCount')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{readCount}</p>
          <p className="text-xs text-muted">{t('messages.readCount')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{answeredCount}</p>
          <p className="text-xs text-muted">{t('messages.repliedCount')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('messages.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ContactStatus | 'ALLE')
            }
            className="pl-10 pr-8 py-2.5 bg-white rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="ALLE">{t('status.allStatuses')}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => fetchContacts()}
          className="p-2.5 bg-white rounded-xl text-muted hover:text-primary transition-colors cursor-pointer"
          title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-muted">
        {filtered.length} {t('messages.messagesFound', { count: String(filtered.length), s: filtered.length !== 1 ? 'en' : '' })}
      </p>

      {/* Messages list */}
      <div className="space-y-1.5 sm:space-y-2">
        {filtered.map((contact) => {
          const isExpanded = expandedId === contact.id;

          return (
            <div
              key={contact.id}
              className="bg-white rounded-2xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : contact.id)
                }
                className={`w-full px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-2 sm:gap-4 text-left hover:bg-surface transition-colors cursor-pointer ${
                  contact.status === 'NIEUW'
                    ? 'bg-primary/5'
                    : ''
                }`}
              >
                <div className="p-2 rounded-xl bg-surface shrink-0">
                  <MessageSquare className="w-5 h-5 text-muted" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm ${
                        contact.status === 'NIEUW'
                          ? 'font-bold'
                          : 'font-medium'
                      } text-foreground`}
                    >
                      {contact.name}
                    </p>
                    <span className="text-xs text-muted">
                      {formatDateTime(contact.created_at)}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      contact.status === 'NIEUW' ? 'font-semibold' : ''
                    } text-foreground mt-0.5`}
                  >
                    {contact.subject}
                  </p>
                  <p className="text-xs text-muted line-clamp-1 mt-0.5">
                    {contact.message}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getContactStatusColor(
                      contact.status as 'NIEUW' | 'GELEZEN' | 'BEANTWOORD'
                    )}`}
                  >
                    {ts(contact.status)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 sm:px-5 sm:pb-5">
                  <ContactDetail contact={contact} onUpdate={handleUpdate} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-lg">{t('messages.noMessages')}</p>
            <p className="text-sm mt-1">{t('messages.adjustFilters')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
