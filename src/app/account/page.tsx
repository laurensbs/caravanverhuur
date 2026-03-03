'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, AlertCircle,
  CheckCircle, Loader2, Shield, Star, MapPin, Sun, Palmtree,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Check if already logged in → redirect
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) { router.replace('/mijn-account'); return; }
      } catch { /* not logged in */ }
      setCheckingSession(false);
    }
    checkSession();
  }, [router]);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 8 ? 2 : password.length < 12 ? 3 : 4;
  const strengthLabels = ['', 'Zwak', 'Redelijk', 'Goed', 'Sterk'];
  const strengthColors = ['', 'bg-danger', 'bg-primary', 'bg-primary', 'bg-primary'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register' && !acceptTerms) {
        setError('Je moet akkoord gaan met de voorwaarden en het privacybeleid.');
        setLoading(false);
        return;
      }
      if (mode === 'register' && password.length < 6) {
        setError('Wachtwoord moet minimaal 6 tekens bevatten.');
        setLoading(false);
        return;
      }

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { email, password, name, phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Er is een fout opgetreden. Probeer het opnieuw.');
        return;
      }

      setSuccess(mode === 'register' ? 'Account aangemaakt! Je wordt doorgestuurd...' : 'Welkom terug!');
      setTimeout(() => router.push('/mijn-account'), 800);
    } catch {
      setError('Kan geen verbinding maken met de server. Controleer je internetverbinding.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex min-h-screen">
        {/* ====== LEFT HERO (desktop only) ====== */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-dark via-primary to-primary-light overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <Image
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80"
              alt="Costa Brava strand"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
            <div>
              <Link href="/">
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
                  alt="Caravanverhuur Costa Brava"
                  width={200}
                  height={60}
                  className="h-10 w-auto"
                  unoptimized
                />
              </Link>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                  Jouw vakantie,<br />
                  <span className="text-primary-light">altijd bij de hand.</span>
                </h2>
                <p className="text-white/70 mt-4 text-sm xl:text-base max-w-md leading-relaxed">
                  Beheer je boekingen, volg betalingen, bekijk je borgchecklist en plan je volgende vakantie — alles op één plek.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { icon: <MapPin size={18} />, text: '8 bestemmingen' },
                  { icon: <Sun size={18} />, text: '300+ zondagen/jaar' },
                  { icon: <Shield size={18} />, text: 'Veilig boeken' },
                  { icon: <Star size={18} />, text: '4.8/5 beoordeling' },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2.5 text-white/90 text-sm"
                  >
                    <span className="text-primary-light">{f.icon}</span>
                    {f.text}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['bg-primary', 'bg-primary', 'bg-primary-light', 'bg-danger/70'].map((bg, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-primary-dark flex items-center justify-center text-white text-[10px] font-bold`}>
                    {['JB', 'ML', 'PV', 'AK'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">350+ tevreden gasten</p>
                <p className="text-white/50 text-xs">gingen je voor in 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== RIGHT SIDE — FORM ====== */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Mobile hero header */}
          <div className="lg:hidden bg-gradient-to-br from-primary-dark to-primary px-5 pt-6 pb-10">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
                alt="Caravanverhuur Costa Brava"
                width={160}
                height={48}
                className="h-8 w-auto"
                unoptimized
              />
            </Link>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welkom terug!' : 'Account aanmaken'}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {mode === 'login' ? 'Log in om je boekingen te beheren' : 'Gratis registreren in 30 seconden'}
            </p>
          </div>

          {/* Form container */}
          <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 -mt-4 lg:mt-0">
            <div className="w-full max-w-[420px] py-6 lg:py-0">
              {/* Desktop heading */}
              <div className="hidden lg:block mb-8">
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">
                  {mode === 'login' ? 'Welkom terug!' : 'Account aanmaken'}
                </h1>
                <p className="text-muted text-sm mt-1.5">
                  {mode === 'login'
                    ? 'Log in om je boekingen en borgchecklists te bekijken'
                    : 'Gratis registreren — beheer alles op één plek'}
                </p>
              </div>

              {/* Form card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-border/50 p-5 sm:p-7"
              >
                {/* Tab switcher */}
                <div className="flex bg-surface rounded-xl p-1 mb-5">
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-foreground-light'
                    }`}
                  >
                    Inloggen
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-foreground-light'
                    }`}
                  >
                    Registreren
                  </button>
                </div>

                {/* Error / Success messages */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-2.5 bg-danger/5 text-danger text-sm p-3.5 rounded-xl mb-4 border border-danger/20"
                    >
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-2.5 bg-primary-50 text-primary-dark text-sm p-3.5 rounded-xl mb-4 border border-primary-100"
                    >
                      <CheckCircle size={16} className="shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Name (register) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="block text-xs font-semibold text-foreground-light mb-1.5">Volledige naam</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan de Vries" required={mode === 'register'}
                            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground-light mb-1.5">E-mailadres</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" required autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground-light mb-1.5">Wachtwoord</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'register' ? 'Minimaal 6 tekens' : '••••••••'} required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="w-full pl-10 pr-12 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground-light transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {mode === 'login' && (
                      <p className="text-[11px] text-muted mt-1.5">
                        Wachtwoord vergeten?{' '}
                        <Link href="/contact" className="text-primary hover:underline font-medium">Neem contact op</Link>
                      </p>
                    )}
                    {mode === 'register' && password.length > 0 && (
                      <div className="mt-2.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-surface-alt'}`} />
                          ))}
                        </div>
                        <p className={`text-[11px] mt-1 font-medium ${passwordStrength <= 1 ? 'text-danger' : passwordStrength <= 2 ? 'text-primary' : 'text-primary'}`}>
                          {strengthLabels[passwordStrength]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Phone (register) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="block text-xs font-semibold text-foreground-light mb-1.5">Telefoonnummer <span className="text-muted font-normal">(optioneel)</span></label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 12345678"
                            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Terms checkbox (register) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-start gap-2.5 pt-1">
                        <input type="checkbox" id="acceptTerms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" />
                        <label htmlFor="acceptTerms" className="text-xs text-muted leading-relaxed cursor-pointer">
                          Ik ga akkoord met de{' '}
                          <Link href="/voorwaarden" className="text-primary hover:underline font-medium" target="_blank">Algemene Voorwaarden</Link>{' '}
                          en het{' '}
                          <Link href="/privacy" className="text-primary hover:underline font-medium" target="_blank">Privacybeleid</Link>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 shadow-sm shadow-primary/20">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>{mode === 'login' ? 'Inloggen' : 'Gratis account aanmaken'} <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                {/* Footer switch */}
                <div className="mt-5 pt-4 border-t border-border/50 text-center text-sm text-muted">
                  {mode === 'login' ? (
                    <p>Nog geen account?{' '}<button onClick={() => { setMode('register'); setError(''); }} className="text-primary font-semibold hover:underline">Registreer gratis</button></p>
                  ) : (
                    <p>Al een account?{' '}<button onClick={() => { setMode('login'); setError(''); }} className="text-primary font-semibold hover:underline">Log in</button></p>
                  )}
                </div>
              </motion.div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                {[
                  { icon: <Shield size={13} />, text: 'SSL beveiligd' },
                  { icon: <CheckCircle size={13} />, text: 'Gratis account' },
                  { icon: <Palmtree size={13} />, text: 'Direct boeken' },
                ].map((badge, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
                    <span className="text-border">{badge.icon}</span>
                    {badge.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
