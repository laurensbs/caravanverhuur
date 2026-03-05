'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
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

  const toggle = (key: string) => {
    const next = new Set(openItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpenItems(next);
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
      {/* Header */}
      <section className="relative h-[40vh] min-h-[280px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1626680114529-3f6ffa002b80?w=1920&q=80"
          alt="Camping bij zonsondergang"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
              {t('faq.heroTitle')}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/90 text-lg max-w-2xl mx-auto drop-shadow">
              {t('faq.heroSubtitle')}
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          {faqCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIdx * 0.1, duration: 0.5 }}
              className="mb-10"
            >
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <HelpCircle size={22} className="text-primary" />
                {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key} className="rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between p-4 text-left transition-colors"
                      >
                        <span className="font-medium text-foreground pr-4">{item.q}</span>
                        <ChevronDown
                          size={20}
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
                            <div className="px-4 pb-4 text-muted text-sm leading-relaxed pt-3">
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

          {/* CTA */}
          <div className="bg-surface rounded-2xl p-8 text-center mt-12">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('faq.notFoundTitle')}</h3>
            <p className="text-muted mb-6">{t('faq.notFoundText')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full transition-all shadow-md"
              >
                {t('faq.contactUs')}
                <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/34600000000?text=Hallo%2C%20ik%20heb%20een%20vraag."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-semibold rounded-full transition-all shadow-md"
              >
                WhatsApp
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
