'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ExternalLink, Send, CheckCircle, Clock, MessageCircle } from 'lucide-react';
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
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-primary" size={40} />
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
      {/* Hero header */}
      <section className="pt-8 sm:pt-10 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{t('contact.sendMessage')}</h1>
          <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto">{t('contact.heroSubtitle')}</p>
        </div>
      </section>

      {/* Contact cards row */}
      <section className="pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="mailto:info@caravanverhuurspanje.com" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Mail size={22} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-muted">{t('contact.emailLabel')}</div>
                <div className="text-foreground font-semibold truncate">info@caravanverhuurspanje.com</div>
              </div>
            </a>
            <a href="tel:+34650036755" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Phone size={22} className="text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted">{t('contact.phoneWhatsapp')}</div>
                <div className="text-foreground font-semibold">+34 650 036 755</div>
              </div>
            </a>
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={22} className="text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted">{t('contact.locationLabel')}</div>
                <div className="text-foreground font-semibold">Costa Brava, Spanje</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Contact form — spans 2 cols */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t('contact.nameLabel')} *</label>
                      <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jan Jansen" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t('contact.emailLabel')} *</label>
                      <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jan@voorbeeld.nl" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t('contact.phoneLabel')}</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+31 6 12345678" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t('contact.subjectLabel')} *</label>
                      <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all">
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
                    <label className="block text-sm font-medium text-foreground mb-2">{t('contact.messageLabel')} *</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder={t('contact.messagePlaceholder')}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all resize-none"
                    />
                  </div>
                  {submitError && <p className="text-danger text-sm">{submitError}</p>}
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-8 py-3 bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
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
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
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
                className="flex items-center gap-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl p-5 transition-colors group shadow-sm"
              >
                <MessageCircle size={24} className="shrink-0" />
                <div>
                  <div className="font-semibold text-sm">{t('contact.whatsappPrefer')}</div>
                  <div className="text-white/80 text-xs">{t('contact.whatsappDirect')}</div>
                </div>
              </a>

              {/* Part of */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-2">{t('contact.partOf')}</h3>
                <a
                  href="https://caravanstalling-spanje.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary font-medium hover:underline"
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
