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
} from 'lucide-react';
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
    } catch {
      // silent
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
      // silent
    }
    setMarkingRead(false);
  };

  return (
    <div className="bg-[#f8fafc] rounded-2xl p-5 border border-[#e2e8f0] mt-2 space-y-4">
      {/* Contact info */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <Mail className="w-4 h-4" />
          <a href={`mailto:${contact.email}`} className="hover:text-[#1a3c6e]">
            {contact.email}
          </a>
        </div>
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <Phone className="w-4 h-4" />
            <a href={`tel:${contact.phone}`} className="hover:text-[#1a3c6e]">
              {contact.phone}
            </a>
          </div>
        )}
      </div>

      {/* Message */}
      <div className="bg-white rounded-xl p-4">
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
          Bericht
        </p>
        <p className="text-sm text-[#1a1a2e] leading-relaxed whitespace-pre-wrap">
          {contact.message}
        </p>
      </div>

      {/* Admin reply */}
      {contact.admin_reply && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Antwoord
          </p>
          <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
            {contact.admin_reply}
          </p>
        </div>
      )}

      {/* Reply box */}
      {contact.status !== 'BEANTWOORD' && (
        <div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Typ je antwoord..."
            rows={3}
            className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a3c6e] text-white rounded-xl text-sm font-medium hover:bg-[#15325c] transition-colors cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Verstuur antwoord
            </button>
            {contact.status === 'NIEUW' && (
              <button
                onClick={handleMarkRead}
                disabled={markingRead}
                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium hover:bg-yellow-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {markingRead ? 'Bezig...' : 'Markeer als gelezen'}
              </button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-[#94a3b8]">
        Ontvangen op {formatDateTime(contact.created_at)}
      </p>
    </div>
  );
}

export default function BerichtenPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'ALLE'>('ALLE');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/contacts')
      .then((res) => res.json())
      .then((data) => setContacts(data.contacts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
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
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3c6e]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{newCount}</p>
          <p className="text-xs text-[#64748b]">Nieuw</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{readCount}</p>
          <p className="text-xs text-[#64748b]">Gelezen</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
          <p className="text-xs text-[#64748b]">Beantwoord</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, e-mail, onderwerp..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ContactStatus | 'ALLE')
            }
            className="pl-10 pr-8 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a3c6e]"
          >
            <option value="ALLE">Alle statussen</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-[#64748b]">
        {filtered.length} bericht{filtered.length !== 1 ? 'en' : ''} gevonden
      </p>

      {/* Messages list */}
      <div className="space-y-2">
        {filtered.map((contact) => {
          const isExpanded = expandedId === contact.id;

          return (
            <div
              key={contact.id}
              className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : contact.id)
                }
                className={`w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                  contact.status === 'NIEUW'
                    ? 'border-l-4 border-l-blue-500'
                    : ''
                }`}
              >
                <div className="p-2 rounded-xl bg-[#f8fafc] shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#64748b]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm ${
                        contact.status === 'NIEUW'
                          ? 'font-bold'
                          : 'font-medium'
                      } text-[#1a1a2e]`}
                    >
                      {contact.name}
                    </p>
                    <span className="text-xs text-[#94a3b8]">
                      {formatDateTime(contact.created_at)}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      contact.status === 'NIEUW' ? 'font-semibold' : ''
                    } text-[#1a1a2e] mt-0.5`}
                  >
                    {contact.subject}
                  </p>
                  <p className="text-xs text-[#64748b] line-clamp-1 mt-0.5">
                    {contact.message}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getContactStatusColor(
                      contact.status as 'NIEUW' | 'GELEZEN' | 'BEANTWOORD'
                    )}`}
                  >
                    {contact.status}
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
                  <ContactDetail contact={contact} onUpdate={handleUpdate} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#94a3b8]">
            <p className="text-lg">Geen berichten gevonden</p>
            <p className="text-sm mt-1">Pas je filters aan</p>
          </div>
        )}
      </div>
    </div>
  );
}
