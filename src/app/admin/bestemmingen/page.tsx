'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { MapPin, Save, Loader2, Check, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
import { destinations as staticDestinations } from '@/data/destinations';
import { useAdmin } from '@/i18n/admin-context';

interface DestOverride {
  slug: string;
  hero_image: string;
  gallery: string[];
}

export default function AdminBestemmingenPage() {
  const { locale } = useAdmin();
  const isNl = locale === 'nl';

  const [overrides, setOverrides] = useState<DestOverride[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Local form state per destination
  const [formHero, setFormHero] = useState('');
  const [formGallery, setFormGallery] = useState('');

  const fetchOverrides = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/destinations');
      if (res.ok) {
        const data = await res.json();
        setOverrides(data.destinations || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOverrides(); }, [fetchOverrides]);

  const getOverride = (slug: string) => overrides.find(o => o.slug === slug);

  const handleExpand = (slug: string) => {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      return;
    }
    setExpandedSlug(slug);
    const dest = staticDestinations.find(d => d.slug === slug)!;
    const override = getOverride(slug);
    setFormHero(override?.hero_image || dest.heroImage);
    setFormGallery((override?.gallery?.length ? override.gallery : dest.gallery).join('\n'));
  };

  const handleSave = async (slug: string) => {
    setSaving(slug);
    try {
      const gallery = formGallery.split('\n').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/admin/destinations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, hero_image: formHero.trim(), gallery }),
      });
      if (res.ok) {
        await fetchOverrides();
        setSaved(slug);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch { /* ignore */ }
    setSaving(null);
  };

  const getEffectiveHero = (slug: string) => {
    const override = getOverride(slug);
    const dest = staticDestinations.find(d => d.slug === slug)!;
    return override?.hero_image || dest.heroImage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          {isNl ? 'Bestemmingen — Foto\'s' : 'Destinations — Photos'}
        </h2>
        <p className="text-sm text-muted mt-1">
          {isNl
            ? 'Pas hero-afbeeldingen en galerij-foto\'s aan per bestemming. Gebruik directe URL\'s (bijv. CubeUpload).'
            : 'Edit hero images and gallery photos per destination. Use direct URLs (e.g. CubeUpload).'}
        </p>
      </div>

      <div className="space-y-2">
        {staticDestinations.map(dest => {
          const isExpanded = expandedSlug === dest.slug;
          const override = getOverride(dest.slug);
          const hasOverride = !!override?.hero_image;
          const heroSrc = getEffectiveHero(dest.slug);

          return (
            <div key={dest.slug} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Row header */}
              <button
                onClick={() => handleExpand(dest.slug)}
                className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-gray-50/50 transition-colors cursor-pointer text-left"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  {heroSrc.startsWith('http') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroSrc} alt={dest.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={heroSrc} alt={dest.name} fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{dest.name}</h3>
                    {hasOverride && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full shrink-0">
                        {isNl ? 'Aangepast' : 'Custom'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {dest.region} · {dest.beaches.length} {isNl ? 'stranden' : 'beaches'}
                  </p>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-muted shrink-0" /> : <ChevronDown size={16} className="text-muted shrink-0" />}
              </button>

              {/* Expanded edit form */}
              {isExpanded && (
                <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {/* Hero image */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      {isNl ? 'Hero afbeelding (URL)' : 'Hero image (URL)'}
                    </label>
                    <input
                      type="text"
                      value={formHero}
                      onChange={e => setFormHero(e.target.value)}
                      placeholder="https://u.cubeupload.com/..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                    />
                    {formHero && formHero.startsWith('http') && (
                      <div className="mt-2 relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formHero} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Gallery photos */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      <ImageIcon size={12} className="inline mr-1" />
                      {isNl ? 'Galerij foto\'s (één URL per regel)' : 'Gallery photos (one URL per line)'}
                    </label>
                    <textarea
                      value={formGallery}
                      onChange={e => setFormGallery(e.target.value)}
                      placeholder={'https://u.cubeupload.com/photo1.jpg\nhttps://u.cubeupload.com/photo2.jpg'}
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-xs"
                    />
                    {/* Gallery preview */}
                    {formGallery.trim() && (
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {formGallery.split('\n').filter(u => u.trim().startsWith('http')).slice(0, 6).map((url, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url.trim()} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-muted mt-1">
                      {isNl
                        ? 'Gebruik directe afbeeldings-URL\'s (CubeUpload). Laat leeg voor standaard foto\'s.'
                        : 'Use direct image URLs (CubeUpload). Leave empty for default photos.'}
                    </p>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(dest.slug)}
                      disabled={saving === dest.slug}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-primary-dark transition-colors"
                    >
                      {saving === dest.slug ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : saved === dest.slug ? (
                        <Check size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      {saved === dest.slug
                        ? (isNl ? 'Opgeslagen!' : 'Saved!')
                        : (isNl ? 'Opslaan' : 'Save')
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
