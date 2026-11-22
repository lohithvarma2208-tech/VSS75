'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';

interface CaptchaChallenge { image: string; challengeId: string; }

async function sendErpRequest(body: Record<string, string | boolean>) {
  const response = await fetch('/api/auth/erp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ERP sign-in is temporarily unavailable.');
  return data;
}

const fieldClass = 'w-full rounded-2xl border border-white/[0.09] bg-white/[0.045] px-4 py-3.5 text-sm text-white placeholder:text-white/25 transition focus:border-violet-400/60 focus:bg-white/[0.06] focus:outline-none';

export default function LoginForm() {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [busy, setBusy] = useState<'captcha' | 'login' | null>(null);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const captchaInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (challenge) captchaInput.current?.focus(); }, [challenge]);

  async function loadCaptcha() {
    setBusy('captcha'); setError(''); setChallenge(null); setCaptcha('');
    try {
      const data = await sendErpRequest({ action: 'challenge' });
      if (!data.image || !data.challengeId) throw new Error('The CAPTCHA was unavailable.');
      setChallenge({ image: data.image, challengeId: data.challengeId });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not load the CAPTCHA.');
    } finally { setBusy(null); }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || busy) return;
    setBusy('login'); setError('');
    try {
      await sendErpRequest({ action: 'login', username, password, captcha, challengeId: challenge.challengeId, acceptedTerms });
      setPassword(''); setCaptcha(''); setChallenge(null);
      window.location.replace('/auth/erp/profile');
    } catch (failure) {
      setPassword(''); setCaptcha(''); setChallenge(null);
      setError(failure instanceof Error ? failure.message : 'Could not sign in to KL ERP.');
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-6xl items-stretch lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.07] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,.22),transparent_36%),radial-gradient(circle_at_90%_85%,rgba(59,130,246,.12),transparent_35%)]" />
        <Link href="/" className="relative inline-flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to VSS</Link>
        <div className="relative max-w-md">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-400 text-black"><LockKeyhole className="h-5 w-5" /></div>
          <h1 className="mt-8 text-5xl font-extrabold leading-[1.02] tracking-[-0.055em]">Everything you need.<br /><span className="text-violet-300">Only when you need it.</span></h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/42">Verify your student access, then get back to notes, labs, and projects without the clutter.</p>
        </div>
        <p className="relative flex items-center gap-2 text-[10px] font-semibold text-white/30"><ShieldCheck className="h-3.5 w-3.5" /> Your ERP password is not stored by VSS.</p>
      </section>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-white/45 lg:hidden"><ArrowLeft className="h-4 w-4" /> VSS home</Link>
          <p className="vss-kicker">Student access</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Sign in to VSS</h2>
          <p className="mt-2 text-xs leading-5 text-white/38">Use your KL ERP details to verify your student profile.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            {error && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3.5 text-xs leading-5 text-rose-200">{error}</p>}
            <label className="block"><span className="mb-2 block text-[11px] font-bold text-white/55">ERP username</span><input className={fieldClass} autoComplete="username" required maxLength={64} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Student ID" /></label>
            <label className="block"><span className="mb-2 block text-[11px] font-bold text-white/55">ERP password</span><span className="relative block"><input className={`${fieldClass} pr-12`} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-3">
              {challenge ? <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={challenge.image} alt="ERP CAPTCHA challenge" className="h-auto w-full rounded-2xl bg-white object-contain p-2" width={360} height={150} />
                <input ref={captchaInput} className={fieldClass} autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={32} value={captcha} onChange={(event) => setCaptcha(event.target.value)} placeholder="Type the characters shown" />
                <button type="button" onClick={loadCaptcha} disabled={!!busy} className="inline-flex items-center gap-2 px-1 text-[10px] font-bold text-white/40 hover:text-white disabled:opacity-40"><RefreshCw className="h-3 w-3" /> Use another image</button>
              </div> : <button type="button" onClick={loadCaptcha} disabled={!!busy} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs font-bold text-white/65 hover:bg-white/[0.07] disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${busy === 'captcha' ? 'animate-spin' : ''}`} />{busy === 'captcha' ? 'Loading verification image…' : 'Load verification image'}</button>}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 text-[10px] leading-4 text-white/42">
              <input type="checkbox" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-violet-400" />
              <span>I agree to the VSS terms and consent to live verification with KL ERP. VSS stores my verified student profile and login-consent record, but never my ERP password, CAPTCHA answer, or ERP cookies.</span>
            </label>

            <button type="submit" disabled={!challenge || !captcha.trim() || !acceptedTerms || !!busy} className="vss-button min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-35">{busy === 'login' ? 'Verifying…' : <>Continue <ArrowRight className="h-4 w-4" /></>}</button>
          </form>

          <p className="mt-6 text-center text-[10px] text-white/28">Independent student community · Not an official ERP portal</p>
        </div>
      </main>
    </div>
  );
}
