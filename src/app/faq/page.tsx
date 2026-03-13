'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight, Search, Sparkles, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/i18n/context';

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="pt-8 sm:pt-12 pb-10 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-foreground mb-3">{t('faq.heroTitle')}</h1>
            <p className="text-muted max-w-xl mx-auto">{t('faq.heroSubtitle')}</p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('faq.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all"
              />
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Smart assistant suggestion when searching */}
            <AnimatePresence>
              {searchQuery.trim().length > 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3"
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
          </div>

          {/* Results info when filtering — only show if search suggestion isn't already visible */}
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
          {/* No results text only (without duplicate button) when search suggestion is already showing */}
          {searchQuery.trim() && totalResults === 0 && searchQuery.trim().length > 2 && (
            <div className="text-center py-6">
              <p className="text-muted">{t('faq.searchNoResults')}</p>
            </div>
          )}

          {/* FAQ Categories */}
          {filteredCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.category}
              className="mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: catIdx * 0.05 }}
            >
              <h2 className="text-lg font-heading font-bold text-foreground mb-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <HelpCircle size={16} className="text-foreground" />
                </div>
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

          {/* Smart Assistant Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-surface border border-border rounded-2xl p-6 mt-4 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-bold text-foreground mb-1">{t('faq.smartAssistantTitle')}</h3>
                <p className="text-muted text-sm mb-4">{t('faq.smartAssistantText')}</p>
                <button
                  onClick={() => openChatWithQuestion()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-white font-semibold rounded-lg hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  <MessageCircle size={16} />
                  {t('faq.askSmartAssistant')}
                </button>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <div className="relative rounded-2xl p-8 text-center overflow-hidden">
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
    </>
  );
}
