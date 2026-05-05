'use client';

// Activity-feed widget voor admin dashboard.
// Toont de laatste N admin-acties (mark-paid, refund, status-change, etc.)
// uit het activity_log. Klikbaar naar het betreffende entity wanneer
// entity_type=booking.
//
// Hergebruikt het bestaande GET /api/admin/activity endpoint dat al
// gevuld wordt door logActivity() calls in de API-routes.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Loader2, ChevronRight } from 'lucide-react';

interface ActivityEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  details: string | null;
  created_at: string;
}

// Vertaal action-keys naar mensen-leesbare NL labels.
// Onbekende actions: gebruik underscores → spaties als fallback.
const ACTION_LABELS_NL: Record<string, string> = {
  'admin_login': 'Ingelogd',
  'booking_created': 'Boeking aangemaakt',
  'booking_updated': 'Boeking gewijzigd',
  'booking_deleted': 'Boeking verwijderd',
  'booking.mark-deposit': 'Aanbetaling op groen gezet',
  'booking.mark-fully-paid': 'Volledig betaald gemarkeerd',
  'booking.mark-borg-paid': 'Borg op groen gezet',
  'booking.mark-borg-returned': 'Borg-retour geregistreerd',
  'payment_refund': 'Terugbetaling geregistreerd',
  'payment.mark-paid': 'Betaling op groen gezet',
  'customer_created': 'Klant aangemaakt',
  'customer_deleted': 'Klant verwijderd',
  'customer_updated': 'Klant bijgewerkt',
  'caravan_created': 'Caravan aangemaakt',
  'caravan_updated': 'Caravan bijgewerkt',
  'caravan_deleted': 'Caravan verwijderd',
  'discount_created': 'Kortingscode aangemaakt',
  'discount_updated': 'Kortingscode bijgewerkt',
  'discount_deleted': 'Kortingscode verwijderd',
  'newsletter_created': 'Nieuwsbrief aangemaakt',
  'newsletter_sent': 'Nieuwsbrief verzonden',
  'trail_created': 'Wandelroute aangemaakt',
  'trail_updated': 'Wandelroute bijgewerkt',
  'contact_assigned': 'Bericht aan klant gekoppeld',
  'contact_deleted': 'Bericht verwijderd',
};

function actionLabel(action: string): string {
  return ACTION_LABELS_NL[action] || action.replace(/_/g, ' ').replace(/\./g, ' ');
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Zojuist';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

interface Props {
  limit?: number;
  className?: string;
}

export default function ActivityFeed({ limit = 10, className = '' }: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/activity?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.log) setEntries(data.log);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.4 }}
      className={`bg-white rounded-2xl p-3 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary-50">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground">Recente activiteit</h3>
            <p className="text-xs text-muted">Laatste {limit} admin-acties</p>
          </div>
        </div>
        <Link
          href="/admin/activiteit"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Bekijk alles <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted py-6 text-center">Nog geen activiteit.</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((e) => {
            const label = actionLabel(e.action);
            const subject = e.entity_label || (e.entity_id ? `#${e.entity_id.slice(0, 8)}` : '');
            // Maak booking-entries klikbaar naar /admin/boekingen.
            // (URL-param filter zou rechtstreeks naar de juiste row springen,
            // maar zonder reference is dat nu nog niet exact.)
            const href = e.entity_type === 'booking' && e.entity_label
              ? `/admin/boekingen?q=${encodeURIComponent(e.entity_label)}`
              : null;
            const inner = (
              <div className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    {subject && <span className="text-xs text-muted truncate">{subject}</span>}
                  </div>
                  {e.details && (
                    <p className="text-[11px] text-muted mt-0.5 truncate">{e.details}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-muted">
                  <span>{e.actor}</span>
                  <span>·</span>
                  <span>{formatTime(e.created_at)}</span>
                </div>
              </div>
            );
            return (
              <li key={e.id}>
                {href ? (
                  <Link href={href} className="block">{inner}</Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
