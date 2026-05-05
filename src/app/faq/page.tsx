'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight, Search, Sparkles, MessageCircle } from 'lucide-react';
import BookingCTA from '@/components/BookingCTA';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/i18n/context';
import { breadcrumbJsonLd } from '@/lib/structured-data';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  const faqCategories = useMemo(() => [
    {
      category: t('faq.cat1'),
      items: [
        { q: t('faq.q1_1'), a: t('faq.a1_1') },
        { q: t('faq.q1_2'), a: t('faq.a1_2') },
        { q: t('faq.q1_3'), a: t('faq.a1_3') },
        { q: t('faq.q1_4'), a: t('faq.a1_4') },
        { q: t('faq.q1_5'), a: t('faq.a1_5') },
        { q: t('faq.q1_6'), a: t('faq.a1_6') },
      ],
    },
    {
      category: t('faq.cat2'),
      items: [
        { q: t('faq.q2_1'), a: t('faq.a2_1') },
        { q: t('faq.q2_2'), a: t('faq.a2_2') },
        { q: t('faq.q2_3'), a: t('faq.a2_3') },
        { q: t('faq.q2_4'), a: t('faq.a2_4') },
      ],
    },
    {
      category: t('faq.cat3'),
      items: [
        { q: t('faq.q3_1'), a: t('faq.a3_1') },
        { q: t('faq.q3_2'), a: t('faq.a3_2') },
        { q: t('faq.q3_3'), a: t('faq.a3_3') },
        { q: t('faq.q3_4'), a: t('faq.a3_4') },
        { q: t('faq.q3_5'), a: t('faq.a3_5') },
        { q: t('faq.q3_6'), a: t('faq.a3_6') },
        { q: t('faq.q3_7'), a: t('faq.a3_7') },
      ],
    },
    {
      category: t('faq.cat4'),
      items: [
        { q: t('faq.q4_1'), a: t('faq.a4_1') },
        { q: t('faq.q4_2'), a: t('faq.a4_2') },
      ],
    },
  ], [t]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;
    const q = searchQuery.toLowerCase();
    return faqCategories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0);
  }, [faqCategories, searchQuery]);

  const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);

  const toggle = (key: string) => {
    const next = new Set(openItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpenItems(next);
  };

  const openChatWithQuestion = (question?: string) => {
    window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { message: question } }));
  };

  // Build FAQ JSON-LD
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap(cat =>
      cat.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      }))
    ),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', href: '/' },
    { name: 'FAQ', href: '/faq' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <section className="pt-8 sm:pt-12 pb-10 sm:pb-16">
        {/* Hero — centered, full width */}
        <div className="max-w-3xl mx-auto px-4 text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-foreground mb-3">{t('faq.heroTitle')}</h1>
          <p className="text-muted max-w-xl mx-auto">{t('faq.heroSubtitle')}</p>
        </div>

        {/* Two-column layout */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">

            {/* Left sidebar — category nav + search + assistant */}
            <aside className="lg:sticky lg:top-[108px] lg:self-start space-y-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('faq.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
                />
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Category nav */}
              <nav className="bg-surface border border-border rounded-xl p-1.5">
                {faqCategories.map((cat, idx) => {
                  const isActive = !searchQuery.trim() || filteredCategories.some(fc => fc.category === cat.category);
                  return (
                    <button
                      key={cat.category}
                      onClick={() => {
                        setSearchQuery('');
                        document.getElementById(`faq-cat-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors cursor-pointer ${
                        isActive ? 'text-foreground hover:bg-foreground/5' : 'text-muted/50'
                      }`}
                    >
                      <HelpCircle size={15} className="shrink-0" />
                      {cat.category}
                      <span className="ml-auto text-xs text-muted bg-foreground/5 px-2 py-0.5 rounded-full">{cat.items.length}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Smart Assistant Card */}
              <div className="bg-foreground rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold">{t('faq.smartAssistantTitle')}</h3>
                </div>
                <p className="text-white/70 text-xs leading-relaxed mb-4">{t('faq.smartAssistantText')}</p>
                <button
                  onClick={() => openChatWithQuestion()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-foreground font-semibold rounded-lg text-sm hover:bg-white/90 transition-colors cursor-pointer"
                >
                  <MessageCircle size={14} />
                  {t('faq.askSmartAssistant')}
                </button>
              </div>
            </aside>

            {/* Right — FAQ questions */}
            <div>
              {/* Smart assistant suggestion when searching */}
              <AnimatePresence>
                {searchQuery.trim().length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                  >
                    <button
                      onClick={() => openChatWithQuestion(searchQuery)}
                      className="w-full flex items-center gap-3 p-3.5 bg-foreground/5 border border-foreground/10 rounded-xl hover:bg-foreground/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center shrink-0">
                        <Sparkles size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{t('faq.askAssistant')}</p>
                        <p className="text-xs text-muted truncate">&ldquo;{searchQuery}&rdquo;</p>
                      </div>
                      <ArrowRight size={16} className="text-muted shrink-0" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No results */}
              {searchQuery.trim() && totalResults === 0 && searchQuery.trim().length <= 2 && (
                <div className="text-center py-8">
                  <p className="text-muted mb-4">{t('faq.searchNoResults')}</p>
                  <button
                    onClick={() => openChatWithQuestion(searchQuery)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-white font-semibold rounded-lg hover:bg-foreground/90 transition-colors cursor-pointer"
                  >
                    <Sparkles size={16} />
                    {t('faq.askSmartAssistant')}
                  </button>
                </div>
              )}
              {searchQuery.trim() && totalResults === 0 && searchQuery.trim().length > 2 && (
                <div className="text-center py-6">
                  <p className="text-muted">{t('faq.searchNoResults')}</p>
                </div>
              )}

              {/* FAQ Categories */}
              {filteredCategories.map((cat, catIdx) => (
                <motion.div
                  key={cat.category}
                  id={`faq-cat-${faqCategories.findIndex(fc => fc.category === cat.category)}`}
                  className="mb-10 scroll-mt-28"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: catIdx * 0.05 }}
                >
                  <h2 className="text-lg font-heading font-bold text-foreground mb-4 pb-2 border-b border-border">
                    {cat.category}
                  </h2>
                  <div className="space-y-2">
                    {cat.items.map((item, itemIdx) => {
                      const key = `${catIdx}-${itemIdx}`;
                      const isOpen = openItems.has(key);
                      return (
                        <div key={key} className="rounded-xl overflow-hidden bg-surface border border-border">
                          <button
                            onClick={() => toggle(key)}
                            className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-foreground/[0.03] cursor-pointer"
                          >
                            <span className="font-medium text-foreground pr-4 text-[15px]">{item.q}</span>
                            <ChevronDown
                              size={18}
                              className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 text-muted text-sm leading-relaxed border-t border-border pt-3">
                                  {item.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA — full width below grid */}
          <div className="relative rounded-2xl p-8 text-center overflow-hidden mt-8">
            <div className="absolute inset-0 bg-[url('/images/campings/begur_sa_tuna.jpg')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-foreground/90" />
            <div className="relative">
              <h3 className="text-xl font-heading font-bold text-white mb-2">{t('faq.notFoundTitle')}</h3>
              <p className="text-white/70 mb-6">{t('faq.notFoundText')}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-foreground font-semibold rounded-lg transition-all hover:bg-white/90"
                >
                  {t('faq.contactUs')}
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="https://wa.me/34650036755?text=Hallo%2C%20ik%20heb%20een%20vraag."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-semibold rounded-lg transition-all hover:bg-[#20bd5a]"
                >
                  WhatsApp
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOOKING CTA ===== */}
      <BookingCTA />
    </>
  );
}
