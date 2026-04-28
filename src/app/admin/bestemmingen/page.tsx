'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { MapPin, Save, Loader2, Check, ChevronDown, ChevronUp, ImageIcon, Type, Waves, Plus, Trash2 } from 'lucide-react';
import { destinations as staticDestinations, Beach } from '@/data/destinations';
import { useAdmin } from '@/i18n/admin-context';

interface DestOverride {
  slug: string;
  hero_image: string;
  gallery: string[];
  description?: string;
  long_description?: string;
  highlights?: string[];
  travel_tip?: string;
  beaches?: Beach[];
}

export default function AdminBestemmingenPage() {
  const { locale } = useAdmin();
  const isNl = locale === 'nl';

  const [overrides, setOverrides] = useState<DestOverride[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'text' | 'beaches'>('photos');

  // Local form state per destination
  const [formHero, setFormHero] = useState('');
  const [formGallery, setFormGallery] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLongDescription, setFormLongDescription] = useState('');
  const [formHighlights, setFormHighlights] = useState('');
  const [formTravelTip, setFormTravelTip] = useState('');
  const [formBeaches, setFormBeaches] = useState<Beach[]>([]);

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
    setActiveTab('photos');
    const dest = staticDestinations.find(d => d.slug === slug)!;
    const override = getOverride(slug);
    setFormHero(override?.hero_image || dest.heroImage);
    setFormGallery((override?.gallery?.length ? override.gallery : dest.gallery).join('\n'));
    setFormDescription(override?.description || dest.description);
    setFormLongDescription(override?.long_description || dest.longDescription || '');
    setFormHighlights((override?.highlights?.length ? override.highlights : dest.highlights).join('\n'));
    setFormTravelTip(override?.travel_tip || dest.travelTip);
    setFormBeaches(override?.beaches?.length ? override.beaches : dest.beaches.map(b => ({ ...b })));
  };

  const handleSave = async (slug: string) => {
    setSaving(slug);
    try {
      const gallery = formGallery.split('\n').map(s => s.trim()).filter(Boolean);
      const highlights = formHighlights.split('\n').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/admin/destinations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          hero_image: formHero.trim(),
          gallery,
          description: formDescription.trim(),
          long_description: formLongDescription.trim(),
          highlights,
          travel_tip: formTravelTip.trim(),
          beaches: formBeaches,
        }),
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

  const updateBeach = (index: number, field: keyof Beach, value: string | boolean) => {
    setFormBeaches(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const addBeach = () => {
    setFormBeaches(prev => [...prev, { name: '', type: 'zand', vibe: 'rustig', description: '', facilities: false }]);
  };

  const removeBeach = (index: number) => {
    setFormBeaches(prev => prev.filter((_, i) => i !== index));
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
          {isNl ? 'Bestemmingen' : 'Destinations'}
        </h2>
        <p className="text-sm text-muted mt-1">
          {isNl
            ? 'Pas foto\'s, teksten en strandinformatie aan per bestemming.'
            : 'Edit photos, texts and beach information per destination.'}
        </p>
      </div>

      <div className="space-y-2">
        {staticDestinations.map(dest => {
          const isExpanded = expandedSlug === dest.slug;
          const override = getOverride(dest.slug);
          const hasOverride = !!(override?.hero_image || override?.description || override?.beaches?.length);
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
                <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 pt-3">
                  {/* Tab navigation */}
                  <div className="flex gap-1 mb-4 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('photos')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'photos' ? 'bg-white shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                    >
                      <ImageIcon size={12} />
                      {isNl ? 'Foto\'s' : 'Photos'}
                    </button>
                    <button
                      onClick={() => setActiveTab('text')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'text' ? 'bg-white shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                    >
                      <Type size={12} />
                      {isNl ? 'Teksten' : 'Texts'}
                    </button>
                    <button
                      onClick={() => setActiveTab('beaches')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'beaches' ? 'bg-white shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                    >
                      <Waves size={12} />
                      {isNl ? 'Stranden' : 'Beaches'}
                    </button>
                  </div>

                  {/* Photos tab */}
                  {activeTab === 'photos' && (
                    <div className="space-y-3">
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
                    </div>
                  )}

                  {/* Text tab */}
                  {activeTab === 'text' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">
                          {isNl ? 'Korte beschrijving' : 'Short description'}
                        </label>
                        <textarea
                          value={formDescription}
                          onChange={e => setFormDescription(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">
                          {isNl ? 'Lange beschrijving' : 'Long description'}
                        </label>
                        <textarea
                          value={formLongDescription}
                          onChange={e => setFormLongDescription(e.target.value)}
                          rows={5}
                          className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">
                          {isNl ? 'Highlights (één per regel)' : 'Highlights (one per line)'}
                        </label>
                        <textarea
                          value={formHighlights}
                          onChange={e => setFormHighlights(e.target.value)}
                          rows={5}
                          placeholder={isNl ? 'Middeleeuws centrum\nBreed zandstrand\nWandelroutes' : 'Medieval center\nWide sandy beach\nHiking trails'}
                          className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                        <p className="text-[11px] text-muted mt-1">
                          {isNl ? 'Elke regel wordt een apart highlight.' : 'Each line becomes a separate highlight.'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">
                          {isNl ? 'Reistip' : 'Travel tip'}
                        </label>
                        <textarea
                          value={formTravelTip}
                          onChange={e => setFormTravelTip(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Beaches tab */}
                  {activeTab === 'beaches' && (
                    <div className="space-y-3">
                      {formBeaches.map((beach, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted">{isNl ? `Strand ${idx + 1}` : `Beach ${idx + 1}`}</span>
                            <button
                              onClick={() => removeBeach(idx)}
                              className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                              title={isNl ? 'Verwijderen' : 'Delete'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-muted mb-0.5">{isNl ? 'Naam' : 'Name'}</label>
                              <input
                                type="text"
                                value={beach.name}
                                onChange={e => updateBeach(idx, 'name', e.target.value)}
                                className="w-full px-2.5 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-muted mb-0.5">{isNl ? 'Type' : 'Type'}</label>
                              <select
                                value={beach.type}
                                onChange={e => updateBeach(idx, 'type', e.target.value)}
                                className="w-full px-2.5 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                              >
                                <option value="zand">{isNl ? 'Zand' : 'Sand'}</option>
                                <option value="kiezel">{isNl ? 'Kiezel' : 'Pebble'}</option>
                                <option value="rotsen">{isNl ? 'Rotsen' : 'Rocks'}</option>
                                <option value="mix">Mix</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] text-muted mb-0.5">{isNl ? 'Sfeer' : 'Vibe'}</label>
                              <select
                                value={beach.vibe}
                                onChange={e => updateBeach(idx, 'vibe', e.target.value)}
                                className="w-full px-2.5 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                              >
                                <option value="rustig">{isNl ? 'Rustig' : 'Quiet'}</option>
                                <option value="levendig">{isNl ? 'Levendig' : 'Lively'}</option>
                                <option value="wild">{isNl ? 'Wild' : 'Wild'}</option>
                                <option value="familiaal">{isNl ? 'Familiaal' : 'Family'}</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2 pt-4">
                              <input
                                type="checkbox"
                                checked={beach.facilities}
                                onChange={e => updateBeach(idx, 'facilities', e.target.checked)}
                                className="rounded cursor-pointer"
                              />
                              <label className="text-sm text-muted">{isNl ? 'Faciliteiten' : 'Facilities'}</label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] text-muted mb-0.5">
                              <ImageIcon size={10} className="inline mr-1" />
                              {isNl ? 'Foto-URL' : 'Photo URL'}
                            </label>
                            <input
                              type="url"
                              value={beach.photo || ''}
                              onChange={e => updateBeach(idx, 'photo', e.target.value)}
                              placeholder="https://u.cubeupload.com/..."
                              className="w-full px-2.5 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                            />
                            {beach.photo && beach.photo.startsWith('http') && (
                              <div className="mt-1.5 relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={beach.photo} alt={beach.name || 'Beach'} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-[11px] text-muted mb-0.5">{isNl ? 'Beschrijving' : 'Description'}</label>
                            <textarea
                              value={beach.description}
                              onChange={e => updateBeach(idx, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-2.5 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addBeach}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        {isNl ? 'Strand toevoegen' : 'Add beach'}
                      </button>
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex justify-end mt-4">
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
