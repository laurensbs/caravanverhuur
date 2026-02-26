'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ClipboardList, CreditCard, Search, UserCircle } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

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
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, name, phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Er is een fout opgetreden');
        return;
      }

      if (mode === 'register') {
        setSuccess('Account aangemaakt! Je wordt doorgestuurd...');
      }

      setTimeout(() => router.push('/mijn-account'), 500);
    } catch {
      setError('Verbindingsfout. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile-first compact header */}
      <div className="bg-primary py-8 sm:py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </h1>
          <p className="text-white/70 text-sm mt-2">
            {mode === 'login'
              ? 'Bekijk je boekingen, betalingen en meer'
              : 'Maak een account aan om je boekingen te beheren'}
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 px-4 -mt-4 pb-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 sm:p-8"
          >
            {/* Tab switcher */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
                }`}
              >
                Inloggen
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
                }`}
              >
                Registreren
              </button>
            </div>

            {/* Error / Success */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-600 text-sm p-3 rounded-xl mb-4"
                >
                  <CheckCircle size={16} className="shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (register only) */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Je volledige naam"
                        required={mode === 'register'}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@voorbeeld.nl"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimaal 6 tekens' : '••••••••'}
                    required
                    minLength={mode === 'register' ? 6 : undefined}
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Wachtwoord vergeten? <Link href="/contact" className="text-primary hover:underline">Neem contact op</Link>
                  </p>
                )}
                {mode === 'register' && password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= i * 3
                            ? password.length >= 10 ? 'bg-emerald-500' : password.length >= 6 ? 'bg-amber-500' : 'bg-red-400'
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {password.length < 6 ? 'Te kort' : password.length < 10 ? 'Redelijk' : 'Sterk'}
                    </p>
                  </div>
                )}
              </div>

              {/* Phone (register only) */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer <span className="text-gray-400">(optioneel)</span></label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+31 6 12345678"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              {mode === 'register' && (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="acceptTerms" className="text-xs text-gray-500 leading-relaxed">
                    Ik ga akkoord met de{' '}
                    <Link href="/voorwaarden" className="text-primary underline" target="_blank">Algemene Voorwaarden</Link>{' '}
                    en het{' '}
                    <Link href="/privacy" className="text-primary underline" target="_blank">Privacybeleid</Link>.
                  </label>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-70 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
              {mode === 'login' ? (
                <p>Nog geen account? <button onClick={() => setMode('register')} className="text-primary font-medium">Registreer gratis</button></p>
              ) : (
                <p>Al een account? <button onClick={() => setMode('login')} className="text-primary font-medium">Log in</button></p>
              )}
            </div>
          </motion.div>

          {/* Info cards */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { icon: <ClipboardList size={20} className="text-primary" />, title: 'Boekingen', desc: 'Bekijk al je boekingen' },
              { icon: <CreditCard size={20} className="text-primary" />, title: 'Betalingen', desc: 'Betaalstatus volgen' },
              { icon: <Search size={20} className="text-primary" />, title: 'Borg', desc: 'Checklist inzien' },
              { icon: <UserCircle size={20} className="text-primary" />, title: 'Profiel', desc: 'Gegevens beheren' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <div className="text-xs font-semibold text-gray-800 mt-1">{item.title}</div>
                <div className="text-[11px] text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
