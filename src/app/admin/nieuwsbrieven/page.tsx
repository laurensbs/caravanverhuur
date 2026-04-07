'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Send,
  Calendar,
  CalendarClock,
  MapPin,
  Newspaper,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Tag,
  Users,
  Eye,
  ImageIcon,
  UserMinus,
  Timer,
  ChevronUp,
  ChevronDown,
  Type,
  Maximize2,
  Minimize2,
  GripVertical,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import { AnimatePresence, motion } from 'framer-motion';

// ===== TYPES =====

interface Newsletter {
  id: string;
  title: string;
  content: string;
  category: string;
  event_date: string | null;
  event_location: string | null;
  photos: string[] | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

type ModalType = 'send' | 'delete' | null;

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string; // text content or image URL
  imageSize?: 'small' | 'medium' | 'large' | 'full'; // for image blocks
}

// ===== HELPERS =====

function generateBlockId() {
  return 'b_' + Math.random().toString(36).slice(2, 9);
}

function parseContentToBlocks(content: string, photos?: string[] | null): ContentBlock[] {
  // Wrapped format: {"blocks":[...],"font":"..."}
  if (content.trim().startsWith('{"blocks"')) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.blocks)) {
        return parsed.blocks.map((b: ContentBlock) => ({ ...b, id: b.id || generateBlockId() }));
      }
    } catch { /* fall through */ }
  }

  // Block array format: [{...}]
  if (content.trim().startsWith('[{') || content.trim().startsWith('[{')) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
        return parsed.map((b: ContentBlock) => ({ ...b, id: b.id || generateBlockId() }));
      }
    } catch { /* fall through to legacy */ }
  }

  // Legacy format: plain text + separate photos array
  const blocks: ContentBlock[] = [];
  if (content.trim()) {
    blocks.push({ id: generateBlockId(), type: 'text', content });
  }
  if (photos && photos.length > 0) {
    const photoArr = typeof photos === 'string' ? JSON.parse(photos) : photos;
    photoArr.forEach((url: string) => {
      if (url.trim()) blocks.push({ id: generateBlockId(), type: 'image', content: url.trim(), imageSize: 'full' });
    });
  }
  if (blocks.length === 0) {
    blocks.push({ id: generateBlockId(), type: 'text', content: '' });
  }
  return blocks;
}

function parseFontFromContent(content: string): string {
  if (content.trim().startsWith('{"blocks"')) {
    try { return JSON.parse(content).font || 'Inter'; } catch { return 'Inter'; }
  }
  return 'Inter';
}

function blocksToContent(blocks: ContentBlock[], font?: string): string {
  const blockData = blocks.map(b => ({
    type: b.type,
    content: b.content,
    ...(b.type === 'image' ? { imageSize: b.imageSize || 'full' } : {}),
  }));
  if (font && font !== 'Inter') {
    return JSON.stringify({ blocks: blockData, font });
  }
  return JSON.stringify(blockData);
}

function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n');
}

function blocksToPhotos(blocks: ContentBlock[]): string[] {
  return blocks.filter(b => b.type === 'image').map(b => b.content);
}

const IMAGE_SIZES = [
  { value: 'small' as const, label: 'Klein', width: '40%' },
  { value: 'medium' as const, label: 'Medium', width: '60%' },
  { value: 'large' as const, label: 'Groot', width: '80%' },
  { value: 'full' as const, label: 'Volledig', width: '100%' },
];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', css: "'Inter', sans-serif" },
  { value: 'Georgia', label: 'Georgia', css: "'Georgia', serif" },
  { value: 'Merriweather', label: 'Merriweather', css: "'Merriweather', serif" },
  { value: 'Playfair Display', label: 'Playfair', css: "'Playfair Display', serif" },
  { value: 'Plus Jakarta Sans', label: 'Jakarta Sans', css: "'Plus Jakarta Sans', sans-serif" },
  { value: 'Lora', label: 'Lora', css: "'Lora', serif" },
];

const CATEGORY_DRAFTS: Record<string, { title: string; blocks: ContentBlock[] }> = {
  algemeen: { title: '', blocks: [{ id: 'draft_1', type: 'text', content: '' }] },
  activiteit: {
    title: 'Leuke activiteit aan de Costa Brava',
    blocks: [
      { id: 'draft_1', type: 'text', content: 'Beste gasten,\n\nWe willen jullie graag attenderen op een leuke activiteit in de buurt van onze caravans.\n\nDit is een geweldige kans om de lokale cultuur te ervaren en te genieten van de Costa Brava.\n\nHopelijk tot snel!' },
    ],
  },
  feestdag: {
    title: 'Feestdag aan de Costa Brava',
    blocks: [
      { id: 'draft_1', type: 'text', content: 'Beste gasten,\n\nEr komt een bijzondere feestdag aan in Spanje! Dit is altijd een prachtige ervaring aan de Costa Brava.\n\nDenk aan kleurrijke optochten, lokale muziek en heerlijk Spaans eten.\n\nWe raden aan om deze feestdag mee te maken als je in de buurt bent!' },
    ],
  },
  markt: {
    title: 'Lokale markt aan de Costa Brava',
    blocks: [
      { id: 'draft_1', type: 'text', content: 'Beste gasten,\n\nBinnenkort vindt er een gezellige lokale markt plaats in de buurt.\n\nHier vind je verse producten, handgemaakte souvenirs en lokale specialiteiten. Een perfecte dagactiviteit!\n\nVeel plezier!' },
    ],
  },
  evenement: {
    title: 'Evenement aan de Costa Brava',
    blocks: [
      { id: 'draft_1', type: 'text', content: 'Beste gasten,\n\nWe hebben een leuk evenement gevonden dat binnenkort plaatsvindt aan de Costa Brava.\n\nEen uitstekende gelegenheid om de omgeving te verkennen en nieuwe ervaringen op te doen.\n\nMeer informatie volgt!' },
    ],
  },
};

function formatDate(d: string | null, locale = 'nl-NL') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d: string | null, locale = 'nl-NL') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ===== BLOCK EDITOR COMPONENT =====

function BlockEditor({ blocks, onChange, isNl }: { blocks: ContentBlock[]; onChange: (blocks: ContentBlock[]) => void; isNl: boolean }) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    onChange(newBlocks);
  };

  const addTextBlock = () => {
    onChange([...blocks, { id: generateBlockId(), type: 'text', content: '' }]);
  };

  const addImageBlock = () => {
    if (!newImageUrl.trim()) return;
    onChange([...blocks, { id: generateBlockId(), type: 'image', content: newImageUrl.trim(), imageSize: 'full' }]);
    setNewImageUrl('');
  };

  const insertBlockAfter = (id: string, type: 'text' | 'image') => {
    const idx = blocks.findIndex(b => b.id === id);
    const newBlock: ContentBlock = type === 'text'
      ? { id: generateBlockId(), type: 'text', content: '' }
      : { id: generateBlockId(), type: 'image', content: '', imageSize: 'full' };
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    onChange(newBlocks);
  };

  // Auto-resize textareas
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => (
        <div key={block.id} className="group relative">
          {/* Block controls */}
          <div className="absolute -left-1 sm:-left-8 top-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10">
            <button onClick={() => moveBlock(block.id, -1)} disabled={idx === 0}
              className="w-5 h-5 flex items-center justify-center rounded bg-white shadow-sm border border-gray-200 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer">
              <ChevronUp className="w-3 h-3" />
            </button>
            <button onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1}
              className="w-5 h-5 flex items-center justify-center rounded bg-white shadow-sm border border-gray-200 text-muted hover:text-foreground disabled:opacity-30 cursor-pointer">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {block.type === 'text' ? (
            <div className="relative rounded-xl border border-gray-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-white">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Type className="w-3 h-3" />
                  <span className="font-medium">{isNl ? 'Tekst' : 'Text'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => insertBlockAfter(block.id, 'image')}
                    className="text-[10px] text-muted hover:text-primary px-1.5 py-0.5 rounded hover:bg-primary/5 cursor-pointer flex items-center gap-0.5">
                    <ImageIcon className="w-2.5 h-2.5" /> +{isNl ? 'Afbeelding' : 'Image'}
                  </button>
                  <button onClick={() => insertBlockAfter(block.id, 'text')}
                    className="text-[10px] text-muted hover:text-primary px-1.5 py-0.5 rounded hover:bg-primary/5 cursor-pointer flex items-center gap-0.5">
                    <Type className="w-2.5 h-2.5" /> +{isNl ? 'Tekst' : 'Text'}
                  </button>
                  {blocks.length > 1 && (
                    <button onClick={() => removeBlock(block.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 px-1 py-0.5 rounded hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                ref={(el) => { textareaRefs.current[block.id] = el; if (el) autoResize(el); }}
                value={block.content}
                onChange={(e) => { updateBlock(block.id, { content: e.target.value }); autoResize(e.target); }}
                placeholder={isNl ? 'Typ je tekst hier...' : 'Type your text here...'}
                className="w-full px-4 py-3 text-sm resize-none focus:outline-none min-h-[80px] rounded-b-xl"
                rows={3}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-white overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <ImageIcon className="w-3 h-3" />
                  <span className="font-medium">{isNl ? 'Afbeelding' : 'Image'}</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Size selector */}
                  {IMAGE_SIZES.map(s => (
                    <button key={s.value} onClick={() => updateBlock(block.id, { imageSize: s.value })}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                        (block.imageSize || 'full') === s.value ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground hover:bg-gray-100'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                  <span className="w-px h-3 bg-gray-200 mx-0.5" />
                  <button onClick={() => insertBlockAfter(block.id, 'text')}
                    className="text-[10px] text-muted hover:text-primary px-1 py-0.5 rounded hover:bg-primary/5 cursor-pointer">
                    <Type className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => removeBlock(block.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 px-1 py-0.5 rounded hover:bg-red-50 cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {block.content ? (
                <div className="p-3 bg-[#FAFAF9]">
                  <div style={{ width: IMAGE_SIZES.find(s => s.value === (block.imageSize || 'full'))?.width || '100%', margin: '0 auto' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.content} alt="" className="w-full h-auto rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <input type="url" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="https://..." />
                </div>
              ) : (
                <div className="p-3">
                  <input type="url" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder={isNl ? 'Plak afbeelding URL...' : 'Paste image URL...'} autoFocus />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={addTextBlock}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-muted hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
          <Type className="w-3.5 h-3.5" /> + {isNl ? 'Tekst' : 'Text'}
        </button>
        <div className="flex items-center gap-1 flex-1">
          <input type="url" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageBlock(); } }}
            placeholder={isNl ? 'Afbeelding URL plakken...' : 'Paste image URL...'}
            className="flex-1 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 min-w-0" />
          <button onClick={addImageBlock} disabled={!newImageUrl.trim()}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-muted hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-40">
            <ImageIcon className="w-3.5 h-3.5" /> +
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== EMAIL PREVIEW COMPONENT =====

function EmailPreview({ title, category, eventDate, eventLocation, blocks, dateLocale, isNl, getCategoryInfo, font }: {
  title: string;
  category: string;
  eventDate: string;
  eventLocation: string;
  blocks: ContentBlock[];
  dateLocale: string;
  isNl: boolean;
  getCategoryInfo: (cat: string) => { emoji: string; label: string };
  font?: string;
}) {
  const cat = getCategoryInfo(category);
  const hasContent = blocks.some(b => b.content.trim());
  const fontCss = FONT_OPTIONS.find(f => f.value === font)?.css || FONT_OPTIONS[0].css;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
      {/* Email header bar */}
      <div className="bg-[#FAFAF9] px-4 py-2.5 border-b border-gray-200">
        <div className="text-[10px] text-muted mb-0.5">{isNl ? 'Onderwerp' : 'Subject'}:</div>
        <div className="text-sm font-medium text-foreground truncate">
          {title ? `${cat.emoji} ${title}` : <span className="text-muted italic">{isNl ? 'Geen onderwerp' : 'No subject'}</span>}
        </div>
      </div>

      {/* Email body */}
      <div className="p-5 sm:p-6 max-w-[520px] mx-auto" style={{ fontFamily: fontCss }}>
        {/* Category badge */}
        <div className="text-center mb-4">
          <span className="inline-block bg-[#F0F9FF] text-[#0284C7] text-xs font-semibold px-3 py-1 rounded-full">
            {cat.emoji} {cat.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground text-center mb-4">
          {title || <span className="text-muted italic">{isNl ? 'Nieuwsbrief titel' : 'Newsletter title'}</span>}
        </h3>

        {/* Event details */}
        {(eventDate || eventLocation) && (
          <div className="bg-[#FAFAF9] rounded-lg p-4 mb-4">
            {eventDate && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">📅 Datum</span>
                <span className="font-semibold">{formatDate(eventDate, dateLocale)}</span>
              </div>
            )}
            {eventLocation && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">📍 Locatie</span>
                <span className="font-semibold">{eventLocation}</span>
              </div>
            )}
          </div>
        )}

        {/* Content blocks */}
        {!hasContent && (
          <div className="text-center py-8 text-muted">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm italic">{isNl ? 'Voeg content toe om de preview te zien' : 'Add content to see the preview'}</p>
          </div>
        )}

        {blocks.map((block) => {
          if (block.type === 'text' && block.content.trim()) {
            return block.content.split('\n').filter(l => l.trim()).map((line, i) => (
              <p key={`${block.id}-${i}`} className="text-sm text-foreground mb-3 leading-relaxed" style={{ fontFamily: fontCss }}>{line}</p>
            ));
          }
          if (block.type === 'image' && block.content.trim()) {
            const size = IMAGE_SIZES.find(s => s.value === (block.imageSize || 'full'));
            return (
              <div key={block.id} className="mb-4" style={{ width: size?.width || '100%', margin: '0 auto 16px' }}>
                <div className="rounded-xl overflow-hidden shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.content} alt="" className="w-full h-auto block" onError={(e) => {
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="bg-red-50 p-4 text-center text-xs text-red-400">Afbeelding kon niet geladen worden</div>';
                  }} />
                </div>
              </div>
            );
          }
          return null;
        })}

        <hr className="my-4 border-gray-200" />

        {/* CTA */}
        <div className="bg-[#F0F9FF] rounded-xl p-4 mb-4">
          <p className="text-sm text-foreground">
            🌴 Wil je de Costa Brava zelf ervaren? Bekijk onze beschikbare caravans en boek jouw perfecte vakantie.
          </p>
        </div>

        <div className="text-center">
          <span className="inline-block bg-[#0284C7] text-white px-6 py-3 rounded-xl font-semibold text-sm">
            Bekijk caravans →
          </span>
        </div>

        {/* Unsubscribe footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 underline">
            {isNl ? 'Uitschrijven voor nieuwsbrieven' : 'Unsubscribe from newsletters'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function AdminNieuwsbrieven() {
  const { t, ts, dateLocale } = useAdmin();
  const { toast } = useToast();
  const DEFAULT_CATEGORIES = [
    { value: 'algemeen', label: t('newsletters.generalNews'), emoji: '📣' },
    { value: 'activiteit', label: t('newsletters.activity'), emoji: '🎉' },
    { value: 'feestdag', label: t('newsletters.holiday'), emoji: '🎊' },
    { value: 'markt', label: t('newsletters.market'), emoji: '🛍️' },
    { value: 'evenement', label: t('newsletters.event'), emoji: '🎭' },
  ];

  // Custom categories from localStorage
  const [customCategories, setCustomCategories] = useState<{ value: string; label: string; emoji: string }[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📌');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('newsletter_custom_categories');
      if (stored) setCustomCategories(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const CATEGORIES = [...DEFAULT_CATEGORIES, ...customCategories];
  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];
  const isNl = !dateLocale || dateLocale === 'nl-NL';

  const addCustomCategory = () => {
    if (!newCatLabel.trim()) return;
    const value = newCatLabel.trim().toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]/g, '-').replace(/-+/g, '-');
    if (CATEGORIES.some(c => c.value === value)) return;
    const updated = [...customCategories, { value, label: newCatLabel.trim(), emoji: newCatEmoji || '📌' }];
    setCustomCategories(updated);
    localStorage.setItem('newsletter_custom_categories', JSON.stringify(updated));
    setNewCatLabel('');
    setNewCatEmoji('📌');
    setShowAddCategory(false);
  };

  const removeCustomCategory = (value: string) => {
    const updated = customCategories.filter(c => c.value !== value);
    setCustomCategories(updated);
    localStorage.setItem('newsletter_custom_categories', JSON.stringify(updated));
  };

  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'concept' | 'ingepland' | 'verzonden'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Editor state (full-page editor instead of modal)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [showPreview, setShowPreview] = useState(false); // mobile toggle for preview

  // Small modals for send/delete
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Newsletter | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendResult, setSendResult] = useState<{ sentCount: number; totalEmails: number } | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('algemeen');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([{ id: generateBlockId(), type: 'text', content: '' }]);
  const [formFont, setFormFont] = useState('Inter');
  const [formScheduleEnabled, setFormScheduleEnabled] = useState(false);
  const [formScheduleDate, setFormScheduleDate] = useState('');
  const [formScheduleTime, setFormScheduleTime] = useState('09:00');

  // Send modal
  const [excludeInput, setExcludeInput] = useState('');
  const [excludeEmails, setExcludeEmails] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [subscribers, setSubscribers] = useState<{ email: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const excludeInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchNewsletters = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletters');
      const data = await res.json();
      setNewsletters(data.newsletters || []);
    } catch {
      toast(t('common.actionFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNewsletters(); }, [fetchNewsletters]);

  useEffect(() => {
    if (!modal && !editorOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (modal) setModal(null); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modal, editorOpen]);

  const filtered = newsletters.filter(n => {
    const q = search.toLowerCase();
    const plainContent = (n.content.startsWith('[{') || n.content.startsWith('{"blocks"')) ? blocksToPlainText(parseContentToBlocks(n.content)) : n.content;
    const matchSearch = !q || n.title.toLowerCase().includes(q) || plainContent.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || n.status === filterStatus;
    const matchCategory = filterCategory === 'all' || n.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('algemeen');
    setFormEventDate('');
    setFormEventLocation('');
    setFormBlocks([{ id: generateBlockId(), type: 'text', content: '' }]);
    setFormFont('Inter');
    setFormScheduleEnabled(false);
    setFormScheduleDate('');
    setFormScheduleTime('09:00');
    setError('');
    setSuccess('');
    setExcludeInput('');
    setExcludeEmails([]);
    setSendResult(null);
  };

  const openCreate = () => {
    resetForm();
    setSelected(null);
    setEditorMode('create');
    setEditorOpen(true);
    setShowPreview(false);
  };

  const openEdit = (n: Newsletter) => {
    setSelected(n);
    setFormTitle(n.title);
    setFormCategory(n.category);
    setFormEventDate(n.event_date ? new Date(n.event_date).toISOString().split('T')[0] : '');
    setFormEventLocation(n.event_location || '');
    setFormBlocks(parseContentToBlocks(n.content, n.photos));
    setFormFont(parseFontFromContent(n.content));
    if (n.scheduled_at) {
      setFormScheduleEnabled(true);
      const d = new Date(n.scheduled_at);
      setFormScheduleDate(d.toISOString().split('T')[0]);
      setFormScheduleTime(d.toTimeString().slice(0, 5));
    } else {
      setFormScheduleEnabled(false);
      setFormScheduleDate('');
      setFormScheduleTime('09:00');
    }
    setError('');
    setSuccess('');
    setEditorMode('edit');
    setEditorOpen(true);
    setShowPreview(false);
  };

  const openPreview = (n: Newsletter) => {
    setSelected(n);
    setFormTitle(n.title);
    setFormCategory(n.category);
    setFormEventDate(n.event_date ? new Date(n.event_date).toISOString().split('T')[0] : '');
    setFormEventLocation(n.event_location || '');
    setFormBlocks(parseContentToBlocks(n.content, n.photos));
    setFormFont(parseFontFromContent(n.content));
    setEditorMode('edit');
    setEditorOpen(true);
    setShowPreview(true);
  };

  const openSend = async (n: Newsletter) => {
    setSelected(n);
    setError('');
    setSuccess('');
    setSendResult(null);
    setExcludeInput('');
    setExcludeEmails([]);
    setShowSuggestions(false);
    setModal('send');
    // Fetch subscribers for autocomplete
    try {
      const res = await fetch('/api/admin/newsletters?action=subscribers');
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch { /* ignore */ }
  };

  const openDelete = (n: Newsletter) => {
    setSelected(n);
    setError('');
    setModal('delete');
  };

  const handleSave = async () => {
    const hasContent = formBlocks.some(b => b.content.trim());
    if (!formTitle.trim() || !hasContent) {
      setError(t('newsletters.titleContentRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const scheduledAt = formScheduleEnabled && formScheduleDate
        ? new Date(`${formScheduleDate}T${formScheduleTime}:00`).toISOString()
        : null;

      const payload = {
        title: formTitle,
        content: blocksToContent(formBlocks, formFont),
        category: formCategory,
        eventDate: formEventDate || null,
        eventLocation: formEventLocation || null,
        photos: blocksToPhotos(formBlocks),
        scheduledAt,
      };

      if (editorMode === 'edit' && selected) {
        const res = await fetch('/api/admin/newsletters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selected.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast(isNl ? 'Opgeslagen' : 'Saved', 'success');
      } else {
        const res = await fetch('/api/admin/newsletters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast(isNl ? 'Nieuwsbrief aangemaakt' : 'Newsletter created', 'success');
      }

      setEditorOpen(false);
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
        body: JSON.stringify({ action: 'send', id: selected.id, excludeEmails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSendResult({ sentCount: data.sentCount, totalEmails: data.totalEmails });
      setSuccess(t('newsletters.sentSuccessfully', { sent: String(data.sentCount), total: String(data.totalEmails) }));
      fetchNewsletters();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!selected || !testEmail.trim()) return;
    setSendingTest(true);
    try {
      const res = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', id: selected.id, testEmail: testEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(t('newsletters.testEmailSent', { email: testEmail.trim() }), 'success');
    } catch {
      toast(t('newsletters.testEmailFailed'), 'error');
    } finally {
      setSendingTest(false);
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
      toast(t('common.deleted'), 'success');
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const getContentPreviewText = (n: Newsletter): string => {
    if (n.content.startsWith('[{') || n.content.startsWith('{"blocks"')) {
      return blocksToPlainText(parseContentToBlocks(n.content));
    }
    return n.content;
  };

  // Autocomplete suggestions for exclude emails
  const excludeSuggestions = excludeInput.trim().length >= 1
    ? subscribers.filter(s => {
        const q = excludeInput.toLowerCase();
        const alreadyExcluded = excludeEmails.includes(s.email.toLowerCase());
        return !alreadyExcluded && (
          s.email.toLowerCase().includes(q) ||
          (s.name && s.name.toLowerCase().includes(q))
        );
      }).slice(0, 8)
    : [];

  const addExcludeEmail = (email: string) => {
    const lower = email.toLowerCase();
    if (!excludeEmails.includes(lower)) {
      setExcludeEmails([...excludeEmails, lower]);
    }
    setExcludeInput('');
    setShowSuggestions(false);
  };

  // Click outside to close suggestions
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          excludeInputRef.current && !excludeInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  // Stats
  const totalCount = newsletters.length;
  const conceptCount = newsletters.filter(n => n.status === 'concept').length;
  const scheduledCount = newsletters.filter(n => n.status === 'ingepland').length;
  const sentCountStat = newsletters.filter(n => n.status === 'verzonden').length;
  const totalRecipients = newsletters.reduce((sum, n) => sum + (n.sent_count || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // ===== FULL-PAGE EDITOR =====
  if (editorOpen) {
    const isSent = editorMode === 'edit' && selected?.status === 'verzonden';

    return (
      <div className="space-y-0 -m-3 sm:-m-4 md:-m-6">
        {/* Editor header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-3 sm:px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => { setEditorOpen(false); resetForm(); }}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isNl ? 'Terug' : 'Back'}</span>
            </button>
            <h2 className="text-sm font-semibold text-foreground truncate">
              {editorMode === 'create' ? t('newsletters.createNewsletter') : t('newsletters.editNewsletter')}
            </h2>
            <div className="flex items-center gap-2">
              {/* Mobile preview toggle */}
              <button onClick={() => setShowPreview(!showPreview)}
                className={`sm:hidden p-2 rounded-lg transition cursor-pointer ${showPreview ? 'bg-primary text-white' : 'bg-gray-100 text-muted'}`}>
                <Eye className="w-4 h-4" />
              </button>
              {!isSent && (
                <button onClick={handleSave} disabled={saving}
                  className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-50 ${
                    formScheduleEnabled ? 'bg-violet-600 hover:bg-violet-700' : 'bg-primary hover:bg-primary-dark'
                  }`}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formScheduleEnabled ? <CalendarClock className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  {saving ? '...' : formScheduleEnabled ? (isNl ? 'Inplannen' : 'Schedule') : (isNl ? 'Opslaan' : 'Save')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Editor body: split layout */}
        <div className="flex flex-col sm:flex-row min-h-[calc(100vh-160px)]">
          {/* Left: Editor panel */}
          <div className={`flex-1 overflow-y-auto p-3 sm:p-5 ${showPreview ? 'hidden sm:block' : ''}`}>
            <div className="max-w-xl mx-auto space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                  {t('newsletters.categoryLabel')}
                </label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {CATEGORIES.map(c => {
                    const isCustom = customCategories.some(cc => cc.value === c.value);
                    return (
                      <div key={c.value} className="relative group/cat">
                        <button type="button"
                          onClick={() => {
                            setFormCategory(c.value);
                            if (editorMode === 'create' && !formTitle && !formBlocks.some(b => b.content.trim())) {
                              const draft = CATEGORY_DRAFTS[c.value];
                              if (draft) { setFormTitle(draft.title); setFormBlocks(draft.blocks.map(b => ({ ...b, id: generateBlockId() }))); }
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                            formCategory === c.value ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-[#FAFAF9] text-muted hover:text-foreground'
                          }`}>
                          {c.emoji} {c.label}
                        </button>
                        {isCustom && (
                          <button type="button" onClick={() => removeCustomCategory(c.value)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover/cat:opacity-100 transition cursor-pointer">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {showAddCategory ? (
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
                      <input type="text" value={newCatEmoji} onChange={(e) => setNewCatEmoji(e.target.value)}
                        className="w-8 text-center text-sm focus:outline-none" maxLength={2} />
                      <input type="text" value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                        placeholder={isNl ? 'Naam...' : 'Name...'}
                        className="w-24 text-xs focus:outline-none" autoFocus />
                      <button type="button" onClick={addCustomCategory} disabled={!newCatLabel.trim()}
                        className="text-primary hover:text-primary-dark disabled:opacity-40 cursor-pointer">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => { setShowAddCategory(false); setNewCatLabel(''); setNewCatEmoji('📌'); }}
                        className="text-muted hover:text-foreground cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowAddCategory(true)}
                      className="w-7 h-7 rounded-lg border border-dashed border-gray-300 text-muted hover:text-primary hover:border-primary/40 flex items-center justify-center transition cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Font */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                  {isNl ? 'Lettertype' : 'Font'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FONT_OPTIONS.map(f => (
                    <button key={f.value} type="button" onClick={() => setFormFont(f.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        formFont === f.value ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-[#FAFAF9] text-muted hover:text-foreground'
                      }`}
                      style={{ fontFamily: f.css }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                  {t('newsletters.titleRequired')}
                </label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white border border-gray-200"
                  placeholder={isNl ? 'Onderwerp van de nieuwsbrief...' : 'Newsletter subject...'} />
              </div>

              {/* Event details (optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                    <Calendar className="w-3 h-3 inline -mt-0.5 mr-0.5" /> {t('newsletters.eventDate')}
                  </label>
                  <input type="date" value={formEventDate} onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white border border-gray-200 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                    <MapPin className="w-3 h-3 inline -mt-0.5 mr-0.5" /> {t('newsletters.location')}
                  </label>
                  <input type="text" value={formEventLocation} onChange={(e) => setFormEventLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white border border-gray-200"
                    placeholder={isNl ? 'Bijv. Lloret de Mar' : 'E.g. Lloret de Mar'} />
                </div>
              </div>

              {/* Block editor */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                  {isNl ? 'Inhoud' : 'Content'}
                </label>
                <BlockEditor blocks={formBlocks} onChange={setFormBlocks} isNl={isNl} />
              </div>

              {/* Scheduling */}
              <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formScheduleEnabled}
                    onChange={(e) => {
                      setFormScheduleEnabled(e.target.checked);
                      if (!e.target.checked) { setFormScheduleDate(''); setFormScheduleTime('09:00'); }
                    }}
                    className="accent-violet-600 w-4 h-4 cursor-pointer" />
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-medium text-foreground">{t('newsletters.scheduleOption')}</span>
                  </div>
                </label>
                {formScheduleEnabled && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">{t('newsletters.scheduleDate')}</label>
                      <input type="date" value={formScheduleDate} onChange={(e) => setFormScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">{t('newsletters.scheduleTime')}</label>
                      <input type="time" value={formScheduleTime} onChange={(e) => setFormScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer" />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
            </div>
          </div>

          {/* Right: Live preview panel */}
          <div className={`sm:w-[440px] md:w-[480px] lg:w-[520px] shrink-0 border-l border-gray-200 bg-[#F5F5F4] overflow-y-auto p-3 sm:p-5 ${showPreview ? '' : 'hidden sm:block'}`}>
            <div className="sticky top-0 z-10 bg-[#F5F5F4] pb-2 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted" />
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">{isNl ? 'Live preview' : 'Live preview'}</span>
              </div>
              <button onClick={() => setShowPreview(false)} className="sm:hidden p-1.5 rounded-lg bg-white shadow-sm cursor-pointer">
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>
            <EmailPreview
              title={formTitle}
              category={formCategory}
              eventDate={formEventDate}
              eventLocation={formEventLocation}
              blocks={formBlocks}
              dateLocale={dateLocale}
              isNl={isNl}
              getCategoryInfo={getCategoryInfo}
              font={formFont}
            />
          </div>
        </div>
      </div>
    );
  }

  // ===== NEWSLETTER LIST VIEW =====
  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
        {[
          { label: t('newsletters.total'), value: totalCount, icon: Newspaper, color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10' },
          { label: t('newsletters.drafts'), value: conceptCount, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: t('newsletters.scheduledCount'), value: scheduledCount, icon: CalendarClock, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: t('newsletters.sent'), value: sentCountStat, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('newsletters.totalRecipients'), value: totalRecipients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-2.5 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted">{s.label}</p>
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
            <input type="text" placeholder={t("newsletters.searchPlaceholder")} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-48" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
            <option value="all">{t('newsletters.allStatuses')}</option>
            <option value="concept">{t('newsletters.draftsFilter')}</option>
            <option value="ingepland">{t('newsletters.scheduledFilter')}</option>
            <option value="verzonden">{t('newsletters.sentFilter')}</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
            <option value="all">{t('newsletters.allCategories')}</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchNewsletters()}
            className="p-2 bg-white rounded-lg text-muted hover:text-primary transition-colors cursor-pointer border border-gray-200"
            title={isNl ? 'Vernieuwen' : 'Refresh'}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors cursor-pointer text-sm">
            <Plus className="w-4 h-4" />{t('newsletters.newNewsletter')}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl">
          <Newspaper className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground">{t('newsletters.noNewsletters')}</p>
          <p className="text-sm text-muted mt-1">
            {newsletters.length === 0 ? t('newsletters.createFirst') : t('newsletters.adjustSearch')}
          </p>
        </div>
      )}

      {/* Newsletter list */}
      <div className="space-y-3">
        {filtered.map((n) => {
          const cat = getCategoryInfo(n.category);
          const isSent = n.status === 'verzonden';
          const isScheduled = n.status === 'ingepland';
          const contentPreview = getContentPreviewText(n);

          let timeUntil = '';
          if (isScheduled && n.scheduled_at) {
            const diff = new Date(n.scheduled_at).getTime() - Date.now();
            if (diff > 0) {
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              if (days > 0) timeUntil = t('newsletters.daysLabel', { count: String(days) }) + ' ' + t('newsletters.hoursLabel', { count: String(hours) });
              else if (hours > 0) timeUntil = t('newsletters.hoursLabel', { count: String(hours) }) + ' ' + t('newsletters.minutesLabel', { count: String(mins) });
              else timeUntil = t('newsletters.minutesLabel', { count: String(mins) });
            }
          }

          // Count images
          const imageCount = n.content.startsWith('[{')
            ? parseContentToBlocks(n.content).filter(b => b.type === 'image').length
            : (n.photos ? (typeof n.photos === 'string' ? JSON.parse(n.photos) : n.photos).length : 0);

          return (
            <div key={n.id}
              className={`bg-white rounded-xl p-3 sm:p-5 hover:shadow-sm transition-shadow ${isScheduled ? 'ring-1 ring-violet-200' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FAFAF9] text-foreground">
                      {cat.emoji} {cat.label}
                    </span>
                    {isSent ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 inline -mt-0.5 mr-0.5" />{t('newsletters.sent')}
                      </span>
                    ) : isScheduled ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                        <Timer className="w-3 h-3 inline -mt-0.5 mr-0.5" />{t('newsletters.scheduled')}
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        <Clock className="w-3 h-3 inline -mt-0.5 mr-0.5" />{t('newsletters.draft')}
                      </span>
                    )}
                    {imageCount > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        <ImageIcon className="w-3 h-3 inline -mt-0.5 mr-0.5" />{imageCount}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-foreground truncate">{n.title}</h3>
                  <p className="text-sm text-muted mt-0.5 line-clamp-2">{contentPreview}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted flex-wrap">
                    {isScheduled && n.scheduled_at && (
                      <span className="flex items-center gap-1 text-violet-600 font-medium">
                        <CalendarClock className="w-3 h-3" />{formatDateTime(n.scheduled_at, dateLocale)}
                        {timeUntil && <span className="text-violet-400 font-normal ml-1">({t('newsletters.timeUntilSend', { time: timeUntil })})</span>}
                      </span>
                    )}
                    {n.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(n.event_date, dateLocale)}</span>}
                    {n.event_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{n.event_location}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(n.created_at, dateLocale)}</span>
                    {isSent && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{n.sent_count} {t('newsletters.recipients')}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openPreview(n)} className="p-2 rounded-lg hover:bg-[#FAFAF9] transition cursor-pointer" title={t("newsletters.preview")}>
                    <Eye className="w-4 h-4 text-muted" />
                  </button>
                  {!isSent && (
                    <>
                      <button onClick={() => openEdit(n)} className="p-2 rounded-lg hover:bg-[#FAFAF9] transition cursor-pointer" title={t("common.edit")}>
                        <Pencil className="w-4 h-4 text-muted" />
                      </button>
                      {!isScheduled && (
                        <button onClick={() => openSend(n)} className="p-2 rounded-lg hover:bg-emerald-50 transition cursor-pointer" title={t("common.send")}>
                          <Send className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => openDelete(n)} className="p-2 rounded-lg hover:bg-red-50 transition cursor-pointer" title={t("common.delete")}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Send / Delete Modals */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => { if (!saving) { setModal(null); resetForm(); } }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>

              {/* Send Modal */}
              {modal === 'send' && selected && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Send className="w-5 h-5 text-emerald-600" />{t('newsletters.sendNewsletter')}
                    </h2>
                    <button onClick={() => { setModal(null); resetForm(); }} className="p-1.5 hover:bg-muted/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>

                  {!sendResult ? (
                    <>
                      <div className="bg-amber-50 rounded-xl p-4 mb-5">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800 mb-1">{t('newsletters.sendWarning')}</p>
                            <p className="text-sm text-amber-700">{t('newsletters.sendWarningText')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FAFAF9] rounded-xl p-4 mb-5">
                        <p className="text-sm font-semibold text-foreground mb-1">{selected.title}</p>
                        <p className="text-xs text-muted">{getCategoryInfo(selected.category).emoji} {getCategoryInfo(selected.category).label}</p>
                      </div>

                      {/* Exclude emails */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          <UserMinus className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />{t('newsletters.excludeCustomers')}
                        </label>
                        {excludeEmails.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {excludeEmails.map((email, i) => {
                              const sub = subscribers.find(s => s.email.toLowerCase() === email);
                              return (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full text-xs text-red-700">
                                  {sub?.name ? <><span className="font-medium">{sub.name}</span> <span className="text-red-400">({email})</span></> : email}
                                  <button onClick={() => setExcludeEmails(excludeEmails.filter((_, j) => j !== i))} className="hover:text-red-900 cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <div className="relative">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                              <input ref={excludeInputRef} type="text" value={excludeInput}
                                onChange={(e) => { setExcludeInput(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && excludeInput.trim()) {
                                    e.preventDefault();
                                    if (excludeSuggestions.length > 0) {
                                      addExcludeEmail(excludeSuggestions[0].email);
                                    } else {
                                      addExcludeEmail(excludeInput.trim());
                                    }
                                  }
                                  if (e.key === 'Escape') setShowSuggestions(false);
                                }}
                                placeholder={isNl ? 'Zoek op naam of e-mail...' : 'Search by name or email...'}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                          </div>
                          {/* Autocomplete dropdown */}
                          {showSuggestions && excludeSuggestions.length > 0 && (
                            <div ref={suggestionsRef} className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-52 overflow-y-auto">
                              {excludeSuggestions.map((s, i) => (
                                <button key={i} type="button"
                                  onClick={() => addExcludeEmail(s.email)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-red-50 transition cursor-pointer first:rounded-t-xl last:rounded-b-xl">
                                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                    <UserMinus className="w-3.5 h-3.5 text-red-500" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">{s.name || s.email}</p>
                                    {s.name && <p className="text-xs text-muted truncate">{s.email}</p>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1.5">
                          {subscribers.length > 0
                            ? (isNl ? `${subscribers.length} abonnees gevonden` : `${subscribers.length} subscribers found`)
                            : (isNl ? 'Typ een naam of e-mailadres' : 'Type a name or email')
                          }
                        </p>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 mb-4">
                          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                        </div>
                      )}

                      {/* Test email */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <label className="block text-xs font-medium text-foreground mb-1.5">{t('newsletters.sendTestEmail')}</label>
                        <div className="flex gap-2">
                          <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                            placeholder={t('newsletters.testEmailPlaceholder')}
                            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200" />
                          <button onClick={handleTestSend} disabled={!testEmail.trim() || sendingTest}
                            className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0">
                            {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Test
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => { setModal(null); resetForm(); }} disabled={saving}
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#FAFAF9] transition cursor-pointer">
                          {t('common.cancel')}
                        </button>
                        <button onClick={handleSend} disabled={saving}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{t('newsletters.sendingInProgress')}</> : <><Send className="w-4 h-4" />{t('newsletters.yesSend')}</>}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">{t('newsletters.newsletterSent')}</h3>
                        <p className="text-sm text-muted">
                          {t('newsletters.sentSuccessfully', { sent: String(sendResult.sentCount), total: String(sendResult.totalEmails) })}
                        </p>
                      </div>
                      {success && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-2.5 mb-4">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
                        </div>
                      )}
                      <button onClick={() => { setModal(null); resetForm(); }}
                        className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition cursor-pointer">
                        {t('common.close')}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Delete Modal */}
              {modal === 'delete' && selected && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />{t('newsletters.deleteNewsletter')}
                    </h2>
                    <button onClick={() => setModal(null)} className="p-1.5 hover:bg-muted/10 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>
                  <p className="text-sm text-muted mb-4">{t('newsletters.deleteConfirm', { title: selected.title })} {t('newsletters.cannotUndo')}</p>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 mb-4">
                      <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setModal(null)} disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#FAFAF9] transition cursor-pointer">{t('common.cancel')}</button>
                    <button onClick={handleDelete} disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition cursor-pointer disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('common.delete')}
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
