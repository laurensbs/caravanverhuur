'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Users,
  Clock,
} from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  last_login: string | null;
}

export default function AdminKlanten() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(res => res.json())
      .then(data => setCustomers(data.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return 'Nooit';
    return new Date(d).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-primary" size={28} />
            Klanten
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {customers.length} geregistreerde klant{customers.length !== 1 ? 'en' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Zoek op naam, e-mail of telefoon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
          <div className="text-xs text-gray-500 mt-1">Totaal klanten</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">
            {customers.filter(c => {
              if (!c.last_login) return false;
              const diff = Date.now() - new Date(c.last_login).getTime();
              return diff < 7 * 24 * 60 * 60 * 1000;
            }).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Actief (7 dagen)</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">
            {customers.filter(c => c.phone).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Met telefoonnr.</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">
            {customers.filter(c => {
              const diff = Date.now() - new Date(c.created_at).getTime();
              return diff < 30 * 24 * 60 * 60 * 1000;
            }).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Nieuw (30 dagen)</div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {search ? 'Geen klanten gevonden' : 'Nog geen geregistreerde klanten'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {search
              ? 'Probeer een andere zoekopdracht'
              : 'Klanten verschijnen hier zodra ze zich registreren'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Klant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telefoon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Geregistreerd</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Laatste login</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
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
                        <span className="font-medium text-gray-900">
                          {customer.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {customer.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock size={14} />
                        <span>{formatDateTime(customer.last_login)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {filtered.map(customer => (
              <div key={customer.id} className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {customer.name
                      ? customer.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : customer.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {customer.name || 'Geen naam'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Geregistreerd {formatDate(customer.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 pl-[52px]">
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-sm text-gray-600 flex items-center gap-2 hover:text-primary"
                  >
                    <Mail size={14} className="text-gray-400" />
                    {customer.email}
                  </a>
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-sm text-gray-600 flex items-center gap-2 hover:text-primary"
                    >
                      <Phone size={14} className="text-gray-400" />
                      {customer.phone}
                    </a>
                  )}
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <Clock size={12} />
                    Laatste login: {formatDateTime(customer.last_login)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
