'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, AlertCircle,
  CheckCircle, Loader2, Shield, Star, MapPin, Sun, Palmtree, ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

/* Typewriter animation for the heading */
function TypewriterText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
          }}
          className="inline-block"
          style={char === ' ' ? { width: '0.25em' } : undefined}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

function AccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();

  // Determine initial mode from URL
  const resetToken = searchParams.get('reset');
  const initialMode = resetToken ? 'reset-password' : 'login';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);

  // Form fields — pre-fill email vanuit ?email=... query (van /betaling/succes na auto-account)
  const [email, setEmail] = useState(searchParams.get('email') || '');
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

  const modeTitle = mode === 'forgot-password' ? t('account.forgotPasswordTitle') : mode === 'reset-password' ? t('account.resetPasswordTitle') : mode === 'login' ? t('account.welcomeBack') : t('account.createAccount');
  const modeSubtitle = mode === 'forgot-password' ? t('account.forgotPasswordSubtitle') : mode === 'reset-password' ? t('account.resetPasswordSubtitle') : mode === 'login' ? t('account.loginSubtitle') : t('account.registerSubtitle');
  const modeSubtitleDesktop = mode === 'forgot-password' ? t('account.forgotPasswordSubtitle') : mode === 'reset-password' ? t('account.resetPasswordSubtitle') : mode === 'login' ? t('account.loginSubtitleDesktop') : t('account.registerSubtitleDesktop');
  const strengthColors = ['', 'bg-danger', 'bg-primary', 'bg-primary', 'bg-primary'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setShowResendVerification(false);

    try {
      // Forgot password mode
      if (mode === 'forgot-password') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t('account.errorGeneral'));
          return;
        }
        setSuccess(t('account.forgotSuccess'));
        return;
      }

      // Reset password mode
      if (mode === 'reset-password') {
        if (password.length < 6) {
          setError(t('account.errorPasswordLength'));
          setLoading(false);
          return;
        }
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t('account.errorGeneral'));
          return;
        }
        setSuccess(t('account.resetSuccess'));
        setTimeout(() => router.push('/mijn-account'), 1500);
        return;
      }

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
      const body = mode === 'login' ? { email, password } : { email, password, name, phone, locale };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        // Show resend verification option when email not verified
        if (data.needsVerification) {
          setError(data.error || t('account.errorVerifyEmail'));
          setShowResendVerification(true);
          if (data.email) setResendEmail(data.email);
          return;
        }
        setError(data.error || t('account.errorGeneral'));
        return;
      }

      // Registration: show verification message (no auto-login)
      if (mode === 'register' && data.needsVerification) {
        setSuccess(t('account.successRegisterVerify'));
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
              src="/images/campings/begur_sa_tuna.jpg"
              alt="Costa Brava strand"
              fill
              className="object-cover"
             
            />
          </div>
          <div className="relative z-10 flex flex-col justify-center p-10 xl:p-14 w-full">

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

          </div>
        </div>

        {/* ====== RIGHT SIDE — FORM ====== */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Mobile hero header */}
          <div className="lg:hidden bg-primary-dark px-5 pt-6 pb-10">
            <h1 className="text-2xl font-bold text-white">
              <TypewriterText text={modeTitle} />
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {modeSubtitle}
            </p>
          </div>

          {/* Form container */}
          <div className="flex-1 flex items-start justify-center px-4 sm:px-8 lg:px-12 xl:px-16 -mt-4 lg:mt-0 lg:pt-[8vh]">
            <div className="w-full max-w-[420px] py-6 lg:py-0">
              {/* Desktop heading */}
              <div className="hidden lg:block mb-8">
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">
                  <TypewriterText text={modeTitle} />
                </h1>
                <p className="text-muted text-sm mt-1.5">
                  {modeSubtitleDesktop}
                </p>
              </div>

              {/* Form card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-5 sm:p-7"
              >
                {/* Tab switcher / Back button */}
                {(mode === 'forgot-password' || mode === 'reset-password') ? (
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className="flex items-center gap-2 text-sm font-semibold text-primary mb-5 hover:text-primary-dark transition-colors"
                  >
                    <ArrowLeft size={16} /> {t('account.backToLogin')}
                  </button>
                ) : (
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
                    }`} > {t('account.tabRegister')} </button> </div>
                )} {/* Error / Success messages */} <AnimatePresence mode="wait"> {error && ( <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-danger/5 text-danger text-sm p-3.5 rounded-xl mb-4 border-danger/20" > <div className="flex items-start gap-2.5"><AlertCircle size={16} className="shrink-0 mt-0.5" /> <span className="leading-relaxed">{error}</span></div> {showResendVerification && ( <button type="button" onClick={async () => { setResendingVerification(true); try { await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resendEmail || email }) }); setError(''); setSuccess(t('account.verificationResent')); setShowResendVerification(false); } catch {} setResendingVerification(false); }} disabled={resendingVerification} className="mt-2 w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50" > {resendingVerification ? t('account.resending') : t('account.resendVerification')} </button> )} </motion.div> )} {success && ( <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-start gap-2.5 bg-primary-50 text-primary-dark text-sm p-3.5 rounded-xl mb-4 border-primary-100" > <CheckCircle size={16} className="shrink-0 mt-0.5" /> <span className="leading-relaxed">{success}</span> </motion.div> )} </AnimatePresence> <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Name (register only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="block text-xs font-semibold text-foreground-light mb-1.5">{t('account.labelName')}</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('account.placeholderName')} required={mode === 'register'} className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email (not shown in reset-password) */}
                  {mode !== 'reset-password' && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground-light mb-1.5">{t('account.labelEmail')}</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('account.placeholderEmail')} required autoComplete="email" className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" />
                      </div>
                    </div>
                  )}

                  {/* Password (not shown in forgot-password) */}
                  {mode !== 'forgot-password' && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground-light mb-1.5">
                        {mode === 'reset-password' ? t('account.resetPasswordLabel') : t('account.labelPassword')}
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' || mode === 'reset-password' ? t('account.placeholderPasswordNew') : '••••••••'} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full pl-10 pr-12 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {mode === 'login' && (
                        <p className="text-xs text-muted mt-1.5">
                          <button type="button" onClick={() => { setMode('forgot-password'); setError(''); setSuccess(''); }} className="text-primary font-medium hover:underline">
                            {t('account.forgotPassword')}
                          </button>
                        </p>
                      )}
                      {(mode === 'register' || mode === 'reset-password') && password.length > 0 && (
                        <div className="mt-2.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-surface-alt'}`} />
                            ))}
                          </div>
                          <p className={`text-xs mt-1 font-medium ${passwordStrength <= 1 ? 'text-danger' : 'text-primary'}`}>
                            {strengthLabels[passwordStrength]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Phone (register only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <label className="block text-xs font-semibold text-foreground-light mb-1.5">{t('account.labelPhone')} <span className="text-muted font-normal">{t('account.optional')}</span></label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 12345678" className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Terms checkbox (register only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
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
                      <>
                        {mode === 'forgot-password' ? t('account.sendResetLink') :
                         mode === 'reset-password' ? t('account.savePassword') :
                         mode === 'login' ? t('account.btnLogin') : t('account.btnRegister')}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer switch */}
                <div className="mt-5 pt-4 text-center text-sm text-muted">
                  {(mode === 'forgot-password' || mode === 'reset-password') ? (
                    <p>
                      <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-primary font-semibold">
                        {t('account.backToLogin')}
                      </button>
                    </p>
                  ) : mode === 'login' ? (
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

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    }>
      <AccountPageInner />
    </Suspense>
  );
}