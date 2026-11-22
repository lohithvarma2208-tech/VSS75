'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import BackgroundVideo from '@/components/common/BackgroundVideo';
import { useApp } from '@/lib/context/AppContext';
import { DEMO_USERS } from '@/lib/data/sample-data';
import type { UserProfile } from '@/types';

interface CaptchaChallenge {
  image: string;
  challengeId: string;
}

const inputClass = 'w-full rounded-2xl border border-white/15 bg-[#0B0F19] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400';
const buttonClass = 'rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 disabled:opacity-50';

async function sendErpRequest(body: Record<string, string>) {
  const response = await fetch('/api/auth/erp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ERP sign-in is temporarily unavailable.');
  return data;
}

export default function LoginForm() {
  const router = useRouter();
  const { setCurrentUser } = useApp();
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [busy, setBusy] = useState<'captcha' | 'login' | null>(null);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');

  function openDemo(user: UserProfile) {
    sessionStorage.setItem('vss_show_benefits_ad', 'true');
    setCurrentUser(user);
    router.push('/dashboard');
  }

  async function loadCaptcha() {
    setBusy('captcha');
    setError('');
    setChallenge(null);
    setCaptcha('');
    try {
      const data = await sendErpRequest({ action: 'challenge' });
      if (!data.image || !data.challengeId) throw new Error('The CAPTCHA was unavailable.');
      setChallenge({ image: data.image, challengeId: data.challengeId });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not load the CAPTCHA.');
    } finally {
      setBusy(null);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || busy) return;

    setBusy('login');
    setError('');
    setPassword('');
    setCaptcha('');
    setChallenge(null);

    try {
      await sendErpRequest({ action: 'login', username, password, captcha, challengeId: challenge.challengeId });
      window.location.replace('/auth/erp/profile');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not sign in to KL ERP.');
      setBusy(null);
    }
  }

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <BackgroundVideo src="/videos/vault-of-knowledge.mp4" opacity={0.85} overlayStyle="obsidian" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <Link href="/" aria-label="VSS home" className="inline-flex select-none">
            <span className="h-12 w-12 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white flex items-center justify-center font-black text-xl">
              VSS
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign in with KL ERP
          </h1>
        </div>

        <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5 text-white">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p role="alert" className="rounded-xl bg-rose-500/15 p-3 text-sm text-rose-200">{error}</p>}

            <label className="block space-y-1 text-sm font-semibold">
              <span>ERP username</span>
              <input className={inputClass} autoComplete="username" required maxLength={64} value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-semibold">
              <span>ERP password</span>
              <input className={inputClass} type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {challenge && (
                // The response is a short-lived data URL scoped to this CAPTCHA.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={challenge.image} alt="ERP CAPTCHA challenge" className="rounded-md bg-white" width={120} height={50} />
              )}
              <button type="button" className={buttonClass + ' inline-flex items-center gap-2'} onClick={loadCaptcha} disabled={!!busy}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {busy === 'captcha' ? 'Loading CAPTCHA…' : challenge ? 'New CAPTCHA' : 'Load CAPTCHA'}
              </button>
            </div>

            {challenge && (
              <label className="block space-y-1 text-sm font-semibold">
                <span>Characters shown in the image</span>
                <input className={inputClass} autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={32} value={captcha} onChange={(event) => setCaptcha(event.target.value)} />
              </label>
            )}

            <button type="submit" disabled={!challenge || !!busy} className="w-full min-h-12 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-4 font-extrabold text-white disabled:opacity-50">
              {busy === 'login' ? 'Verifying with KL ERP…' : 'Sign in'}
            </button>
          </form>

          <section aria-labelledby="demo-profiles" className="space-y-2 border-t border-white/10 pt-4">
            <h2 id="demo-profiles" className="text-xs font-bold text-white/80">VSS demo profiles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_USERS.map((user) => (
                <button key={user.id} type="button" onClick={() => openDemo(user)} className={buttonClass}>
                  {user.code_name || user.full_name}
                </button>
              ))}
            </div>
          </section>

          <div className="text-center border-t border-white/10 pt-4 text-xs text-white/60">
            <Link href="/auth/register" className="font-bold text-[#D8B4FE] hover:underline">
              Register an anonymous profile
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
