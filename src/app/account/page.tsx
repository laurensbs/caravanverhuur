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
import { useLanguage } from '@/i18n/context';

export default function AccountPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
  const strengthLabels = ['', t('account.strengthWeak'), t('account.strengthFair'), t('account.strengthGood'), t('account.strengthStrong')];
  const strengthColors = ['', 'bg-danger', 'bg-primary', 'bg-primary', 'bg-primary'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register' && !acceptTerms) {
        setError(t('account.errorTerms'));
        setLoading(false);
        return;
      }
      if (mode === 'register' && password.length < 6) {
        setError(t('account.errorPasswordLength'));
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
        setError(data.error || t('account.errorGeneral'));
        return;
      }

      setSuccess(mode === 'register' ? t('account.successRegister') : t('account.successLogin'));
      setTimeout(() => router.push('/mijn-account'), 800);
    } catch {
      setError(t('account.errorConnection'));
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
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
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
            <div />

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                  {t('account.heroTitle')}<br />
                  <span className="text-primary-light">{t('account.heroTitleHighlight')}</span>
                </h2>
                <p className="text-white/70 mt-4 text-sm xl:text-base max-w-md leading-relaxed">
                  {t('account.heroDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { icon: <MapPin size={18} />, text: t('account.feat8Destinations') },
                  { icon: <Sun size={18} />, text: t('account.feat300Sun') },
                  { icon: <Shield size={18} />, text: t('account.featSafeBooking') },
                  { icon: <Star size={18} />, text: t('account.feat48Rating') },
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
              <div className="flex -space-x-2"> {['bg-primary', 'bg-primary', 'bg-primary-light', 'bg-danger/70'].map((bg, i) => ( <div key={i} className={`w-8 h-8 rounded-full ${bg} border-primary-dark flex items-center justify-center text-white text-xs font-bold`}> {['JB', 'ML', 'PV', 'AK'][i]} </div> ))} </div> <div> <p className="text-white/90 text-sm font-medium">{t('account.socialProof')}</p>
                <p className="text-white/50 text-xs">{t('account.socialProofSub')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== RIGHT SIDE — FORM ====== */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Mobile hero header */}
          <div className="lg:hidden bg-primary-dark px-5 pt-6 pb-10">
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login' ? t('account.welcomeBack') : t('account.createAccount')}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {mode === 'login' ? t('account.loginSubtitle') : t('account.registerSubtitle')}
            </p>
          </div>

          {/* Form container */}
          <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 -mt-4 lg:mt-0">
            <div className="w-full max-w-[420px] py-6 lg:py-0">
              {/* Desktop heading */}
              <div className="hidden lg:block mb-8">
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">
                  {mode === 'login' ? t('account.welcomeBack') : t('account.createAccount')}
                </h1>
                <p className="text-muted text-sm mt-1.5">
                  {mode === 'login'
                    ? t('account.loginSubtitleDesktop')
                    : t('account.registerSubtitleDesktop')}
                </p>
              </div>

              {/* Form card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-5 sm:p-7"
              >
                {/* Tab switcher */}
                <div className="flex bg-surface rounded-xl p-1 mb-5">
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-muted'
                    }`}
                  >
                    {t('account.tabLogin')}
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-muted'
                    }`} > {t('account.tabRegister')} </button> </div> {/* Error / Success messages */} <AnimatePresence mode="wait"> {error && ( <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-start gap-2.5 bg-danger/5 text-danger text-sm p-3.5 rounded-xl mb-4 border-danger/20" > <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span className="leading-relaxed">{error}</span> </motion.div> )} {success && ( <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-start gap-2.5 bg-primary-50 text-primary-dark text-sm p-3.5 rounded-xl mb-4 border-primary-100" > <CheckCircle size={16} className="shrink-0 mt-0.5" /> <span className="leading-relaxed">{success}</span> </motion.div> )} </AnimatePresence> <form onSubmit={handleSubmit} className="space-y-3.5"> {/* Name (register) */} <AnimatePresence> {mode ==='register' && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"> <label className="block text-xs font-semibold text-foreground-light mb-1.5">{t('account.labelName')}</label> <div className="relative"> <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /> <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('account.placeholderName')} required={mode === 'register'} className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" /> </div> </motion.div> )} </AnimatePresence> {/* Email */} <div> <label className="block text-xs font-semibold text-foreground-light mb-1.5">{t('account.labelEmail')}</label> <div className="relative"> <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('account.placeholderEmail')} required autoComplete="email" className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" /> </div> </div> {/* Password */} <div> <label className="block text-xs font-semibold text-foreground-light mb-1.5">{t('account.labelPassword')}</label> <div className="relative"> <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /> <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? t('account.placeholderPasswordNew') : '••••••••'} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full pl-10 pr-12 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" /> <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors"> {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} </button> </div> {mode ==='login' && ( <p className="text-xs text-muted mt-1.5"> {t('account.forgotPassword')}{' '} <Link href="/contact" className="text-primary font-medium">{t('account.contactUs')}</Link> </p> )} {mode === 'register' && password.length > 0 && ( <div className="mt-2.5"> <div className="flex gap-1"> {[1, 2, 3, 4].map(i => ( <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-surface-alt'}`} />
                          ))}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${passwordStrength <= 1 ? 'text-danger' : passwordStrength <= 2 ? 'text-primary' : 'text-primary'}`}>
                          {strengthLabels[passwordStrength]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Phone (register) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="block text-xs font-semibold text-foreground-light mb-1.5">{t('account.labelPhone')} <span className="text-muted font-normal">{t('account.optional')}</span></label> <div className="relative"> <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /> <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 12345678" className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" /> </div> </motion.div> )} </AnimatePresence> {/* Terms checkbox (register) */} <AnimatePresence> {mode ==='register' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-start gap-2.5 pt-1">
                        <input type="checkbox" id="acceptTerms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer" />
                        <label htmlFor="acceptTerms" className="text-xs text-muted leading-relaxed cursor-pointer">
                          {t('account.agreeWith')}{' '}
                          <Link href="/voorwaarden" className="text-primary font-medium" target="_blank">{t('account.termsLink')}</Link>{' '}
                          {t('account.andThe')}{' '}
                          <Link href="/privacy" className="text-primary font-medium" target="_blank">{t('account.privacyLink')}</Link>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-primary disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all mt-2 shadow-sm shadow-primary/20">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>{mode === 'login' ? t('account.btnLogin') : t('account.btnRegister')} <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                {/* Footer switch */}
                <div className="mt-5 pt-4 text-center text-sm text-muted">
                  {mode === 'login' ? (
                    <p>{t('account.noAccount')}{' '}<button onClick={() => { setMode('register'); setError(''); }} className="text-primary font-semibold">{t('account.registerFree')}</button></p>
                  ) : (
                    <p>{t('account.hasAccount')}{' '}<button onClick={() => { setMode('login'); setError(''); }} className="text-primary font-semibold">{t('account.loginLink')}</button></p>
                  )}
                </div>
              </motion.div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                {[
                  { icon: <Shield size={13} />, text: t('account.trustSSL') },
                  { icon: <CheckCircle size={13} />, text: t('account.trustFree') },
                  { icon: <Palmtree size={13} />, text: t('account.trustDirect') },
                ].map((badge, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <span className="text-muted">{badge.icon}</span>
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
