'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink, Send, CheckCircle, Clock, MessageCircle, Instagram, ArrowRight } from 'lucide-react';
import { INSTAGRAM_URL } from '@/lib/constants';
import { useLanguage } from '@/i18n/context';

export default function ContactPage() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    website: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      setSubmitError(t('contact.errorText'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-20 min-h-[60vh] flex items-center">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div>
            <div className="w-20 h-20 bg-foreground/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-foreground" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{t('contact.successTitle')}</h1>
            <p className="text-muted text-lg">
              {t('contact.successText')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero banner with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/campings/palam_s_-_view_from_beach.jpg"
            alt="Costa Brava uitzicht"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/80 to-foreground/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-20">
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight text-white mb-2 sm:mb-3">{t('contact.sendMessage')}</h1>
            <p className="text-white/70 text-sm sm:text-lg">{t('contact.heroSubtitle')}</p>
          </div>

          {/* Contact cards — overlapping the hero bottom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-8 sm:mt-10">
            <a href="mailto:info@caravanverhuurspanje.com" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all flex items-center gap-3.5 group">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                <Mail size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-white/60">{t('contact.emailLabel')}</div>
                <div className="text-white font-semibold text-sm truncate">info@caravanverhuurspanje.com</div>
              </div>
            </a>
            <a href="tel:+34650036755" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all flex items-center gap-3.5 group">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                <Phone size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-white/60">{t('contact.phoneWhatsapp')}</div>
                <div className="text-white font-semibold text-sm">+34 650 036 755</div>
              </div>
            </a>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex items-center gap-3.5">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-white/60">{t('contact.locationLabel')}</div>
                <div className="text-white font-semibold text-sm">Costa Brava, Spanje</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="pb-8 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10">
            {/* Contact form — spans 2 cols */}
            <div className="lg:col-span-2">
              <div className="bg-surface rounded-2xl p-4 sm:p-8 border border-border">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">{t('contact.nameLabel')} *</label>
                      <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('contact.placeholderName')} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:bg-white focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">{t('contact.emailLabel')} *</label>
                      <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={t('contact.placeholderEmail')} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:bg-white focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">{t('contact.phoneLabel')}</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={t('contact.placeholderPhone')} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:bg-white focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">{t('contact.subjectLabel')} *</label>
                      <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:bg-white focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 outline-none transition-all">
                        <option value="">{t('contact.subjectPlaceholder')}</option>
                        <option value="boeking">{t('contact.subjectBooking')}</option>
                        <option value="caravans">{t('contact.subjectCaravans')}</option>
                        <option value="prijzen">{t('contact.subjectPrices')}</option>
                        <option value="beschikbaarheid">{t('contact.subjectAvailability')}</option>
                        <option value="transport">{t('contact.subjectTransport')}</option>
                        <option value="anders">{t('contact.subjectOther')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">{t('contact.messageLabel')} *</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder={t('contact.messagePlaceholder')}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:bg-white focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 outline-none transition-all resize-none"
                    />
                  </div>
                  {/* Honeypot field — hidden from real users, bots will fill it */}
                  <div className="absolute opacity-0 -z-10" aria-hidden="true" tabIndex={-1}>
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      autoComplete="off"
                      tabIndex={-1}
                      value={form.website}
                      onChange={e => setForm({ ...form, website: e.target.value })}
                    />
                  </div>
                  {submitError && <p className="text-danger text-sm">{submitError}</p>}
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-8 py-3 bg-foreground disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:bg-foreground/90 active:scale-[0.98]">
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('contact.sending')}
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        {t('contact.sendButton')}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Availability */}
              <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-foreground" />
                  {t('contact.availability')}
                </h3>
                <div className="text-sm text-muted space-y-1.5">
                  <p>{t('contact.monFri')}</p>
                  <p>{t('contact.sat')}</p>
                  <p>{t('contact.sunClosed')}</p>
                </div>
                <p className="text-xs text-muted/60 mt-3">{t('contact.emailResponseTime')}</p>
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/34650036755?text=Hallo%2C%20ik%20heb%20een%20vraag%20over%20caravanverhuur."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl p-5 transition-colors group"
              >
                <MessageCircle size={24} className="shrink-0" />
                <div>
                  <div className="font-semibold text-sm">{t('contact.whatsappPrefer')}</div>
                  <div className="text-white/80 text-xs">{t('contact.whatsappDirect')}</div>
                </div>
              </a>

              {/* Instagram */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#1a1a2e] hover:bg-[#22223a] rounded-2xl p-5 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/25">
                    <Instagram size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t('home.instagramTitle')}</div>
                    <div className="text-white/50 text-xs">@caravanverhuurcostabrava</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-pink-400 group-hover:text-pink-300 transition-colors">
                  {t('home.followInstagram')} <ArrowRight size={14} />
                </div>
              </a>

              {/* Part of */}
              <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-2">{t('contact.partOf')}</h3>
                <a
                  href="https://caravanstalling-spanje.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-foreground font-medium hover:underline"
                >
                  <ExternalLink size={16} />
                  Caravanstalling-Spanje.com
                </a>
                <p className="text-sm text-muted mt-2">{t('contact.partOfDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
