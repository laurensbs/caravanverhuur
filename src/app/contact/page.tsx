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
      <section className="pt-28 sm:pt-32 pb-10 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact info */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">{t('contact.directlyAvailable')}</h2>
                <div className="space-y-4">
                  <a href="mailto:info@caravanverhuurspanje.com" className="flex items-start gap-3 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                      <Mail size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted">{t('contact.emailLabel')}</div>
                      <div className="text-foreground font-medium">info@caravanverhuurspanje.com</div>
                    </div>
                  </a>
                  <a href="tel:+34650036755" className="flex items-start gap-3 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                      <Phone size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted">{t('contact.phoneWhatsapp')}</div>
                      <div className="text-foreground font-medium">+34 650 036 755</div>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted">{t('contact.locationLabel')}</div>
                      <div className="text-foreground font-medium">Costa Brava, Spanje</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-3">{t('contact.partOf')}</h3>
                <a
                  href="https://caravanstalling-spanje.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary font-medium"
                >
                  <ExternalLink size={16} />
                  Caravanstalling-Spanje.com
                </a>
                <p className="text-sm text-muted mt-2">
                  {t('contact.partOfDesc')} </p> </div> <div className="bg-primary/10 rounded-2xl p-6 border-primary/20"> <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Clock size={18} className="text-primary" />{t('contact.availability')}</h3>
                <div className="text-sm text-muted space-y-1">
                  <p>{t('contact.monFri')}</p>
                  <p>{t('contact.sat')}</p>
                  <p>{t('contact.sunClosed')}</p>
                  <p className="text-xs mt-2 text-muted/70">{t('contact.emailResponseTime')}</p>
                </div>
              </div>

              <a
                href="https://wa.me/34650036755?text=Hallo%2C%20ik%20heb%20een%20vraag%20over%20caravanverhuur."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] text-white rounded-2xl p-5 transition-colors group"
              >
                <MessageCircle size={24} className="shrink-0" />
                <div>
                  <div className="font-semibold text-sm">{t('contact.whatsappPrefer')}</div>
                  <div className="text-white/80 text-xs">{t('contact.whatsappDirect')}</div>
                </div>
              </a>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">{t('contact.sendMessage')}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t('contact.nameLabel')} *</label> <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jan Jansen" className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" /> </div> <div> <label className="block text-sm font-medium text-foreground mb-2">{t('contact.emailLabel')} *</label> <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jan@voorbeeld.nl" className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" /> </div> </div> <div className="grid grid-cols-1 sm:grid-cols-2 gap-5"> <div> <label className="block text-sm font-medium text-foreground mb-2">{t('contact.phoneLabel')}</label> <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+31 6 12345678" className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" /> </div> <div> <label className="block text-sm font-medium text-foreground mb-2">{t('contact.subjectLabel')} *</label> <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white" > <option value="">{t('contact.subjectPlaceholder')}</option>
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
                      placeholder={t('contact.messagePlaceholder')} rows={5} className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" /> </div> {submitError && <p className="text-danger text-sm mb-2">{submitError}</p>} <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-8 py-3 bg-primary disabled:from-muted disabled:to-muted disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all shadow-md" > {submitting ? ( <> <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('contact.sending')}
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
          </div>
        </div>
      </section>
    </>
  );
}
