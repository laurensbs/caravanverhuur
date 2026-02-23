'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ExternalLink, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
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
      setSubmitError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-20 min-h-[60vh] flex items-center">
        <div className="max-w-xl mx-auto px-4 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Bericht verzonden!</h1>
            <p className="text-muted text-lg">
              Bedankt, {form.name}! We nemen zo snel mogelijk contact met je op. Gemiddelde reactietijd: &lt;24 uur.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-dark via-primary to-cyan-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-bold mb-4">
            Contact
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-cyan-100 text-lg max-w-2xl mx-auto">
            Heb je vragen over onze caravans, het boekingsproces of iets anders? Neem gerust contact met ons op!
          </motion.p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Direct bereikbaar</h2>
                <div className="space-y-4">
                  <a href="mailto:info@caravanverhuurcostabrava.com" className="flex items-start gap-3 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Mail size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted">E-mail</div>
                      <div className="text-foreground font-medium">info@caravanverhuurcostabrava.com</div>
                    </div>
                  </a>
                  <a href="tel:+34600000000" className="flex items-start gap-3 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Phone size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted">Telefoon / WhatsApp</div>
                      <div className="text-foreground font-medium">+34 600 000 000</div>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted">Locatie</div>
                      <div className="text-foreground font-medium">Costa Brava, Spanje</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Onderdeel van</h3>
                <a
                  href="https://caravanstalling-spanje.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
                >
                  <ExternalLink size={16} />
                  Caravanstalling-Spanje.com
                </a>
                <p className="text-sm text-muted mt-2">
                  Voor transport, stalling en tweedehands caravans.
                </p>
              </div>

              <div className="bg-accent/10 rounded-2xl p-6 border border-accent/20">
                <h3 className="font-semibold text-foreground mb-2">Reactietijd</h3>
                <p className="text-sm text-muted">
                  We reageren binnen 24 uur op alle berichten. Voor urgente vragen kun je ons telefonisch of via WhatsApp bereiken.
                </p>
              </div>
            </motion.div>

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Stuur ons een bericht</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Naam *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Jan Jansen"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">E-mail *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="jan@voorbeeld.nl"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Telefoon</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+31 6 12345678"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Onderwerp *</label>
                      <select
                        required
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                      >
                        <option value="">Selecteer onderwerp</option>
                        <option value="boeking">Vraag over boeking</option>
                        <option value="caravans">Vraag over caravans</option>
                        <option value="prijzen">Vraag over prijzen</option>
                        <option value="beschikbaarheid">Beschikbaarheid</option>
                        <option value="transport">Transport</option>
                        <option value="anders">Anders</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bericht *</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Vertel ons hoe we je kunnen helpen..."
                      rows={5}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>
                  {submitError && <p className="text-red-500 text-sm mb-2">{submitError}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent disabled:from-border disabled:to-border disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verzenden...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Bericht versturen
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
